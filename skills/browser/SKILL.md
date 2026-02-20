---
name: browser
description: "Controls a real Chromium browser via Playwright. Use for: opening URLs, logging into websites, taking screenshots, clicking elements, filling forms, and posting to social media."
metadata:
  openclaw:
    emoji: "🌐"
    requires:
      bins: ["node"]
    install:
      - id: playwright-chromium
        kind: npm
        package: playwright-core
        label: "Playwright Core (browser engine)"
---

# Browser Skill

Controls a real Chromium browser via Playwright Core. All scripts auto-detect
the system Chrome/Chromium installation. If none is found, set the
`CREATIVECLAW_BROWSER_PATH` env var to the full path of your Chrome executable.

## Security

> **All social media posting actions require Guardian approval.**
> The agent will ask for confirmation before executing `facebook_post`,
> `instagram_post`, or `content_pipeline`.

Sessions are stored encrypted in `skills/browser/sessions/`. This directory is
git-ignored. Set `CREATIVECLAW_SESSION_KEY` (min 32 chars) for AES-256-GCM
encryption. Without it, sessions are stored as plaintext (dev only).

## Tools

### `open_url` — Open a URL and return the page title

```bash
node skills/browser/scripts/open_url.js --url <url> [--headed] [--timeout <ms>]
```

### `login` — Log into a website and save session

```bash
node skills/browser/scripts/login.js \
  --url <login-page-url> \
  --email-selector <css> \
  --password-selector <css> \
  --email <email> \
  --password <password> \
  --platform <name>   # used to name the saved session file
```

### `screenshot` — Take a screenshot of a page

```bash
node skills/browser/scripts/screenshot.js \
  --url <url> \
  --output <path/to/output.png> \
  [--platform <name>]   # reuse saved session
```

### `click` — Click an element by CSS selector or visible text

```bash
node skills/browser/scripts/click.js \
  --url <url> \
  --selector <css>   # OR
  --text <visible-text>
```

### `fill_form` — Fill form fields and optionally submit

```bash
node skills/browser/scripts/fill_form.js \
  --url <url> \
  --fields '{"#email": "user@example.com", "#pass": "secret"}' \
  [--submit <submit-button-selector>]
```

### `facebook_post` — Post to Facebook (text + optional image)

```bash
node skills/browser/scripts/facebook_post.js \
  --message "Hello world!" \
  [--image /path/to/image.jpg] \
  [--group-url https://www.facebook.com/groups/yourgroup]
```

**Requires** a saved `facebook` session (run `login.js --platform facebook` first).

### `instagram_post` — Post an image to Instagram

```bash
node skills/browser/scripts/instagram_post.js \
  --image /path/to/image.jpg \
  --caption "Caption text #hashtag"
```

**Requires** a saved `instagram` session (run `login.js --platform instagram` first).

### `content_pipeline` — Full pipeline: Prompt → Image → Social Post

```bash
node skills/browser/scripts/content_pipeline.js \
  --prompt "A vibrant sunset over the ocean" \
  --message "Good evening! 🌅" \
  --platforms facebook,instagram \
  [--image-script skills/openai-image-gen/scripts/generate.js]
```
