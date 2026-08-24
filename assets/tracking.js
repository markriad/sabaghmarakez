/* Tracking — GA4, Google Ads and Meta, via Google Tag Manager.
   ------------------------------------------------------------------
   Put your IDs in content/settings.json (or the admin panel).
   Nothing fires until an ID is present, so the site is safe to deploy
   before the ad accounts exist.

   Events pushed to dataLayer:
     lead_submit      — enquiry form sent successfully
     whatsapp_click   — any WhatsApp button or link
     phone_click      — any tel: link
     view_project     — a project page loaded
     form_start       — first interaction with the enquiry form
     scroll_75        — reached 75% of the page
*/

(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];
  function dl() { window.dataLayer.push(arguments[0]); }

  /* ---- Consent Mode v2 -------------------------------------------
     Defaults must be set BEFORE any tag loads. Egypt is outside the
     EEA so we grant by default, but EEA/UK visitors are denied until
     they choose — that keeps you compliant if you ever advertise there. */
  var EEA = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
             "IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES",
             "SE","IS","LI","NO","GB","CH"];

  function gtag() { window.dataLayer.push(arguments); }

  function guessRegion() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return tz.indexOf("Europe/") === 0 ? "EEA" : "OTHER";
    } catch (e) { return "OTHER"; }
  }

  var needsConsent = guessRegion() === "EEA";

  gtag("consent", "default", {
    ad_storage:          needsConsent ? "denied" : "granted",
    ad_user_data:        needsConsent ? "denied" : "granted",
    ad_personalization:  needsConsent ? "denied" : "granted",
    analytics_storage:   needsConsent ? "denied" : "granted",
    functionality_storage: "granted",
    security_storage:    "granted",
    wait_for_update:     500
  });

  window.grantConsent = function () {
    gtag("consent", "update", {
      ad_storage: "granted", ad_user_data: "granted",
      ad_personalization: "granted", analytics_storage: "granted"
    });
    try { localStorage.setItem("consent-ok", "1"); } catch (e) {}
    var bar = document.querySelector(".consent");
    if (bar) bar.remove();
  };

  window.denyConsent = function () {
    try { localStorage.setItem("consent-ok", "0"); } catch (e) {}
    var bar = document.querySelector(".consent");
    if (bar) bar.remove();
  };

  function maybeShowConsent() {
    if (!needsConsent) return;
    var seen;
    try { seen = localStorage.getItem("consent-ok"); } catch (e) {}
    if (seen === "1") { window.grantConsent(); return; }
    if (seen === "0") return;

    var bar = document.createElement("div");
    bar.className = "consent";
    bar.innerHTML =
      '<p>We use cookies to measure how our ads perform. You can decline without affecting the site.</p>' +
      '<div class="consent-btns">' +
      '<button type="button" class="cbtn cbtn--no">Decline</button>' +
      '<button type="button" class="cbtn cbtn--yes">Accept</button></div>';
    document.body.appendChild(bar);
    bar.querySelector(".cbtn--yes").addEventListener("click", window.grantConsent);
    bar.querySelector(".cbtn--no").addEventListener("click", window.denyConsent);
  }

  /* ---- Load GTM once we know the container ID -------------------- */
  function loadGTM(id) {
    if (!id || document.getElementById("gtm-script")) return;
    dl({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s = document.createElement("script");
    s.id = "gtm-script";
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);

    var n = document.createElement("noscript");
    n.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=' +
      encodeURIComponent(id) + '" height="0" width="0" ' +
      'style="display:none;visibility:hidden"></iframe>';
    document.body.insertBefore(n, document.body.firstChild);
  }

  /* ---- Event helpers -------------------------------------------- */
  function uid() {
    return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function track(name, extra) {
    var payload = { event: name, event_id: uid() };
    if (extra) Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    dl(payload);
  }
  window.trackEvent = track;

  /* ---- Auto-wired events ---------------------------------------- */
  function wire() {
    /* Only a real project page counts as a project view. This used to fire on
       any page that loaded the script, so the thank-you page — which every
       conversion passes through — logged a view of project "unknown". */
    var projectEl = document.querySelector("[data-project]");
    var page = projectEl ? (projectEl.getAttribute("data-project") || "") : "";
    if (projectEl) {
      track("view_project", { project: page });
    }

    document.addEventListener("click", function (e) {
      var wa = e.target.closest("[data-wa], .mobar .wa");
      if (wa) track("whatsapp_click", { project: page, location: wa.closest(".mobar") ? "sticky_bar" : "page" });

      var tel = e.target.closest("[data-tel]");
      if (tel) track("phone_click", { project: page });
    });

    var started = false;
    document.addEventListener("focusin", function (e) {
      if (started) return;
      if (e.target.closest("form[data-lead]")) {
        started = true;
        track("form_start", { project: page });
      }
    });

    var hit75 = false;
    window.addEventListener("scroll", function () {
      if (hit75) return;
      var pct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (pct >= 0.75) { hit75 = true; track("scroll_75", { project: page }); }
    }, { passive: true });
  }


  /* ---- Direct tag loaders ----------------------------------------------
     Only GTM used to be loaded here. The GA4, Google Ads and Meta pixel IDs
     were read from settings and then never used, so filling them in on the
     panel installed nothing — the tags only existed if someone also built
     them inside GTM.

     Each tag now loads when its own ID is present. If you ALSO configure the
     same tag inside GTM, it will fire twice and every number doubles, so put
     each tag in one place or the other, never both. --------------------- */

  function loadGtagJs(id) {
    if (document.getElementById("gtag-js")) return;
    var s = document.createElement("script");
    s.id = "gtag-js"; s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag("js", new Date());
  }

  function loadGA4(id) {
    if (!id) return;
    loadGtagJs(id);
    gtag("config", id);
  }

  function loadAds(id) {
    if (!id) return;
    loadGtagJs(id);
    gtag("config", id);
  }

  function loadMetaPixel(id) {
    if (!id || window.fbq) return;
    /* standard Meta bootstrap, kept verbatim so the pixel behaves as Meta expects */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.id = "meta-pixel";
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", id);
    window.fbq("track", "PageView");
  }

  /* Fire the platform conversions on the thank-you page, once, using the same
     one-time token the page already checks. */
  function fireConversions() {
    var t = window.TRACKING || {};
    if (!/thank-you/.test(location.pathname)) return;
    if (!window.__leadConfirmed) return;
    if (t.adsId && t.adsLabel) {
      gtag("event", "conversion", { send_to: t.adsId + "/" + t.adsLabel });
    }
    if (window.fbq) window.fbq("track", "Lead");
  }
  window.fireConversions = fireConversions;

  /* ---- Boot ------------------------------------------------------ */
  function boot() {
    var path = location.pathname;
    fetch(path.slice(0, path.lastIndexOf("/") + 1) + "content/settings.json",
          { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (st) {
        if (st.gtmId) loadGTM(st.gtmId);
        loadGA4(st.ga4Id);
        loadAds(st.adsId);
        loadMetaPixel(st.metaPixelId);
        window.TRACKING = {
          gtmId: st.gtmId || "",
          ga4Id: st.ga4Id || "",
          adsId: st.adsId || "",
          adsLabel: st.adsConversionLabel || "",
          metaPixelId: st.metaPixelId || ""
        };
        maybeShowConsent();
        wire();
        fireConversions();
      })
      .catch(function () { wire(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
