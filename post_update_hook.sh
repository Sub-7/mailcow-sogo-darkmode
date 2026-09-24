#!/usr/bin/env bash
# --- sogo-darkmode (begin) ---
# mailcow's update.sh runs post_update_hook.sh after every update.
# This block keeps the dark mode mount on the same path that mailcow itself uses for js/theme.js.
# It only reads docker-compose.yml. It only writes to docker-compose.override.yml (after making
# a backup) if mailcow ever changes that path. Otherwise it changes nothing.
# Runs in a subshell, so it can be appended to an existing post_update_hook.sh safely.
(
  cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" || exit 0

  OVERRIDE=docker-compose.override.yml
  REGEX='/[^:[:space:]]*/WebServerResources/js/theme\.js'

  BASE_PATH=$(grep -oE "$REGEX" docker-compose.yml 2>/dev/null | head -n1)
  OVERRIDE_PATH=$(grep -v '^[[:space:]]*#' "$OVERRIDE" 2>/dev/null | grep 'custom-darkmode\.js' | grep -oE "$REGEX" | head -n1)

  if [ -z "$OVERRIDE_PATH" ]; then
    # Dark mode not installed (or already removed) - nothing to do
    exit 0
  fi

  if [ -z "$BASE_PATH" ]; then
    echo -e "\e[33m[sogo-darkmode] mailcow no longer mounts js/theme.js - please check the dark mode setup manually.\e[0m"
    exit 0
  fi

  if [ "$BASE_PATH" != "$OVERRIDE_PATH" ]; then
    echo -e "\e[33m[sogo-darkmode] Path changed: $OVERRIDE_PATH -> $BASE_PATH, updating $OVERRIDE ...\e[0m"
    cp -a "$OVERRIDE" "${OVERRIDE}.bak-$(date +%Y%m%d-%H%M%S)"
    sed -i "s#${OVERRIDE_PATH}#${BASE_PATH}#" "$OVERRIDE"
    if docker compose version >/dev/null 2>&1; then
      DC="docker compose"
    else
      DC="docker-compose"
    fi
    # Only restart SOGo if mailcow is running (respects update.sh --skip-start)
    if [ -n "$($DC ps -q sogo-mailcow 2>/dev/null)" ]; then
      $DC up -d --no-deps --force-recreate sogo-mailcow
      $DC restart memcached-mailcow
    fi
  fi

  echo -e "\e[32m[sogo-darkmode] Mount OK: $BASE_PATH\e[0m"
)
# --- sogo-darkmode (end) ---
