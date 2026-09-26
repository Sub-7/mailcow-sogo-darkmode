#!/usr/bin/env bash
# SOGo Dark Mode for mailcow - updater
# https://github.com/Sub-7/mailcow-sogo-darkmode
#
# Run as root on the mailcow host:
#   bash /opt/mailcow-sogo-darkmode/update.sh             update to the latest version (asks before restarting SOGo)
#   bash /opt/mailcow-sogo-darkmode/update.sh --check     only show whether an update is available
#   bash /opt/mailcow-sogo-darkmode/update.sh --rollback  switch back to the previously installed version
#   bash /opt/mailcow-sogo-darkmode/update.sh --yes       don't ask before restarting SOGo
#
# mailcow directory: /opt/mailcow-dockerized, or set MAILCOW_DIR=/path/to/mailcow-dockerized
#
# What it does:
#   1. git pull of this folder (fast-forward only) and verification of SHA256SUMS
#   2. backup of the installed script as data/conf/sogo/custom-darkmode.js.bak
#   3. copy of the new script to data/conf/sogo/custom-darkmode.js
#   4. restart of the SOGo container (and its memcached), nothing else
#   5. check that nginx serves the new file
# It never changes mailcow's own files. Nothing happens unless you run it.

REPO_URL='https://github.com/Sub-7/mailcow-sogo-darkmode.git'

info() { echo -e "\e[36m$*\e[0m"; }
ok()   { echo -e "\e[32m$*\e[0m"; }
warn() { echo -e "\e[33m$*\e[0m"; }
die()  { echo -e "\e[31m$*\e[0m" >&2; exit 1; }

