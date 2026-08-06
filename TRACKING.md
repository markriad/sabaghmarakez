# Tracking setup — Google Ads, GA4 and Meta

The site already sends every event you need. What's left is creating the
accounts and connecting them. Nothing fires until you paste in the IDs, so you
can deploy now and do this whenever you're ready.

## What the site already sends

| Event | When it fires |
|---|---|
| `view_project` | Any page loads (includes which project) |
| `form_start` | Someone touches the enquiry form |
| `lead_submit` | **The conversion.** Form sent successfully |
| `whatsapp_click` | Any WhatsApp button, incl. the sticky bar |
| `phone_click` | Any tap on the phone number |
| `scroll_75` | Reader reached 75% of the page |

`lead_submit` also carries `project`, `enquiry_type`, `budget`,
`property_types`, `email` and `phone_e164` — the last two power Enhanced
Conversions and Meta Advanced Matching, which recover conversions lost to
iOS and Safari.

Every event has a unique `event_id`. That's what lets Meta deduplicate the
browser event against the server one so a single lead isn't counted twice.

---

# Part 1 — Google Tag Manager (do this first)

Everything routes through GTM. One container, one ID in the admin panel.

**1.1** Go to [tagmanager.google.com](https://tagmanager.google.com) → **Create account**
- Account name: `Marakez — project pages`
- Country: Egypt
- Container name: your domain
- Target platform: **Web**

**1.2** Copy the container ID (`GTM-XXXXXXX`).

**1.3** In your site admin panel → **My details** → paste it into
**Google Tag Manager ID** → Save.

That's the only code change. Everything below happens inside GTM.

---

# Part 2 — Google Analytics 4

**2.1** [analytics.google.com](https://analytics.google.com) → **Admin** →
**Create** → **Property**. Name it, set timezone to Egypt and currency to EGP.

**2.2** Create a **Web** data stream for your domain. Leave **Enhanced
measurement** on. Copy the Measurement ID (`G-XXXXXXXXXX`).

**2.3** In GTM → **Tags** → **New**
- Tag type: **Google Tag**
- Tag ID: your `G-XXXXXXXXXX`
- Trigger: **Initialization — All Pages**
- Name it `GA4 — Base`

**2.4** Now a tag for the lead conversion. **Tags** → **New**
- Tag type: **Google Analytics: GA4 Event**
- Configuration tag: `GA4 — Base`
- Event name: `lead_submit`
- Event parameters: add `project`, `enquiry_type`, `budget`, `property_types`
  (each value set to a Data Layer Variable of the same name)
- Trigger: **Custom Event** with event name `lead_submit`
- Name it `GA4 — Lead`

**2.5** Repeat for `whatsapp_click` and `phone_click`. These are your soft
conversions — worth tracking because in Egypt a lot of buyers skip the form and
go straight to WhatsApp.

**2.6** Create the Data Layer Variables it needs: **Variables** →
**New** → **Data Layer Variable**, one each for `project`, `enquiry_type`,
`budget`, `property_types`, `event_id`.

**2.7** In GA4 → **Admin** → **Events**, mark `lead_submit` and
`whatsapp_click` as **Key events**.

---

# Part 3 — Google Ads

> **Important:** track each conversion from **one source only**. Either the
> native Google Ads tag or a GA4 import — not both, or you'll double-count and
> Smart Bidding will optimise on inflated numbers.
>
> Use the **native Google Ads tag** for `lead_submit`. It reports faster, which
> matters for bidding.

**3.1** In Google Ads → **Goals** → **Conversions** → **New conversion action**
→ **Website**
- Category: **Submit lead form**
- Conversion name: `Lead — enquiry form`
- Value: set one. Even a rough figure helps bidding — if a lead is worth roughly
  EGP 2,000 to you in expected commission, use that.
- Count: **One** (a person enquiring twice is still one lead)
- Click-through window: 30 days (property is a long decision)

**3.2** Choose **Use Google Tag Manager**. Note the **Conversion ID**
(`AW-XXXXXXXXX`) and **Conversion label**.

**3.3** In GTM → **Tags** → **New**
- Tag type: **Google Ads Conversion Tracking**
- Conversion ID and Label from 3.2
- Trigger: **Custom Event** → `lead_submit`
- Name it `Ads — Lead`

**3.4** Add a **Conversion Linker** tag on **All Pages** if one isn't there
already. Without it, Google can't tie the conversion back to the ad click.

**3.5** Turn on **Enhanced Conversions**: Google Ads → your conversion action →
**Enhanced conversions** → **Turn on** → **Google Tag Manager**. Then in the
`Ads — Lead` tag, open **User-provided data** → **New Variable** → map:
- Email → Data Layer Variable `email`
- Phone → Data Layer Variable `phone_e164`

The site already sends both in the correct format — phone as `+20...`, which is
what Google requires.

**3.6** Also create a secondary conversion for `whatsapp_click`, set to
**Secondary** so it doesn't feed bidding but you can still see it.

---

# Part 4 — Meta Pixel

**4.1** [business.facebook.com/events_manager](https://business.facebook.com/events_manager)
→ **Connect data** → **Web** → name it → **Create**. Copy the **Dataset ID**
(also called Pixel ID).

**4.2** In GTM → **Tags** → **New** → **Custom HTML**:

```html
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','YOUR_DATASET_ID');
fbq('track','PageView');
</script>
```

- Trigger: **All Pages**
- Name it `Meta — Base`

**4.3** The lead event. **Tags** → **New** → **Custom HTML**:

```html
<script>
fbq('track', 'Lead', {
  content_name: {{DLV - project}},
  content_category: {{DLV - enquiry_type}}
}, { eventID: {{DLV - event_id}} });
</script>
```

- Trigger: **Custom Event** → `lead_submit`
- Name it `Meta — Lead`

The `eventID` is what makes deduplication work if you add the Conversions API
later.

**4.4** Also add `Contact` on `whatsapp_click` — Meta treats it as a standard
event and optimises for it properly.

---

# Part 5 — Test before spending anything

**5.1** In GTM click **Preview**, enter your site URL. Submit a test enquiry and
watch the tags fire in the debug panel.

**5.2** Install **Google Tag Assistant** (Chrome extension) and confirm no
duplicate tags.

**5.3** Meta → **Events Manager** → **Test Events**. Open your site through the
test URL and submit an enquiry. `Lead` should appear within seconds.

**5.4** Check **Event Match Quality** in Events Manager. Below 6.0 means Meta
isn't matching your leads to accounts well — usually fixed by making sure email
and phone are being passed.

**5.5** In GA4 → **Reports** → **Realtime**, confirm your events appear.

**5.6** Only when all four check out: **Submit** in GTM to publish.

---

# Part 6 — Campaign notes for this site

**Google Search.** Send traffic to the project page, not the homepage —
someone searching "Ramla North Coast prices" should land on `/ramla.html`.
Use the sticky WhatsApp bar to your advantage: it's visible on every scroll
position on mobile, which is where most Egyptian search traffic comes from.

**Meta.** Objective **Leads**, optimising for the `Lead` event once you have
enough volume. Below ~50 conversions a week, optimise for `Contact`
(WhatsApp clicks) instead — you'll get more signal.

**Consent.** The site shows a cookie bar only to visitors it detects as being in
Europe. Egyptian visitors see nothing and everything is granted by default,
which is correct for Egyptian law. If you ever run ads into the EU, Consent Mode
v2 is already wired.

**UTM tags.** Always tag your ad URLs, e.g.
`?utm_source=google&utm_medium=cpc&utm_campaign=ramla-search`. GA4 picks these
up automatically, so you can see which campaign produced each lead in the same
Sheet as the lead itself.

---

# Later, if the numbers justify it

**Meta Conversions API** sends events from a server as well as the browser,
recovering conversions lost to iOS opt-outs — Meta's own figures suggest
meaningfully lower cost per result. It needs a server-side endpoint, so it's a
real piece of work, not a settings toggle. Worth doing once monthly ad spend
makes the effort pay back.

Because every event already carries a unique `event_id`, the deduplication side
is done — a CAPI setup would slot in without touching the site.

---

## Tagging the thank-you page

After a successful submit the visitor lands on **`/thank-you.html`**. That gives
you a URL to tag, which is the simplest way to set up a conversion in Meta or
Google Ads.

### Meta — all projects together

Events Manager → Custom Conversions → Create:

- Rule: **URL contains** `thank-you`
- Category: Lead

### Meta — one conversion per project

Each project lands on its own URL, so make three custom conversions:

| Project | Rule: URL contains |
|---|---|
| Ramla | `project=ramla` |
| Crescent Walk | `project=crescent-walk` |
| District 5 | `project=district-5` |

Point each campaign at its own conversion and Meta optimises that project's ad
set against that project's leads, rather than pooling all three.

### Google Ads

Conversions → New → Website, then set the destination URL rule to contain
`thank-you`. Or use the `thank_you_view` event below through GTM, which is more
precise.

### Through Google Tag Manager

The page pushes one event when — and only when — someone has genuinely just
submitted:

```
thank_you_view
  lead_project        Ramla / Crescent Walk / District 5
  lead_enquiry_type   Residential / Office
  lead_property_type  Villa, Apartment, Mindhaus Private …
  lead_unit_size      3 bedrooms, 1,200 – 2,400 sqm …
  lead_budget         the range they picked
```

Trigger on the **Custom Event** `thank_you_view`. The extra fields let you see
which project and which unit type your ad spend is actually producing, not just
how many leads.

`lead_submit` still fires on the form page at the moment of sending. Use
**one** of the two as your conversion, not both, or every lead counts twice.
`thank_you_view` is the better choice: it only fires once the send succeeded.

### Why refreshes don't inflate your numbers

The form leaves a one-time token before redirecting, and the thank-you page
fires only if it finds one, then deletes it. So a refresh, a bookmark, a
back-then-forward, or anyone opening the URL directly counts nothing. The page
is also `noindex`, so it stays out of search results.

One trade-off: in private browsing, storage is blocked, the token can't be
written and the conversion won't fire. **The lead still reaches your sheet** —
only the ad platform misses it. That's deliberate. Undercounting a few is far
less damaging than counting every refresh as a new lead and optimising your
budget against numbers that aren't real.

---

## Keeping each project's leads separate

Three places carry the project, and you can use any or all of them.

| Where | What you get | Setup |
|---|---|---|
| **The sheet** | A "Project(s)" column on every row | Already working |
| **The URL** | `thank-you.html?project=ramla` | Three custom conversions, above |
| **The GTM event** | `lead_project` on `thank_you_view` | One trigger, split by parameter |

### In GA4

`thank_you_view` carries `lead_project`, `lead_enquiry_type`, `lead_property_type`,
`lead_unit_size` and `lead_budget`. Register those as custom dimensions once and
every report can be broken down by project — and further by whether the enquiry
was for a home or an office, and which unit type.

That's more useful than three separate conversions, because you can ask "which
project produces the most villa enquiries" rather than only "how many leads did
Ramla get".

### One caveat worth understanding

A **URL-based** conversion in Meta fires on the Pixel's PageView. That is not
under this site's control, so if someone refreshes the thank-you page, Meta
counts it again.

The **event-based** route (`thank_you_view` through GTM) is protected — it fires
once per genuine submission and never on a refresh, a bookmark or a direct
visit.

So: URL rules are quicker to set up and slightly over-count. The GTM event is
exact. If the numbers matter for budget decisions, use the event.
