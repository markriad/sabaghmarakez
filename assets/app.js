/* Marakez project pages — behaviour
   Loads content from content/*.json (written by the CMS at /admin),
   handles the language toggle, price rendering and form submission. */

(function () {
  "use strict";

  var KEY = "mes-lang";
  var SETTINGS = {};
  var PROJECT = null;

  var FILES = { ramla: "ramla", crescent: "crescent", district5: "district5" };

  function base() {
    var path = location.pathname;
    return path.slice(0, path.lastIndexOf("/") + 1);
  }

  function loadJSON(name) {
    return fetch(base() + "content/" + name + ".json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error(name + " " + r.status);
        return r.json();
      });
  }

  function boot() {
    var host = document.querySelector("[data-project]");
    var key = host && FILES[host.getAttribute("data-project")];

    var jobs = [loadJSON("settings").then(function (d) { SETTINGS = d || {}; })];
    if (key) jobs.push(loadJSON(key).then(function (d) { PROJECT = d || null; }));

    Promise.all(jobs.map(function (p) {
      return p.catch(function (e) { console.error("Content load failed:", e); });
    })).then(function () {
      fillContact();
      applyImages();
      applyLang(currentLang());
      initForms();
      initReveal();
    });
  }

  /* --- Language --- */

  function currentLang() {
    try { return localStorage.getItem(KEY) || "en"; } catch (e) { return "en"; }
  }

  function applyLang(lang) {
    var ar = lang === "ar";
    document.body.setAttribute("dir", ar ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[lang]").forEach(function (el) {
      var match = el.getAttribute("lang") === lang;
      el.classList.toggle("is-shown", match);
      el.classList.toggle("is-hidden", !match);
    });

    document.querySelectorAll("[data-en]").forEach(function (el) {
      var v = el.getAttribute(ar ? "data-ar" : "data-en");
      if (v !== null) el.textContent = v;
    });

    document.querySelectorAll("[data-ph-en]").forEach(function (el) {
      var v = el.getAttribute(ar ? "data-ph-ar" : "data-ph-en");
      if (v !== null) el.setAttribute("placeholder", v);
    });

    document.querySelectorAll(".lang").forEach(function (b) {
      b.textContent = ar ? "English" : "العربية";
      b.setAttribute("aria-label", ar ? "Switch to English" : "التبديل إلى العربية");
    });

    try { localStorage.setItem(KEY, lang); } catch (e) {}
    renderPricing(lang);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest(".lang");
    if (b) applyLang(currentLang() === "ar" ? "en" : "ar");
  });

  /* --- Contact --- */

  function setAll(sel, val) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (val) el.textContent = val;
    });
  }

  function fillContact() {
    var waBase = "https://wa.me/" + (SETTINGS.whatsapp || "");

    document.querySelectorAll("[data-wa]").forEach(function (el) {
      var msg = el.getAttribute("data-wa") || "";
      el.setAttribute("href", waBase + (msg ? "?text=" + encodeURIComponent(msg) : ""));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });

    document.querySelectorAll("[data-tel]").forEach(function (el) {
      el.setAttribute("href", "tel:" + (SETTINGS.phone || ""));
      if (!el.textContent.trim()) el.textContent = SETTINGS.phone || "";
    });

    setAll("[data-agent-name-en]", SETTINGS.name_en);
    setAll("[data-agent-name-ar]", SETTINGS.name_ar);
    setAll("[data-agent-title-en]", SETTINGS.title_en);
    setAll("[data-agent-title-ar]", SETTINGS.title_ar);
  }

  /* --- Images --- */

  function normalise(p) { return p ? p.replace(/^\//, "") : ""; }

  function applyImages() {
    if (!PROJECT) return;

    var hero = document.querySelector("[data-hero-img]");
    if (hero && PROJECT.heroImage) hero.setAttribute("src", normalise(PROJECT.heroImage));

    var list = PROJECT.gallery || [];
    if (!list.length) return;

    document.querySelectorAll("[data-gallery] img").forEach(function (img, i) {
      var item = list[i];
      if (item && item.image) {
        img.setAttribute("src", normalise(item.image));
      } else {
        var fig = img.closest("figure");
        if (fig) fig.style.display = "none";
      }
    });
  }

  /* --- Prices --- */

  function renderPricing(lang) {
    var box = document.getElementById("pricing");
    if (!box || !PROJECT) return;

    var ar = lang === "ar", p = PROJECT, out = "";

    if (p.showPrices && p.prices && p.prices.length) {
      out += '<table class="ptable"><thead><tr>' +
             "<th>" + (ar ? "نوع الوحدة" : "Property type") + "</th>" +
             "<th>" + (ar ? "تبدأ من" : "Starting from") + "</th>" +
             "</tr></thead><tbody>";
      p.prices.forEach(function (r) {
        out += "<tr><td>" + esc(ar ? r.type_ar : r.type_en) + "</td><td>" + esc(r.from) + "</td></tr>";
      });
      out += "</tbody></table>";
      var note = ar ? p.priceNote_ar : p.priceNote_en;
      if (note) out += '<p class="pnote">' + esc(note) + "</p>";
    } else {
      var only = ar ? p.priceNote_ar : p.priceNote_en;
      out += '<p class="lead">' + esc(only || (ar ? "الأسعار متاحة عند الطلب" : "Prices available on request")) + "</p>";
    }

    if (p.paymentPlans && p.paymentPlans.length) {
      out += '<h3 class="pblock">' + (ar ? "خطط السداد" : "Payment plans") + "</h3>";
      p.paymentPlans.forEach(function (x) {
        out += '<div class="plan"><h4>' + esc(ar ? x.name_ar : x.name_en) + "</h4><p>" +
               esc(ar ? x.terms_ar : x.terms_en) + "</p></div>";
      });
    }

    if (p.offers && p.offers.length) {
      out += '<h3 class="pblock">' + (ar ? "العروض الحالية" : "Current offers") + "</h3>";
      p.offers.forEach(function (x) {
        out += '<div class="plan plan--offer"><h4>' + esc(ar ? x.name_ar : x.name_en) + "</h4><p>" +
               esc(ar ? x.terms_ar : x.terms_en) + "</p></div>";
      });
    }

    box.innerHTML = out;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* --- Form --- */

  function initForms() {
    document.querySelectorAll("form[data-lead]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();

        var ar = currentLang() === "ar";
        var msg = f.querySelector(".fmsg");
        var btn = f.querySelector("button[type=submit]");
        var url = SETTINGS.formEndpoint || "";

        if (f.querySelector("[name=company]").value) return;

        if (!url || url.indexOf("PASTE_") === 0) {
          show(msg, "err", ar
            ? "النموذج غير مُفعَّل بعد. برجاء التواصل عبر واتساب."
            : "The form isn't connected yet. Please use WhatsApp instead.");
          return;
        }

        var data = new FormData(f);
        data.append("project", f.getAttribute("data-lead"));
        data.append("language", ar ? "Arabic" : "English");
        data.append("submitted", new Date().toISOString());

        btn.disabled = true;
        var label = btn.textContent;
        btn.textContent = ar ? "جارٍ الإرسال..." : "Sending...";

        fetch(url, { method: "POST", body: data })
          .then(function () {
            f.reset();
            show(msg, "ok", ar
              ? "تم استلام طلبك. سيتواصل معك محمد قريباً."
              : "Thank you. Mohamed will be in touch shortly.");
          })
          .catch(function () {
            show(msg, "err", ar
              ? "تعذّر الإرسال. برجاء التواصل عبر واتساب."
              : "Couldn't send. Please reach out on WhatsApp instead.");
          })
          .then(function () {
            btn.disabled = false;
            btn.textContent = label;
          });
      });
    });
  }

  function show(el, cls, text) {
    if (!el) return;
    el.className = "fmsg " + cls;
    el.textContent = text;
  }

  /* --- Reveal --- */

  function initReveal() {
    var els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