usage() {
  sed -n '5,9p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

# Version from a script given on stdin ("var VERSION" or the header line of older versions)
version_of() {
  local s v
  s=$(cat)
  v=$(printf '%s\n' "$s" | grep -m1 -oE "var VERSION = '[^']+'" | cut -d"'" -f2 || true)
  if [ -z "$v" ]; then
    v=$(printf '%s\n' "$s" | grep -m1 -oE '^ \* Version [0-9][0-9.]*' | awk '{print $3}' || true)
  fi
  echo "${v:-unknown}"
}

main() {
  set -euo pipefail

  local MODE=update ASSUME_YES=no arg
  for arg in "$@"; do
    case "$arg" in
      --check|-c)  MODE=check ;;
      --rollback)  MODE=rollback ;;
      --yes|-y)    ASSUME_YES=yes ;;
      --help|-h)   usage; return 0 ;;
      *)           echo "Unknown option: $arg"; usage; return 2 ;;
    esac
  done

  local REPO_DIR MAILCOW MC_JS BACKUP OVERRIDE TARGET
  REPO_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
  MAILCOW="${MAILCOW_DIR:-/opt/mailcow-dockerized}"
  MC_JS="$MAILCOW/data/conf/sogo/custom-darkmode.js"
  BACKUP="$MC_JS.bak"
  OVERRIDE="$MAILCOW/docker-compose.override.yml"

  [ "$(id -u)" -eq 0 ] || die "Please run as root."
  [ -f "$MAILCOW/mailcow.conf" ] || die "mailcow not found in $MAILCOW (set MAILCOW_DIR=/path/to/mailcow-dockerized)."
  [ -d "$REPO_DIR/.git" ] || die "$REPO_DIR is not a git clone. Get one with: git clone $REPO_URL /opt/mailcow-sogo-darkmode"
  [ -f "$MC_JS" ] || die "Dark mode is not installed ($MC_JS is missing). See README -> Installation."
  TARGET=$(grep -v '^[[:space:]]*#' "$OVERRIDE" 2>/dev/null | grep 'custom-darkmode\.js' \
    | grep -oE '/[^:[:space:]]*/WebServerResources/js/theme\.js' | head -n1 || true)
  [ -n "$TARGET" ] || die "No custom-darkmode.js mount found in $OVERRIDE. See README -> Installation."

  local -a DC
  if docker compose version >/dev/null 2>&1; then
    DC=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    DC=(docker-compose)
  else
    die "Neither 'docker compose' nor 'docker-compose' found."
  fi

  confirm() {
    [ "$ASSUME_YES" = yes ] && return 0
    local answer
    read -r -p "$1 [y/N] " answer || return 1
    [[ "$answer" =~ ^([yY]|[yY][eE][sS])$ ]]
  }

  restart_and_verify() {
    local expected="$1" served i
    info "Restarting SOGo ..."
    (cd "$MAILCOW" && "${DC[@]}" up -d --no-deps --force-recreate sogo-mailcow && "${DC[@]}" restart memcached-mailcow) \
      || die "Restarting SOGo failed. Check with: cd $MAILCOW && ${DC[*]} ps"
    info "Waiting until SOGo has published the new file (up to 3 minutes) ..."
    for i in $(seq 1 36); do
      served=$(cd "$MAILCOW" && "${DC[@]}" exec -T nginx-mailcow sha256sum "$TARGET" 2>/dev/null | cut -d' ' -f1 || true)
      if [ "$served" = "$expected" ]; then
        ok "nginx serves the new file."
        return 0
      fi
      sleep 5
    done
    warn "nginx does not serve the new file yet. Check again later with:"
    warn "  cd $MAILCOW && ${DC[*]} exec nginx-mailcow sha256sum $TARGET"
    warn "  (expected: $expected)"
  }

  # ---------- Rollback ----------
  if [ "$MODE" = rollback ]; then
    [ -f "$BACKUP" ] || die "No previous version found ($BACKUP)."
    local cur_ver old_ver
    cur_ver=$(version_of < "$MC_JS")
    old_ver=$(version_of < "$BACKUP")
    confirm "Switch back from $cur_ver to $old_ver? SOGo (webmail, CalDAV/CardDAV, ActiveSync) restarts for a few seconds." \
      || { echo "Aborted, nothing changed."; return 0; }
    # Swap both files, so running --rollback again returns to the newer version
    cp -a "$MC_JS" "$MC_JS.swap"
    cp "$BACKUP" "$MC_JS"
    mv "$MC_JS.swap" "$BACKUP"
    restart_and_verify "$(sha256sum "$MC_JS" | cut -d' ' -f1)"
    ok "Now running $old_ver. Reload SOGo in the browser with Ctrl+Shift+R."
    echo "Run --rollback again to return to $cur_ver."
    return 0
  fi

  # ---------- Check / update ----------
  info "Checking GitHub for the latest version ..."
  git -C "$REPO_DIR" fetch --quiet origin || die "Could not reach GitHub (git fetch failed)."
  local BRANCH REMOTE_REF
  BRANCH=$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)
  REMOTE_REF="origin/$BRANCH"

  local installed_hash latest_hash installed_ver latest_ver
  installed_hash=$(sha256sum "$MC_JS" | cut -d' ' -f1)
  latest_hash=$(git -C "$REPO_DIR" show "$REMOTE_REF:custom-darkmode.js" | sha256sum | cut -d' ' -f1)
  installed_ver=$(version_of < "$MC_JS")
  latest_ver=$(git -C "$REPO_DIR" show "$REMOTE_REF:custom-darkmode.js" | version_of)
  echo "Installed: $installed_ver"
  echo "Latest:    $latest_ver"

  if [ "$installed_hash" = "$latest_hash" ]; then
    ok "Already up to date."
    return 0
  fi

  if [ "$MODE" = check ]; then
    warn "Update available: $installed_ver -> $latest_ver"
    echo "To install it, run: bash $REPO_DIR/update.sh"
    return 0
  fi

  # Was the installed file changed locally (e.g. DEFAULTS)? Compare with every published version.
  local known=no c
  for c in $(git -C "$REPO_DIR" log --format=%H "$REMOTE_REF" -- custom-darkmode.js); do
    if [ "$(git -C "$REPO_DIR" show "$c:custom-darkmode.js" | sha256sum | cut -d' ' -f1)" = "$installed_hash" ]; then
      known=yes
      break
    fi
  done
  if [ "$known" = no ]; then
    warn "Your installed custom-darkmode.js differs from every published version (for example changed DEFAULTS)."
    warn "It will be replaced. Your file is kept as $BACKUP, re-apply your changes afterwards."
  fi

  git -C "$REPO_DIR" pull --quiet --ff-only \
    || die "git pull failed. Are there local changes in $REPO_DIR? Check with: git -C $REPO_DIR status"
  (cd "$REPO_DIR" && sha256sum --quiet -c SHA256SUMS) \
    || die "Checksum verification failed. Nothing was installed."
  [ "$(sha256sum "$REPO_DIR/custom-darkmode.js" | cut -d' ' -f1)" = "$latest_hash" ] \
    || die "Downloaded file does not match the expected version. Nothing was installed."

  confirm "Install $latest_ver now? SOGo (webmail, CalDAV/CardDAV, ActiveSync) restarts for a few seconds." \
    || { echo "Aborted, nothing was installed."; return 0; }

  cp -a "$MC_JS" "$BACKUP"
  cp "$REPO_DIR/custom-darkmode.js" "$MC_JS"
  restart_and_verify "$latest_hash"
  ok "Updated $installed_ver -> $latest_ver. Reload SOGo in the browser with Ctrl+Shift+R."
  echo "Previous version saved as $BACKUP (undo with: bash $REPO_DIR/update.sh --rollback)"
}

main "$@"; exit $?
