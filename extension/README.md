# RepFlow Browser Extension

A Chrome extension (Manifest V3) that lets you search, copy, and insert spiels directly from any browser tab.

## Setup

### 1. Generate an API Token

1. Sign in to your RepFlow workspace.
2. Navigate to **My Account** (avatar menu → Account).
3. Under **Browser Extension**, click **Generate Token**.
4. Copy the token — it is shown only once.

### 2. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/` folder from this repository.

### 3. Configure the Extension

1. Click the RepFlow icon in your toolbar (or find it in the Extensions puzzle menu).
2. Click **⚙** (settings) or right-click the icon → **Options**.
3. Enter your **RepFlow URL** (e.g. `https://your-domain.com`).
4. Paste your **API Token**.
5. Click **Save Settings**.

## Using the Popup

- Click the RepFlow toolbar icon to open the popup.
- Type in the search box to filter spiels by title or content.
- **Copy** — copies the plain-text version to your clipboard.
- **Insert** — injects the spiel into the focused field on the active page:
  - Rich-text (`contenteditable`) elements receive the HTML version.
  - Plain `<textarea>` and `<input>` fields receive the plain-text version.

## Revoking a Token

Go to **My Account → Browser Extension** and click **Revoke** next to the token.
