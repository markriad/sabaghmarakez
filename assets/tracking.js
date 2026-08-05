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

  /* ---- Boot ------------------------------------------------------ */
  function boot() {
    var path = location.pathname;
    fetch(path.slice(0, path.lastIndexOf("/") + 1) + "content/settings.json",
          { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (st) {
        if (st.gtmId) loadGTM(st.gtmId);
        window.TRACKING = {
          gtmId: st.gtmId || "",
          ga4Id: st.ga4Id || "",
          adsId: st.adsId || "",
          adsLabel: st.adsConversionLabel || "",
          metaPixelId: st.metaPixelId || ""
        };
        maybeShowConsent();
        wire();
      })
      .catch(function () { wire(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
