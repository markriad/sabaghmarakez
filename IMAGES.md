# Images — what size to upload

**Short version: you cannot break the layout with a photo.** Every image slot on
the site is a fixed shape. Whatever you upload gets fitted into that shape. If
the proportions don't match, the image is cropped or letterboxed — the box
itself never changes, so the page can't stretch, squash or shift.

The sizes below are what to aim for so nothing gets cropped in a way you didn't
intend. They are also repeated as a hint under every upload field in the panel,
so you don't need this page open while you work.

---

## The sizes

| Where it appears | Upload this | Shape | How it's fitted |
|---|---|---|---|
| Main image at the top (hero) | **1920 × 1080 px** | 16:9 | Cropped from the centre to fill |
| Photo in the About section | **1600 × 1000 px** | 16:10 | Cropped from the centre to fill |
| Masterplan drawing | **1600 × 1200 px** | 4:3 | Shown whole, never cropped |
| Neighbourhood / property type / office photos | **1200 × 900 px** | 4:3 | Cropped from the centre to fill |
| Project cards on the homepage | **1200 × 900 px** | 4:3 | Cropped from the centre to fill |
| Marakez logo (header) | **340 × 100 px**, transparent PNG or SVG | wide | Shown whole, 26 px tall |
| Project logo (hero) | **480 × 120 px**, transparent PNG or SVG | wide | Shown whole, 30 px tall |

**"Cropped to fill"** means the image is scaled up until it covers the whole box,
and whatever hangs over the edges is trimmed evenly from both sides. A tall
portrait photo in a wide slot will lose its top and bottom. Keep the subject near
the middle of the frame.

**"Shown whole"** is used for the masterplan and the logos, where cutting off an
edge would lose information. The image is scaled down until all of it fits, and
any leftover space around it stays blank.

---

## What happens when you upload

1. The panel converts the file to **WebP** and scales it down to fit within
   2400 × 2400 px. This happens in your browser, before anything is saved, so a
   40 MB photo straight off a camera becomes a few hundred KB.
2. The file is saved to `assets/img/uploads/`.
3. The page drops it into the slot at the fixed shape above.

Uploads are capped at 12 MB. If a file is rejected, it was larger than that
before conversion.

---

## Leaving a slot empty

Every slot falls back to the photo currently built into the page. Clearing a
field in the panel does not leave a blank space — it restores the original.
This is also why the site still looks right if the panel is ever unreachable.

---

## Where each slot lives in the panel

- **2. Homepage** → *Photos on this page* (hero), and *Project cards* → *Card photo*
- **3. Ramla** → *Photos on this page* — hero, About, masterplan, and the six neighbourhoods
- **4. Crescent Walk** → *Photos on this page* — hero, About, masterplan, and the four property types
- **5. District 5** → *Photos on this page* — hero, About, masterplan, the four home types and the four office slots

Logos are under *Logos* in each of the four page sections. Setting the Marakez
logo replaces the word "Marakez" in the header; leaving it empty keeps the text.

---

## A note for whoever maintains the code

The shapes are enforced in CSS, not by the CMS — `aspect-ratio` on the container
plus `object-fit` on the image. `assets/content.js` only sets `src`. Nothing sets
width or height from the uploaded file, which is what makes the guarantee hold
regardless of what gets uploaded.

If you add a new image slot, give it a fixed `aspect-ratio` and an `object-fit`
in the same pass, or it will be the one slot that can move the page.
