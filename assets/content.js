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

  /* ── Image slots ────────────────────────────────────────────────────────
     Every slot below has a fixed aspect ratio in CSS with object-fit, so an
     uploaded image is fitted into the box — it can never resize the box.
     Photo slots crop to fill (cover); the masterplan and the logos are shown
     whole (contain). Blank in the CMS means the built-in photo stays.
     Target sizes are listed in IMAGES.md and repeated as hints in the panel. */
  function setImg(el, path) {
    if (!el || !path) return;
    el.setAttribute("src", String(path).replace(/^\//, ""));
  }

  function applyImages(data) {
    var im = data.images || {};

    setImg(document.querySelector(".hero > img"), im.hero || data.heroImage);
    setImg(document.querySelector(".desc-fig img"), im.about);
    setImg(document.querySelector(".mp-fig img"), im.masterplan);
    setImg(document.querySelector(".about-fig img"), im.about2);
    setImg(document.querySelector(".usp-fig img"), im.why);

    /* neighbourhood / property-type / office panels, in page order */
    document.querySelectorAll(".panel figure img").forEach(function (el, i) {
      setImg(el, im["panel" + (i + 1)]);
    });

    /* homepage project cards, in page order */
    var cards = data.cards || [];
    document.querySelectorAll(".projcard figure img").forEach(function (el, i) {
      setImg(el, cards[i] && cards[i].image);
    });
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


  /* ── Prices, payment plans and offers ───────────────────────────────────
     The band renders from the CMS. Two rules built in on purpose:
       1. "from X% down" and "up to Y years" are computed from the plan list,
          never entered separately, so the headline cannot contradict it.
       2. Every offer carries an end date and is dropped the day after it
          passes. Nothing stale can survive on the page by being forgotten.
     A cash plan (0 instalment years) is shown but excluded from the summary,
     or it would drag "up to N years" down to zero.                         */
  function renderMoney(data) {
    var root = document.querySelector("[data-money]");
    if (!root) return;
    var money = data.money || {};
    var price = money.priceFrom;
    var plans = money.plans || [];
    var offers = money.offers || [];

    if (!price && !plans.length) { root.hidden = true; return; }

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var esc = function (t) {
      return String(t == null ? "" : t)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    var fin = plans.filter(function (p) { return Number(p.years) > 0; });
    var downs = fin.map(function (p) { return Number(p.down); });
    var yrs = fin.map(function (p) { return Number(p.years); });
    var minDown = downs.length ? Math.min.apply(null, downs) : null;
    var maxYrs = yrs.length ? Math.max.apply(null, yrs) : null;
    var one = fin.length === 1;

    var h = '<div class="top">';
    if (price) {
      h += '<div class="m"><span class="k">Homes from</span><span class="v">' +
        esc(price) + "</span></div>";
    }
    if (minDown !== null) {
      h += '<div class="m"><span class="k">' + (one ? "Down payment" : "Down payment from") +
        '</span><span class="v">' + minDown + "<small>%</small></span></div>" +
        '<div class="m"><span class="k">' + (one ? "Instalments" : "Instalments up to") +
        '</span><span class="v">' + maxYrs + "<small>" +
        (maxYrs === 1 ? "year" : "years") + "</small></span></div>";
    }
    h += '<div class="act"><a href="#lead">' + esc(money.ctaLabel || "Get the current price list") +
      "</a>" + '<p>' + esc(money.priceNote || "Indicative \u00b7 subject to change") +
      "</p></div></div>";

    if (plans.length > 1) {
      h += '<div class="plans"><div class="in"><span class="lab">Plans</span>';
      plans.forEach(function (p) {
        var body = Number(p.years) > 0
          ? "<b>" + esc(p.down) + "% down</b> \u00b7 " + esc(p.years) + " yrs"
          : "<b>" + esc(p.down) + "%</b>" + (p.note ? " \u00b7 " + esc(p.note) : "");
        h += '<span class="p">' + (p.name ? '<span class="nm">' + esc(p.name) + "</span>" : "") +
          body + "</span>";
      });
      h += "</div></div>";
    }

    var live = offers.filter(function (o) {
      if (!o.until) return false;
      var end = new Date(o.until + "T23:59:59");
      return !isNaN(end.getTime()) && end >= today;
    });
    if (live.length) {
      h += '<div class="offers"><div class="in">';
      live.forEach(function (o) {
        var d = new Date(o.until + "T00:00:00");
        var when = d.toLocaleDateString("en-GB",
          { day: "numeric", month: "short", year: "numeric" });
        h += '<div class="o">' +
          (o.flag ? '<span class="flag">' + esc(o.flag) + "</span>" : "") +
          '<span class="txt">' + esc(o.text) + "</span>" +
          '<span class="until">Until ' + when + "</span>" +
          (o.cond ? '<p class="cond">' + esc(o.cond) + "</p>" : "") + "</div>";
      });
      h += "</div></div>";
    }
    root.innerHTML = h;
    root.hidden = false;
  }


  /* ── Hero key facts ─────────────────────────────────────────────────────
     A short list under the headline. Empty list, no strip — the headline and
     form close up around it rather than leaving a rule floating.            */
  function renderFacts(data) {
    var el = document.querySelector("[data-facts]");
    if (!el) return;
    var facts = (data.heroFacts || []).filter(function (f) { return f && f.value; });
    if (!facts.length) { el.hidden = true; el.innerHTML = ""; return; }
    var esc = function (t) {
      return String(t == null ? "" : t)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    el.innerHTML = facts.slice(0, 4).map(function (f) {
      return "<div><b>" + esc(f.value) + "</b>" + esc(f.label || "") + "</div>";
    }).join("");
    el.hidden = false;
  }

  function apply(data) {
    var L = lang();

    applyImages(data);
    renderMoney(data);
    renderFacts(data);

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

    /* tab panels
       The sub-label is itself a <p>, so querySelector("p") used to match it and
       the description overwrote the label — same sentence printed twice. */
    document.querySelectorAll(".panel").forEach(function (el, i) {
      setText(el.querySelector("p.sub"),      pick(data, "panels", i, "sub"));
      setText(el.querySelector("h3"),         pick(data, "panels", i, "title"));
      setText(el.querySelector("p:not(.sub)"), pick(data, "panels", i, "text"));
    });

    /* fixed copy */
    setText(document.querySelector(".bar"),  pick(data, "top_bar"));
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
