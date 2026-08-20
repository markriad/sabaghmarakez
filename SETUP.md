# Setup guide

Your site is already on GitHub and already publishing through Cloudflare, so
this starts from there rather than from the beginning. It covers what you
actually do week to week: putting a new version up, editing content, and the
two things that still need doing once.

The original from-scratch instructions — creating the repo, connecting
Cloudflare, pointing the domain — are in `SETUP-FIRST-TIME.md` if the site ever
has to be rebuilt or handed over.

## What's in this folder

| | |
|---|---|
| `index.html` | Homepage |
| `ramla.html`, `crescent-walk.html`, `district-5.html` | The three project pages |
| `thank-you.html` | Where the form sends people. Ad conversions fire here |
| `404.html` | Shown if someone mistypes a URL |
| `admin/` | The editing panel |
| `content/` | What the panel edits. Don't edit these by hand |
| `assets/` | Styles, scripts, photos, logos |
| `robots.txt` | **Nothing for you to do.** See below |
| `wrangler.toml` | Cloudflare's settings. Leave alone |
| `*.md` | These guides. They don't affect the site |

### About `robots.txt`

Nothing to do with it, ever. It's a one-line instruction to Google saying
"index the site, but not the admin panel." It's already correct. Every website
has one — it isn't a task.

---

# Putting a new version up

1. Go to your repository on GitHub
2. **Add file** → **Upload files**
3. Drag in everything from the new folder — all six `.html` files, the `admin`,
   `assets` and `content` folders, and the loose files. Wait for every upload to
   finish
4. **Commit changes**

Cloudflare rebuilds by itself, usually live in about a minute. Watch it under
**Workers & Pages** → your project → **Deployments**.

> **A new build overwrites `content/settings.json`.** If you changed the phone
> number, WhatsApp number or tracking IDs in the panel, check them after
> uploading — the file in the package wins. The same is true of any text you
> edited in the panel: whatever is in the upload replaces it.
>
> The safe habit: make content changes in the **panel**, not by uploading, and
> use uploads only for design changes I send you.

> **If a build hangs on "Initializing"** for more than a few minutes, that's
> Cloudflare's side — it fails before it has even read your files. Cancel and
> retry. If it keeps happening you can publish from your own computer instead:
> install Node, then run `npx wrangler deploy` in this folder. Your
> `wrangler.toml` already points at the right project.

---

# Using the admin panel

Open `your-domain.com/admin`. Five sections in the sidebar.

## 1. My details

Phone and WhatsApp, the form's destination, and your tracking IDs. The numbers
feed every call and message button across all six pages — change them once and
they change everywhere.

## 2–5. Homepage, Ramla, Crescent Walk, District 5

**Logos** — Marakez in the header, the project logo in the hero. Transparent PNG
or SVG: roughly 340 × 100 for the header, 480 × 120 for the hero. Both are held
at a fixed height and shown whole. Leave empty and the word "Marakez" shows
instead of an image.

**Key facts under the headline** — the short figures beside the hero form
(*400 acres — on the bay*). Up to four fit on one line before they wrap. Leave
the list empty and the strip disappears.

**Prices and payment** *(project pages only)*

- **Homes from** — the starting price. Leave it empty and the whole price band
  is hidden
- **Payment plans** — one row per plan. The headline figures on the band
  ("from 10% down", "up to 8 years") are worked out from these rows, so you
  never type them twice. For a cash plan, put 100 in down and 0 in years
- **Current offers** — leave empty for none. Every offer needs an end date, and
  **it removes itself from the site the day after that date passes.** Nothing to
  remember to take down. More than three at once and the block gets taller than
  the band above it

**Photos on this page** — every photo slot in one group: the hero, the section
photo, the masterplan, and each property-type or office card.

You can't break the layout with a photo. Each slot is a fixed shape and fits
whatever you give it, so an odd-sized image is cropped or letterboxed rather
than stretching the page. Uploads are converted to WebP and scaled down
automatically, so a photo straight off a camera won't slow the site down. Each
field shows its target size, and `IMAGES.md` has the full list.

Leave a slot empty to keep the photo that's already there.

**Darken the hero image** — Light / Medium / Strong. If the headline is hard to
read over your photo, pick Strong.

**Property types** — each has a name, an availability setting, and its options.

| Availability | What happens |
|---|---|
| Available | Normal |
| Few left | Amber badge, still selectable |
| Sold out | Greyed out, struck through, can't be picked in the form |

**Options** is what the form asks after someone picks that type — bedrooms for
homes, floor area for offices. Separate them with a bar (`3|4|5`), though commas
or one per line work too. Leave a type's options empty and the form doesn't ask
a follow-up for it.

**Office formats** *(District 5 only)* — the same, for Mindhaus. These appear
when someone chooses "Office space" in the form.

**English text** and **Arabic text** — two collapsible groups holding every
heading and paragraph on the page.

