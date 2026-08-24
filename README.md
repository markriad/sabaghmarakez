# Marakez project pages

Six static pages, a lead form that writes to Google Sheets, and an admin panel
for editing everything without touching code.

```
index.html            Homepage — Marakez overview, three project cards
ramla.html            Ramla — North Coast
crescent-walk.html    Crescent Walk — East Cairo
district-5.html       District 5 — New Katameya
thank-you.html        Where the form sends people; ad conversions fire here
404.html              Shown if someone mistypes a URL

admin/                The editing panel  (your-site.com/admin)
content/              What the panel edits. Don't edit these by hand.
assets/               Styles, scripts, photos, logos
robots.txt            Nothing to do with this — see SETUP.md
```

## The guides

| File | What it's for |
|---|---|
| **`SETUP.md`** | **Start here.** Publishing an update, using the admin panel, what's still outstanding |
| `SHEET-SETUP.md` | The Google Sheet script. **Needs updating — leads are losing fields until you do** |
| **`ADS-BRIEF.md`** | **Everything needed to start advertising — paste into a new chat** |
| `TRACKING.md` | Meta and Google Ads conversions, including one per project |
| `IMAGES.md` | What size to upload for every photo slot |
| `SETUP-FIRST-TIME.md` | Building from nothing: repo, Cloudflare, domain, admin login. Already done |

You don't need `IMAGES.md` to avoid breaking anything — every slot is a fixed
shape and fits whatever you give it — but matching the sizes stops photos being
cropped unexpectedly.
