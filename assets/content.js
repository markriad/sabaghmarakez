/* Content renderer.
   The HTML already contains readable text. This script overwrites it with
   whatever the CMS holds. If it never runs, the page still reads correctly —
   the CMS is an override layer, not the only source. */

(function () {
  "use strict";

  var KEY = "mes-lang";

  function lang() {
    try { return localStorage.getItem(KEY) || "en"; } catch (e) { return "en"; }
  }

  function base() {
    var p = location.pathname;
    return p.slice(0, p.lastIndexOf("/") + 1);
  }

  /* Pick the language block, falling back to English when Arabic is blank */
  function pick(data, path, idx, field) {
    var L = lang();
    function dig(src) {
      var v = src && src[path];
      if (!v) return "";
      if (idx === null || idx === undefined) return typeof v === "string" ? v : "";
      var item = v[idx];
      return item ? (item[field] || "") : "";
    }
    var val = L === "ar" ? dig(data.ar) : "";
    return val || dig(data.en);
  }

  function setText(el, value) {
    if (!el || !value) return;          // blank in CMS -> keep what's in the HTML
    el.textContent = value;
  }

  /* Headline with an italic tail: "Plain words <em>emphasis.</em>" */
  function setTitle(el, full, em) {
    if (!el || !full) return;
    if (em && full.indexOf(em) !== -1) {
      var head = full.slice(0, full.indexOf(em));
      el.innerHTML = "";
      el.appendChild(document.createTextNode(head));
      var e = document.createElement("em");
      e.textContent = em;
      el.appendChild(e);
    } else {
      el.textContent = full;
    }
  }

  function apply(data) {
    var L = lang();

    /* hero */
    setText(document.querySelector(".hero .kicker"), pick(data, "hero_kicker"));
    setTitle(document.querySelector(".hero h1"),
             pick(data, "hero_title"), pick(data, "hero_title_em"));
    setText(document.querySelector(".hero-in > p:not(.kicker)"), pick(data, "hero_text"));

    /* fact rail */
    document.querySelectorAll(".rail > div").forEach(function (cell, i) {
      setText(cell.querySelector("dt"), pick(data, "facts", i, "label"));
      var dd = cell.querySelector("dd");
      if (!dd) return;
      var v = pick(data, "facts", i, "value");
      var sub = pick(data, "facts", i, "sub");
      if (v) {
        var subEl = dd.querySelector(".sub");
        dd.childNodes[0] && (dd.childNodes[0].nodeValue = v);
        if (subEl && sub) subEl.textContent = sub;
      }
    });

    /* sections: eyebrow / heading / lead */
    var eyebrows = document.querySelectorAll(".inner .eyebrow, .form-sec .eyebrow");
    eyebrows.forEach(function (eb, i) {
      var num = eb.querySelector(".secnum");
      var label = pick(data, "sections", i, "eyebrow");
      if (label) {
        eb.innerHTML = "";
        if (num) eb.appendChild(num);
        eb.appendChild(document.createTextNode(label));
      }
      var wrap = eb.parentNode;
      setTitle(wrap.querySelector("h2"),
               pick(data, "sections", i, "title"),
               pick(data, "sections", i, "title_em"));
      setText(wrap.querySelector(".lead"), pick(data, "sections", i, "lead"));
    });

    /* pillars */
    document.querySelectorAll(".pillar").forEach(function (el, i) {
      setText(el.querySelector("h3"), pick(data, "pillars", i, "title"));
      setText(el.querySelector("p"),  pick(data, "pillars", i, "text"));
    });

    /* USPs */
    document.querySelectorAll(".usp").forEach(function (el, i) {
      setText(el.querySelector("h3"), pick(data, "usps", i, "title"));
      setText(el.querySelector("p"),  pick(data, "usps", i, "text"));
    });

    /* masterplan key */
    document.querySelectorAll(".mp-key li").forEach(function (li, i) {
      setText(li.querySelector(".k"), pick(data, "masterplanKey", i, "num"));
      var v = li.querySelector(".v");
      if (!v) return;
      var t = pick(data, "masterplanKey", i, "title");
      var sub = pick(data, "masterplanKey", i, "sub");
      var small = v.querySelector("small");
      if (t && v.childNodes[0]) v.childNodes[0].nodeValue = t;
      if (small && sub) small.textContent = sub;
    });

    /* tab panels */
    document.querySelectorAll(".panel").forEach(function (el, i) {
      setText(el.querySelector(".sub"), pick(data, "panels", i, "sub"));
      setText(el.querySelector("h3"),   pick(data, "panels", i, "title"));
      setText(el.querySelector("p"),    pick(data, "panels", i, "text"));
    });

    /* fixed copy */
    setText(document.querySelector(".fdis"), pick(data, "form_disclaimer"));
    setText(document.querySelector(".foot-dis p"), pick(data, "footer_disclaimer"));

    document.documentElement.setAttribute("lang", L);
  }

  /* Contact details from settings.json */
  function applySettings(st) {
    var L = lang();
    var wa = "https://wa.me/" + (st.whatsapp || "");
    document.querySelectorAll("[data-wa]").forEach(function (el) {
      var msg = el.getAttribute("data-wa") || "";
      el.setAttribute("href", wa + (msg ? "?text=" + encodeURIComponent(msg) : ""));
      el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener");
    });
    document.querySelectorAll("[data-tel]").forEach(function (el) {
      el.setAttribute("href", "tel:" + (st.phone || ""));
      if (st.phone) el.textContent = st.phone;
    });
    ["name_en","name_ar","title_en","title_ar"].forEach(function (k) {
      var v = st[k];
      if (!v) return;
      document.querySelectorAll("[data-agent-" + k.replace("_","-") + "]")
        .forEach(function (el) { el.textContent = v; });
    });
    if (st.formEndpoint) {
      window.SITE_SETTINGS = window.SITE_SETTINGS || {};
      window.SITE_SETTINGS.formEndpoint = st.formEndpoint;
    }
  }

  function boot() {
    fetch(base() + "content/settings.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(applySettings)
      .catch(function () {});

    var host = document.querySelector("[data-project]");
    if (!host) return;
    var file = host.getAttribute("data-project");
    if (file === "district5") file = "district5";

    fetch(base() + "content/" + file + ".json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        apply(data);
        document.addEventListener("lang:changed", function () { apply(data); });
      })
      .catch(function (e) { console.warn("Content override skipped:", e); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
