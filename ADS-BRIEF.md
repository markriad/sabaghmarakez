# Advertising brief

Everything needed to start Google Search and Meta campaigns against this site.
Written to be pasted into a new conversation as the starting context.

---

## 1. What the site is

A four-project lead-generation site for Marakez developments in Egypt. It is
**not** the official Marakez website; every page says so in the top bar and the
footer. Leads go to a Google Sheet and are followed up by a Marakez
salesperson.

| Page | Project | Location |
|---|---|---|
| `/` | All four | — |
| `/ramla.html` | Ramla | Ras El Hekma, North Coast |
| `/crescent-walk.html` | Crescent Walk | East Cairo |
| `/district-5.html` | District 5 | New Katameya |
| `/shams-soma.html` | Shams Soma | Somabay, Red Sea |

Every page is a landing page: hero, full enquiry form beside the headline,
price band, one or two content sections. The form is above the fold on desktop.

---

## 2. Tracking — current state

**Nothing is live yet.** All five ID fields are empty. Filling any of them in
the admin panel installs that tag; no code change is needed.

| Field in the panel | What it installs | Status |
|---|---|---|
| `gtmId` | Google Tag Manager | empty |
| `ga4Id` | GA4 via gtag.js | empty |
| `adsId` | Google Ads | empty |
| `adsConversionLabel` | Ads conversion | empty |
| `metaPixelId` | Meta pixel + Lead event | empty |

> **Do not configure the same tag in two places.** If GTM fires GA4, Meta or
> Ads, leave those boxes empty. Otherwise every number doubles.

### What fires, and when

| Event | Where | Notes |
|---|---|---|
| `PageView` (Meta) | every page | on load |
| `view_project` | project pages only | not on thank-you or 404 |
| `form_start` | first interaction with the form | |
| `lead_submit` | on successful send | still on the form page |
| `thank_you_view` | thank-you page | **use this as the conversion** |
| `conversion` (Ads) | thank-you page | needs both Ads ID and label |
| `Lead` (Meta) | thank-you page | |
| `whatsapp_click`, `phone_click`, `scroll_75` | all pages | secondary signals |

`thank_you_view` carries `lead_project`, `lead_enquiry_type`,
`lead_property_type`, `lead_unit_size` and `lead_budget`. Register those as GA4
custom dimensions and every report can be split by project and unit type.

### Conversion URLs, one per project

The form redirects to a distinct URL, so a URL rule is enough to build a
separate conversion per campaign:

```
/thank-you.html?project=ramla
/thank-you.html?project=crescent-walk
/thank-you.html?project=district-5
/thank-you.html?project=shams-soma
```

### The double-count guard

A one-time token is written at submit and deleted on arrival. The dataLayer
event, the Ads conversion and the Meta Lead all check it, so a refresh, a
bookmark or a direct visit counts nothing. Verified by test.

**A URL-based conversion in Meta or Ads bypasses this** — it fires on their own
PageView, which this site does not control, so a refresh will be counted. If
the numbers drive budget, use the event, not the URL rule.

In private browsing, storage is blocked and the conversion will not fire. The
lead still reaches the sheet. Undercounting slightly was chosen over
double-counting.

### Consent

Consent Mode v2 is implemented. Outside the EEA everything defaults to
granted and no banner is shown. EEA visitors get a banner and tags stay denied
until they accept.

---

## 3. What lands in the sheet

Thirteen columns: received, project, name, phone, phone as typed, country,
email, budget, enquiry type, property type, bedrooms or floor area, company,
message.

> **Outstanding:** the Apps Script still needs the current version pasted and
> redeployed, plus the header row deleted once so it rewrites. Until then the
> last four columns are dropped. Steps in `SHEET-SETUP.md`.

Only name and phone are required. Budget, email, property type, bedrooms and
message are optional.

---

## 4. Verified facts for ad copy

Only use these. Everything here is from the brochures or the launch
announcement.

**Ramla** — Ras El Hekma, North Coast. 400 acres. 1.4 km of beach. Six
neighbourhoods. Natural tidal pools. A swimmable lagoon. Sports campus with
padel, tennis, football and a semi-Olympic pool. Adrère Amellal opening a
71-room nature lodge. Masterplan by WATG. Types: villa, twinhouse, townhouse,
chalet.

**Crescent Walk** — East Cairo, off Sokhna Road and South Teseen. 118 acres.
A continuous green spine with five parks; a private back gate from every home.
Cycling lane. Commercial park inside the gates. WATG masterplan, PBD
architecture. Types: villa, twinhouse, townhouse, private residence.

**District 5** — New Katameya. 268 acres. 7 min to Road 90, 8 to AUC, 13 to
Maadi, 19 to the airport. D5M mall, Mindhaus offices, Clubfive sports club,
Dstreet dining. Wadi Degla on the southern edge. Types: apartment, townhome,
court home (sold out), twinhouse, villa. Offices: Mindhaus Private, Twin, Quad,
Campus module, 600–2,400 sqm.

**Shams Soma** — Somabay, Red Sea. Marakez's first Red Sea project, with
Somabay. 83 acres (80 feddans, from the technical brochure). Low-density plan. Homes built around usable
outdoor space, with Red Sea views. Sales expected to open in 2026. No prices or
unit types announced.

### Do not use

- Prices. The three figures on the site are **placeholders** (EGP 12.5M / 18M /
  9M) and must be replaced before any campaign runs.
- Bedroom counts and unit sizes — currently market defaults, not confirmed.
- Any Shams Soma detail beyond the list above. Some outlets reported 100
  feddans and an EGP 40bn revenue target from unnamed sources; the official
  figure is 340,000 sqm and the revenue number is not buyer-facing.
- Competitor comparisons. None are on the site and none are substantiated.

---

## 5. Known constraints

- **Arabic** — every text field has an Arabic counterpart, but the Arabic
  content is only partly written. Check before running Arabic ads.
- **Photography** — Shams Soma has no images at all. Crescent Walk and
  District 5 have no project logo. Unit photos are neighbourhood shots standing
  in.
- **A build overwrites content.** Edits made in the panel are replaced by a
  file upload. Make content changes in the panel; use uploads only for design
  changes.

---

## 6. Where to start

1. Replace the placeholder prices, or hide the price band by clearing
   "Homes from" per project.
2. Update and redeploy the Google Sheet script.
3. Decide GTM or direct tags, then fill in the IDs in the panel.
4. Confirm `thank_you_view` fires with Tag Assistant and Meta's Test Events.
5. Build one conversion per project from the URLs above.
6. Then keywords and ad copy.
