# SOGo Dark Mode for mailcow

A dark mode for the SOGo webmail in [mailcow-dockerized](https://github.com/mailcow/mailcow-dockerized) that survives mailcow and SOGo updates, plus a few layout options SOGo doesn't have on its own.

It is a single, readable JavaScript file. It does not modify any mailcow or SOGo file and can be removed completely in a few commands.

<!-- Screenshots: add before/after images here, e.g. ![Before and after](screenshots/before-after.png) -->

## Features

- **Dark mode** for mail, calendar, contacts and preferences: *Auto* (follows the system setting), *Dark* or *Off*
- **Toggle button** in SOGo's top right toolbar, keyboard shortcut **Alt+Shift+D**
- **Color sliders**: darkness, brightness, contrast, saturation, hue, warmth, plus presets
- **Header color** of your choice
- **Resizable areas**: folder pane, message list, header, user area. Drag the borders with the mouse or use the sliders. Double-click a border to reset it.
- **Text size per area**: folder pane, message list, reading pane, header, user area
- **English and German** interface, following the language set in SOGo
- **Settings per browser**: every user chooses their own, nothing is stored on the server

## Is it safe to try?

Yes. Here is exactly what it does and doesn't touch.

**On the server**
- Adds one file: `data/conf/sogo/custom-darkmode.js`
- Adds one line to `docker-compose.override.yml`. mailcow intends that file for local changes and never overwrites it.
- Optionally adds a small update hook, `post_update_hook.sh`, mailcow's official mechanism for custom steps after updates.
- It does **not** change any file of the mailcow repository (`git diff` stays empty), `mailcow.conf`, `sogo.conf`, the database or any mail data.

**If something goes wrong**
- The script only runs in the browser, separately from SOGo's own code. If it fails, SOGo simply looks like before.
- Every user can switch it *Off* in the panel or with Alt+Shift+D, and reset all settings with the *Reset* buttons.
- Installing, updating and removing only restart the SOGo container and its cache (memcached). Webmail, CalDAV/CardDAV and ActiveSync are unavailable for about 10–30 seconds. Mail delivery, IMAP and SMTP are **not** affected.
- It is fully reversible, see [Uninstall](#uninstall). After uninstalling, a checksum confirms that SOGo serves mailcow's original file again.

**In the browser.** The script runs with the same rights as SOGo's own JavaScript, so please review it before installing. It is one unminified file.
- No network access of any kind: no `fetch`, `XMLHttpRequest`, WebSocket or `sendBeacon`, no external resources, no `eval`, no cookies
- Stores only the localStorage key `sogoDarkModeSettings`
- Adds one `<style>` element, three own elements in Shadow DOM (button, settings panel, border handles) and two `data-sgdm-*` attributes. It also adds a style to the mail editor.
- Listens to the keyboard only for Alt+Shift+D and Esc and records nothing
- Does not read or process mail content

Check it yourself. This must print nothing:

```bash
grep -nE "fetch|XMLHttpRequest|WebSocket|sendBeacon|eval\(|Function\(|cookie" custom-darkmode.js
```

## Good to know before installing

- **`custom-theme.js`:** mailcow mounts `data/conf/sogo/custom-theme.js` as SOGo's `js/theme.js`. By default that file contains only a commented-out example. This dark mode takes that mount. If you customized `custom-theme.js` for your own SOGo colors, those won't load while the dark mode is installed. Your file itself is not touched.
- **HTML emails** with their own colors are shown inverted as well. Images, photos and avatars keep their normal colors.
- **How it works:** the whole page gets a CSS color filter. On very weak devices, scrolling can feel slightly less smooth.
- **Text size** needs CSS `zoom` support: current Chrome/Edge, Safari and Firefox 126 or newer.

## Try it first, without touching the server

1. Open SOGo in your browser, press **F12** and switch to **Console**.
2. Firefox only: Firefox blocks pasting into the console the first time and asks you to type a phrase by hand. In English it's `allow pasting`, in other languages a translation (German: `Einfügen erlauben`).
3. Paste the whole content of `custom-darkmode.js` and press Enter.

The dark mode button appears in the toolbar. This only affects the current tab until you reload the page. Settings you change are kept in the browser. To remove them, run `localStorage.removeItem('sogoDarkModeSettings')` in the console.

## Requirements

- mailcow-dockerized with SOGo. Tested with SOGo 5.12.
- Commands below use `docker compose`. With the standalone version, use `docker-compose`.
- Default mailcow path `/opt/mailcow-dockerized`. Adjust it if yours differs.

## Installation

Run everything **as root on the mailcow host**.

**1. Download and verify**

```bash
cd /tmp
git clone https://github.com/Sub-7/mailcow-sogo-darkmode.git
cd mailcow-sogo-darkmode
sha256sum -c SHA256SUMS
```

All lines must end with `OK`.

**2. Back up your override file (if you have one)**

```bash
cd /opt/mailcow-dockerized
[ -f docker-compose.override.yml ] && cp -a docker-compose.override.yml docker-compose.override.yml.bak-$(date +%F)
```

**3. Check the theme path mailcow uses**

```bash
grep -n 'js/theme.js' /opt/mailcow-dockerized/docker-compose.yml
```

Current mailcow shows `/usr/local/lib/GNUstep/SOGo/WebServerResources/js/theme.js`. If yours differs, use your path in step 5.

**4. Copy the script**

```bash
cp /tmp/mailcow-sogo-darkmode/custom-darkmode.js /opt/mailcow-dockerized/data/conf/sogo/custom-darkmode.js
```

**5. Add the mount**

*No `docker-compose.override.yml` yet:*

```bash
cp /tmp/mailcow-sogo-darkmode/docker-compose.override.yml.example /opt/mailcow-dockerized/docker-compose.override.yml
```

*You already have one:* don't replace it. Add only this line under `services:` → `sogo-mailcow:` → `volumes:`, and create those keys if they don't exist yet:

```yaml
      - ./data/conf/sogo/custom-darkmode.js:/usr/local/lib/GNUstep/SOGo/WebServerResources/js/theme.js:z
```

Check the result:

```bash
cd /opt/mailcow-dockerized
docker compose config -q && docker compose config | grep -B1 'js/theme.js'
```

The `source:` line above the target must show `custom-darkmode.js`.

**6. Add the update hook (recommended)**

It keeps the mount working if mailcow ever changes the theme path.

*No `post_update_hook.sh` yet:*

```bash
cp /tmp/mailcow-sogo-darkmode/post_update_hook.sh /opt/mailcow-dockerized/post_update_hook.sh
```

*You already have one:* append the block and keep your own hook as it is. Make sure your hook doesn't `exit` before its last line.

```bash
tail -n +2 /tmp/mailcow-sogo-darkmode/post_update_hook.sh >> /opt/mailcow-dockerized/post_update_hook.sh
```

**7. Activate**

```bash
cd /opt/mailcow-dockerized
docker compose up -d --no-deps --force-recreate sogo-mailcow
docker compose restart memcached-mailcow
```

**8. Verify.** Wait about 30–60 seconds first: SOGo copies its web files for nginx at the end of its startup.

```bash
cd /opt/mailcow-dockerized
sha256sum data/conf/sogo/custom-darkmode.js
docker compose exec nginx-mailcow sha256sum /usr/local/lib/GNUstep/SOGo/WebServerResources/js/theme.js
```

Both checksums must be identical. Then reload SOGo in the browser with **Ctrl+Shift+R**.

## Usage

- **Round button** in the top right toolbar, left of Calendar/Address Book/Mail: opens the settings.
- **Colors tab**: mode (Dark / Auto / Off), sliders, header color, presets.
- **Layout tab**: width of folder pane and message list, height of header and user area.
- **Text tab**: text size per area. Folder pane and message list can only be enlarged, because SOGo's list leaves gaps while scrolling at smaller sizes.
- **Borders**: hover over the border between two areas, then drag. Double-click resets it. Widths apply from a window width of 1024 px.
- **Alt+Shift+D** toggles dark mode on/off.
- The **↺** buttons reset a single value, *Reset* resets a whole tab.

## Server-wide defaults

At the top of `custom-darkmode.js`:

| Setting | Default | Meaning |
|---|---|---|
| `DEFAULTS.mode` | `'auto'` | `'auto'` follows the system, `'dark'` = dark for everyone by default, `'light'` = off by default |
| `DEFAULTS.*` | | Default values of all sliders |
| `SHOW_BUTTON` | `true` | `false` hides the button (shortcut still works) |
| `SHOW_HANDLES` | `true` | `false` disables draggable borders |
| `BUTTON_POSITION` | `'toolbar'` | or floating: `'bottom-left'`, `'bottom-right'`, `'top-left'`, `'top-right'` |

After editing, run step 7 and 8 again. Users who already changed a setting keep their own values.

## Updating to a new version

Copy the new `custom-darkmode.js` over the old one (step 4), then run steps 7 and 8. Users keep their settings.

## Uninstall

Run as root on the mailcow host. Keep this order: first remove the mount, then the file.

**1. Remove the mount.** Choose one:

- If you made the backup in installation step 2 and haven't changed the file since, restore it:
  ```bash
  cd /opt/mailcow-dockerized
  cp -a docker-compose.override.yml.bak-YYYY-MM-DD docker-compose.override.yml
  ```
- If `docker-compose.override.yml` contains nothing but the dark mode entry (created from the example), delete it:
  ```bash
  rm /opt/mailcow-dockerized/docker-compose.override.yml
  ```
- Otherwise delete only the dark mode line:
  ```bash
  sed -i '\#custom-darkmode\.js#d' /opt/mailcow-dockerized/docker-compose.override.yml
  ```

  If `sogo-mailcow:` → `volumes:` is empty afterwards, remove those empty keys too.

Check:

```bash
cd /opt/mailcow-dockerized
docker compose config -q && echo "config OK"
```

**2. Restart SOGo**

```bash
cd /opt/mailcow-dockerized
docker compose up -d --no-deps --force-recreate sogo-mailcow
docker compose restart memcached-mailcow
```

**3. Remove the files**

```bash
cd /opt/mailcow-dockerized
rm data/conf/sogo/custom-darkmode.js
```

For the hook, if `post_update_hook.sh` contains only the dark mode block:

```bash
rm /opt/mailcow-dockerized/post_update_hook.sh
```

Otherwise remove just the block and keep the rest of your hook:

```bash
sed -i '/# --- sogo-darkmode (begin) ---/,/# --- sogo-darkmode (end) ---/d' /opt/mailcow-dockerized/post_update_hook.sh
```

**4. Verify.** Wait about 30–60 seconds first.

```bash
cd /opt/mailcow-dockerized
sha256sum data/conf/sogo/custom-theme.js
docker compose exec nginx-mailcow sha256sum /usr/local/lib/GNUstep/SOGo/WebServerResources/js/theme.js
```

Both checksums identical means SOGo serves mailcow's original file again, exactly as before the installation. Reload SOGo with **Ctrl+Shift+R**.

The settings key in users' browsers (`sogoDarkModeSettings`) is harmless without the script. It disappears when the site data is cleared.

## Troubleshooting

- **The checksum in nginx is still the old one right after the restart:** wait a bit longer. SOGo copies its web files only at the end of its startup. Look for `Syncing web content with named volume` in `docker compose logs sogo-mailcow`.
- **No change in the browser:** reload with Ctrl+Shift+R. The browser may cache the old script.
- **`docker compose config` reports an error after editing the override:** usually wrong YAML indentation. Restore your backup from step 2.
- **The button appears floating at the bottom left instead of in the toolbar:** a future SOGo version may have changed its toolbar. Dark mode and settings still work, please open an issue.

## Known limitations

- HTML emails with their own colors are inverted too.
- In dark mode, very bright or very saturated header colors look slightly muted below 100 % darkness. The color swatch in the panel shows exactly what you get.
- Text size of folder pane and message list can't go below 100 %.
- Widths only apply from a window width of 1024 px. Below that, SOGo shows the folder pane as a slide-out menu.
- Settings are stored per browser, not per SOGo account.

## License

MIT, see [LICENSE](LICENSE). Not affiliated with mailcow or Alinto (SOGo).

Made by Sub-7 with the help of an AI assistant (Claude by Anthropic). Tested on a production mailcow server.
