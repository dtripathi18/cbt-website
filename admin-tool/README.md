# CBT Programme Admin

A small tool that runs on your own computer for updating the CBT Course Series speakers, modules, venues and speaker photos. It rewrites `course-series/js/programme-data.js`, and every page of the site reads its programme from that file.

## Start it

```
cd admin-tool
npm install        # first time only
npm start
```

Then open http://localhost:5178. It only accepts connections from this computer.

## How Claude is used

Extraction runs **Claude Code** on this computer in its non-interactive mode (`claude -p`). It uses the subscription you're logged into Claude Code with, so there's no API key and no API billing. Each run counts toward your plan's usage like a normal Claude Code session. A full brochure takes about a minute.

- Claude Code must be installed and logged in. Run `claude` once in a terminal if it isn't.
- It runs read-only: only the Read tool, with no shell, web or file edits, and only inside that run's work folder in `admin-tool/staged/`.
- Any `ANTHROPIC_API_KEY` in the environment is removed before Claude Code starts, so it never switches to paid API billing.
- For each PDF, the tool writes every page as text and as an image, plus the candidate speaker photos cut out of it. Claude Code reads those files and returns the updated programme as schema-checked JSON. The tool then enforces the rules in code: blank results keep existing bios and photos, partial updates never remove anything, and ignored names never get in.
- Optional `.env` settings: `CLAUDE_BIN` (path to `claude` if it isn't on PATH) and `CLAUDE_MODEL` (default `opus`).

## Server login

The server login is kept in `C:\Users\<you>\.cbt-admin\.env`. That's outside the website folder, so it can't be uploaded with the site by mistake. You can point it somewhere else with the `CBT_ADMIN_ENV` environment variable.

| Setting | What it is |
|---|---|
| `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME` | Server login |
| `SSH_PRIVATE_KEY_PATH` or `SSH_PASSWORD` | A key file is preferred. Set one of the two |
| `SSH_REMOTE_ROOT` | Folder on the server that holds `index.html` and `course-series/` (default `/var/www/cbt/https/html`) |

Restart `npm start` after changing it.

## Using it

1. **Extract from documents.** Drag in the new brochure PDF, speaker bios, or photos.
   - Leave **complete programme** ticked when the documents cover the whole programme. Speakers and modules that are no longer in them will then be proposed for removal.
   - Untick it for partial updates, such as one new bio or photo.
   - Claude compares the documents with the current data. Photos embedded in a PDF are matched to speakers using the text printed beside them.
   - Names in the ignore list (e.g. student helpers) are never added.
2. **Review.** Every proposed change is listed: new or removed speakers, affiliation and name changes, module renames, venue and date changes, speakers moving between modules, and new bios and photos. Untick anything you don't want, then click **Apply selected changes**.
3. **Edit.** Fix anything by hand. Add or remove speakers from a module, add modules or days, drop a photo onto a speaker, or edit a bio. Problems such as two modules in one room on the same day, or a module with no title, block saving until they're fixed.
4. **Post to server.** This saves the data locally, then uploads it over SFTP:
   - It uploads `course-series/js/programme-data.js` and any new speaker photos (`course-series/assets/images/speakers/`).
   - It updates the `programme-data.js?v=` cache-buster in `index.html`, `register.html` and `thank-you.html` **on the server**. Only that value changes, so unpublished local edits to those pages are never uploaded.
   - Every server file it replaces is first downloaded to `admin-tool/backups/<timestamp>/`. To undo a post, upload those files back.

**Save locally** does step 4 without uploading, so you can preview the site from your computer first. **Load live data from server** replaces your working copy with what's currently live.

## One-time setup on the server

The tool only uploads data and photos. The site code that reads `programme-data.js` must be uploaded once, the normal way (e.g. WinSCP):

- `course-series/index.html`, `register.html`, `thank-you.html`
- `course-series/css/style.css`
- `course-series/js/programme-data.js`, `config.js`, `about.js`
- `course-series/assets/images/sponsors/`

Don't upload `admin-tool/`. It isn't part of the website.
