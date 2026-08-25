# Shams Soma content rebuild — handoff brief

Paste this into the conversation doing the site rebuild.

The tracking stack on this site is built, tested and live. This document is the
contract it depends on. Content and design may change freely. **Everything in
section 2 must survive the rebuild byte-for-byte.**

---

## 1. What is already live

| Layer | State |
|---|---|
| GTM container `GTM-K3N7LJM6` | Published, 6 tags, verified |
| GA4 `G-R3Y8D9XM4B` | 5 custom dimensions registered |
| Google Ads `AW-880058714` | 4 conversion actions, per-project labels |
| Meta pixel `1415565297111917` | Domain verified, Lead event confirmed |

Tags are delivered **only** through GTM. There are no hardcoded gtag, GA4 or
Meta snippets in the site source, and none must be added.

---

## 2. Invariants — do not change

### 2.1 The GTM ID field

The admin panel field `gtmId` must contain `GTM-K3N7LJM6`.

The other four fields — `ga4Id`, `adsId`, `adsConversionLabel`, `metaPixelId` —
**must remain empty.** Filling any of them installs a second copy of that tag
and doubles every number reported.

A deployment overwrites panel content. After deploying, `gtmId` must be
re-entered and verified (section 4).

### 2.2 dataLayer event names

These strings are wired to GTM triggers. Renaming any of them silently kills
the tag that depends on it:

```
view_project      form_start        lead_submit       thank_you_view
whatsapp_click    phone_click       scroll_75
```

`thank_you_view` is the conversion event. Google Ads and Meta both fire on it.

### 2.3 thank_you_view parameters

The push must carry all five, with these exact key names:

```
lead_project        lead_enquiry_type     lead_property_type
lead_unit_size      lead_budget
```

These are registered as GA4 custom dimensions. A renamed key produces a
permanently empty column — GA4 does not backfill.

### 2.4 lead_project values — exact strings

**This is the most fragile dependency in the build.** A GTM lookup table maps
these values to Google Ads conversion labels. The match is case-sensitive and
space-sensitive. A mismatch fires the conversion with an empty label, records
nothing, and reports no error anywhere.

| Page | `lead_project` must be exactly |
|---|---|
| Ramla | `Ramla` |
| District 5 | `District 5` |
| Crescent Walk | `Crescent Walk` |
| Shams Soma | `Shams Soma` |
| Homepage | `Homepage` |

Note `District 5` has a **space**, not a hyphen, even though its URL uses
`district-5`. Do not "tidy" these into slugs.

### 2.5 Thank-you page

Path is `/thank-you` (no `.html`). The query parameter must persist:

```
/thank-you?project=ramla
/thank-you?project=district-5
/thank-you?project=crescent-walk
/thank-you?project=shams-soma
/thank-you?project=homepage
```

The GTM deduplication variable reads `project` from this URL to prevent a page
refresh counting a second conversion. Changing the parameter name or its values
breaks that guard.

### 2.6 Consent Mode v2

Already implemented on-site. Defaults to granted outside the EEA; EEA visitors
get a banner and tags stay denied until acceptance. Do not add a second consent
manager — two CMPs deadlock each other.

### 2.7 Google Sheet

Thirteen columns. The Apps Script must remain deployed and current, or the last
four columns — property type, bedrooms/floor area, company, message — are
dropped. Lost values are not recoverable.

### 2.8 Content Security Policy

Currently **report-only**, so nothing is blocked. If it is ever switched to
enforcing, these must be allowlisted or all tracking dies:

```
googletagmanager.com    google-analytics.com
googleadservices.com    connect.facebook.net
```

---

## 3. What to change — Shams Soma

Sales are now open. The page is currently register-interest only and needs full
project content. Everything below is confirmed by the official technical
brochure.

**Location** — Somabay, Red Sea. Set on 80 feddans within Somabay's 10 million
sqm peninsula, where the sea meets land on three sides.

**Drive times** — Somabay Golf Academy 5 min · Cairo–Hurghada Road 10 min ·
Makadi Bay 25 min · Sahl Hasheesh 35 min · Hurghada Airport 40 min ·
El Gouna 55 min

**Masterplan** — Cascading with the natural terrain to maximise panoramic sea
views. Homes, a boutique hotel and social spaces connected by shaded walkable
green valleys (North Valley and South Valley). An infinity pool crowns the
highest point.

**Features** — Two private wooden piers (North and South Jetty) · beach
restaurant · sandy North and South beaches · boutique hotel inside the
masterplan · infinity pools · kids' play area · multi-purpose courts · workout
area · boardwalk and sunbathing decks · elevated decks · activity ring

**Unit types — sizes and bedrooms are confirmed and may be published**

| Type | BUA range | Bedrooms |
|---|---|---|
| Villa (VS1, VS2, VS3, VM1, VM2) | 212–320 sqm | 3–5 |
| Townhome (TH1A, TH1B, TH2) | 182–233 sqm | 3–4 |
| Chalet (CH-1A/1B/1C, CH-2A, CH-3A/3B/3C, CH-4A) | 102–165 sqm | 2–3 |
| Loft (LF-1A, LF-1B) | 119–123 sqm | 2 |
| Penthouse (PH1A) | 133 sqm | 2 |

> Shams Soma is the **only** project where bedroom counts and unit sizes may be
> published. The figures on Ramla, District 5 and Crescent Walk are unconfirmed
> market defaults and remain banned.

**Somabay destination amenities** — Championship Golf Course & Golf Academy ·
Soma Sports Arena · 7BFT Kite House · ORCA Dive Center · The Cascades Spa &
Thalasso · Somabay Marina · Habitat

> These belong to Somabay, not to Shams Soma. Describe them as being **at
> Somabay**, accessible to residents. Never as on-site project amenities.

---

## 4. Post-deployment verification — before any ad spend

Run in order. Do not skip 3, which is where a silent break would show.

1. **`gtmId` restored.** Panel field contains `GTM-K3N7LJM6`, saved. Other four
   fields empty.
2. **Tag present on page.** Load the live site, view source, find
   `GTM-K3N7LJM6`. If absent, nothing below will work.
3. **dataLayer strings intact.** GTM Preview → submit one lead per project →
   on each `thank_you_view`, open the Variables tab and confirm
   `dlv - lead_project` reads exactly `Ramla`, `District 5`, `Crescent Walk`,
   `Shams Soma`. Then confirm `lut - Ads conversion label` resolves to a
   non-empty value for the first three.
4. **All five parameters populated** on `thank_you_view`.
5. **Dedupe still works.** Refresh the thank-you page. The event will appear
   again, but `Thank You`, `Ads - Lead Conversion` and `Meta Lead` must show
   under **Tags Not Fired**.
6. **Sheet intact.** The test lead arrives with all thirteen columns.
7. **Delete the test rows** from the Sheet — a salesperson works from it.

If step 3 fails, stop. The tags will appear to fire normally while recording
nothing, and no error surfaces in any interface.

---

## 5. Do not put in page copy

- **Prices for Ramla, District 5 or Crescent Walk.** The figures on those pages
  are placeholders (EGP 12.5M / 18M / 9M) and must not appear anywhere.
- **Bedroom counts or unit sizes** for those three projects.
- **District 5 court homes** — sold out.
- **AEON** — sold out, and there is no page for it.
- **Shams Soma revenue figures or the "100 feddans" press figure** — not
  official. The confirmed figure is 80 feddans.
- **Competitor comparisons** — none are substantiated.