> **Blank means unchanged.** Leave an Arabic field empty and the site shows the
> English. Leave a field empty in both and the page keeps the text it shipped
> with. Nothing disappears because a box was left blank.

### The italic bit in headings

Headings have a coloured italic tail — *"Four kinds of home, **one shoreline.**"*
Two fields control it:

- **Headline** — the whole line, including the italic part
- **Which words are italic?** — copy those exact words from the headline

If the second doesn't match text in the first, the heading renders plain.
Harmless, just not styled.

## After saving

Saving commits to GitHub, which triggers a Cloudflare rebuild. Live in about a
minute.

---

# Two things still outstanding

## 1. Update the Google Sheet script

**Until you do this, some lead details are being thrown away.**

The form now sends more than the sheet script knows about: which property type,
how many bedrooms or how much floor area, whether it's a home or an office
enquiry, and the company name on office enquiries. The script writes a fixed
list of columns and silently drops anything else, with no error anywhere.

`SHEET-SETUP.md` has the current script and the steps. It's a paste and a
redeploy, plus deleting the header row once so it rewrites with the new columns.

## 2. Fill in the real bedroom counts and office areas

The numbers in the panel are sensible market defaults, not figures from the
brochures — none of the four lists bedrooms by unit type. Correct them under
**Property types** → **options** on each project page.

---

# Where the leads go

Into your Google Sheet, through the Apps Script.

For an email on every lead: in the Sheet, **Tools** → **Notification settings**
→ **Edit notifications** → *A user submits a form* → *Email — right away*.

For ad tracking see `TRACKING.md`. The short version: the form sends people to
`thank-you.html?project=ramla` (or `crescent-walk` / `district-5`), so you can
build a separate conversion per project from the URL alone.

---

# Before you go live

- [ ] Replace the placeholder prices — currently EGP 12.5M, 18M and 9M
- [ ] Fill in the real bedroom counts and office area ranges
- [ ] Update the Google Sheet script
- [ ] Send a test enquiry from each project page and check the row arrives
- [ ] Add the Crescent Walk and District 5 project logos — only Ramla's is in
- [ ] Swap the placeholder photos for proper renders
- [ ] Set your tracking IDs in **1. My details** if you're running ads

---

# If something goes wrong

**The panel won't save.** Your GitHub login expired. Sign out of the panel and
back in.

**Sign-in fails and the popup URL contains `WORKER_URL` or `/admin/WORKER_URL/`.**
`admin/config.yml` has placeholder values instead of real ones. Open it on
GitHub and check the `backend` block reads `repo: markriad/sabaghmarakez` and
`base_url: https://sveltia-cms-auth.markriad.workers.dev`. Packages from
before August 2026 shipped placeholders there and wiped the real values on
upload.

**The sign-in popup shows a GitHub 404 page.** The worker is sending a client
ID that GitHub doesn't recognise. Look at the popup's address bar: if it reads
`client_id=Client+ID+from+4.3` or similar, the placeholder text from the guide
was saved instead of the real value. Replace `GITHUB_CLIENT_ID` and
`GITHUB_CLIENT_SECRET` on the worker with the actual values from
[github.com/settings/developers](https://github.com/settings/developers), then
deploy the new version.

**The panel says "OAuth app client ID or secret is not configured".** The
worker is running a version that predates the secrets. Saving a secret in
Cloudflare creates a new version but doesn't start serving it. Go to the worker
→ **Deployments**: if the *"Add secret…"* row in Version History is newer than
the **Active deployment** shown at the top, open the `···` menu on that row and
deploy it. Full checklist in `SETUP-FIRST-TIME.md`, step 4.4.

**Signing in fails, or the panel says the domain isn't allowed.** Check
`ALLOWED_DOMAINS` on the Cloudflare worker. It must list the domain the admin
panel is served from — `dev-marakez.com, *.dev-marakez.com` — not the worker's
own address.

**Signing in fails with `redirect_uri_mismatch`.** The URL registered on the
GitHub OAuth app doesn't match the worker. Go to
[github.com/settings/developers](https://github.com/settings/developers) →
your app → check the **Redirect URI** is the worker address ending in
`/callback`. GitHub renamed this field in August 2026; on older screens it's
called the Authorization callback URL, and it's the same thing.

**A change didn't appear.** Check **Deployments** in Cloudflare — the build may
still be running or may have failed. Then hard-refresh (Ctrl+Shift+R, or
Cmd+Shift+R on a Mac).

**The form says it isn't connected.** The Apps Script URL in **1. My details**
is missing or wrong.

**A photo looks cropped oddly.** The slot is a fixed shape and crops from the
centre. Use the size shown under the field, or crop it yourself first.

**Everything looks broken after an upload.** You probably uploaded some files
and not others. Re-upload the whole folder — GitHub keeps every previous
version, so nothing is lost.

**Recovering the admin login** — see `SETUP-FIRST-TIME.md`.
