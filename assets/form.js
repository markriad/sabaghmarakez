/* Lead form — country picker, phone validation, multi-select chips.
   Used by both the homepage form and the project page forms. */

(function () {
  "use strict";

  var COUNTRIES = [];
  var DEFAULT_ISO = "EG";

  /* ── Country data ────────────────────────────────────────── */
  function loadCountries() {
    var path = location.pathname;
    var base = path.slice(0, path.lastIndexOf("/") + 1);
    return fetch(base + "assets/countries.json")
      .then(function (r) { return r.json(); })
      .then(function (d) { COUNTRIES = d; })
      .catch(function () {
        COUNTRIES = [{ i: "EG", n: "Egypt", d: "20", l: [10], p: "0" }];
      });
  }

  function byIso(iso) {
    for (var i = 0; i < COUNTRIES.length; i++) {
      if (COUNTRIES[i].i === iso) return COUNTRIES[i];
    }
    return null;
  }

  /* ── Country picker ──────────────────────────────────────── */
  function initPhone(root) {
    var wrap   = root.querySelector("[data-phone]");
    if (!wrap) return;

    var btn    = wrap.querySelector(".cc-btn");
    var flagEl = wrap.querySelector(".cc-dial");
    var pop    = wrap.querySelector(".cc-pop");
    var search = wrap.querySelector(".cc-search");
    var list   = wrap.querySelector(".cc-list");
    var input  = wrap.querySelector("input[type=tel]");
    var hidden = root.querySelector("input[name=phone_e164]");
    var isoIn  = root.querySelector("input[name=phone_country]");
    var err    = wrap.parentNode.querySelector(".ferr");

    var current = byIso(DEFAULT_ISO) || COUNTRIES[0];

    function paint() {
      flagEl.textContent = "+" + current.d;
      isoIn.value = current.i;
      btn.setAttribute("aria-label", "Country code: " + current.n + " +" + current.d);
    }

    function renderList(filter) {
      var q = (filter || "").trim().toLowerCase();
      var out = "";
      for (var i = 0; i < COUNTRIES.length; i++) {
        var c = COUNTRIES[i];
        if (q && c.n.toLowerCase().indexOf(q) === -1 && c.d.indexOf(q) === -1) continue;
        out += '<li role="option" tabindex="-1" data-iso="' + c.i + '">' +
               '<span class="cc-name">' + esc(c.n) + '</span>' +
               '<span class="cc-num">+' + c.d + '</span></li>';
      }
      list.innerHTML = out || '<li class="cc-none">No match</li>';
    }

    function open() {
      pop.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      search.value = "";
      renderList("");
      search.focus();
    }
    function close() {
      pop.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      pop.hidden ? open() : close();
    });

    search.addEventListener("input", function () { renderList(search.value); });

    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); btn.focus(); }
      if (e.key === "Enter") {
        e.preventDefault();
        var first = list.querySelector("li[data-iso]");
        if (first) first.click();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var f = list.querySelector("li[data-iso]");
        if (f) f.focus();
      }
    });

    list.addEventListener("click", function (e) {
      var li = e.target.closest("li[data-iso]");
      if (!li) return;
      current = byIso(li.dataset.iso) || current;
      paint();
      close();
      validate();
      input.focus();
    });

    list.addEventListener("keydown", function (e) {
      var li = e.target.closest("li[data-iso]");
      if (!li) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); }
      if (e.key === "ArrowDown") { e.preventDefault(); if (li.nextElementSibling) li.nextElementSibling.focus(); }
      if (e.key === "ArrowUp")   { e.preventDefault();
        if (li.previousElementSibling) li.previousElementSibling.focus(); else search.focus(); }
      if (e.key === "Escape") { close(); btn.focus(); }
    });

    document.addEventListener("click", function (e) {
      if (!pop.hidden && !wrap.contains(e.target)) close();
    });

    /* ── Validation ───────────────────────────────────────── */
    function normalise(raw) {
      var digits = String(raw || "").replace(/\D/g, "");
      // strip the national prefix (Egypt's leading 0, etc.)
      var pfx = current.p || "";
      if (pfx && digits.indexOf(pfx) === 0 && digits.length > pfx.length) {
        digits = digits.slice(pfx.length);
      }
      // if the user typed the dial code too, drop it
      if (digits.indexOf(current.d) === 0 && digits.length > current.d.length) {
        var rest = digits.slice(current.d.length);
        if (isValidLength(rest)) digits = rest;
      }
      return digits;
    }

    function isValidLength(d) {
      var lens = current.l && current.l.length ? current.l : null;
      if (!lens) return d.length >= 6 && d.length <= 14;
      return lens.indexOf(d.length) !== -1;
    }

    function validate() {
      var national = normalise(input.value);
      var ok = national.length > 0 && isValidLength(national);

      if (!input.value.trim()) {
        setErr("");
        hidden.value = "";
        input.setCustomValidity("Enter your phone number");
        return false;
      }
      if (!ok) {
        var lens = current.l && current.l.length ? current.l.join(" or ") : "6–14";
        setErr("That doesn't look like a valid " + current.n + " number — expected " + lens + " digits.");
        hidden.value = "";
        input.setCustomValidity("Invalid phone number");
        return false;
      }
      setErr("");
      hidden.value = "+" + current.d + national;
      input.setCustomValidity("");
      return true;
    }

    function setErr(msg) {
      if (!err) return;
      err.textContent = msg;
      err.style.display = msg ? "block" : "none";
      input.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    input.addEventListener("input", function () { if (err && err.textContent) validate(); });
    input.addEventListener("blur", validate);

    paint();
    root._validatePhone = validate;
  }


  /* ── Single-select chips + the dependent bedrooms / area field ──────────
     A property type is one choice, not several: "villa and apartment, three
     bedrooms" doesn't say which. Choosing a type reveals the options that type
     actually has, read from data-options on the chip (set from the CMS).

     The important bit is the reset. Pick Villa then 6+, switch to Chalet, and
     without clearing you would submit "Chalet, 6+" — a combination that isn't
     even on the new list, and you'd only find out on the phone.              */
  var DEP_LABELS = { beds: "Bedrooms", area: "Approximate area" };

  function depFor(form) {
    return {
      wrap:  form.querySelector("[data-dep]"),
      label: form.querySelector("[data-dep-label]"),
      chips: form.querySelector("[data-dep-chips]"),
      input: form.querySelector("[name=unit_size]")
    };
  }

  function clearDep(form) {
    var d = depFor(form);
    if (!d.wrap) return;
    d.wrap.hidden = true;
    if (d.chips) d.chips.innerHTML = "";
    if (d.input) d.input.value = "";
  }


  /* Options are typed by hand in the panel, so accept the ways people actually
     write a list. Bars are the documented separator; newlines and commas are
     the two most likely slips. Commas are only used as a separator when the
     text has none of the "1,200" thousands-separator pattern — otherwise
     "1,200 - 2,400 sqm" would split into "1" and "200 - 2,400 sqm". */
  function parseOptions(raw) {
    var text = String(raw || "").trim();
    if (!text) return [];
    var parts;
    if (text.indexOf("|") !== -1 || text.indexOf("\n") !== -1) {
      parts = text.split(/[|\n]/);
    } else if (text.indexOf(",") !== -1 && !/\d,\d{3}(\D|$)/.test(text)) {
      parts = text.split(",");
    } else {
      parts = [text];
    }
    var seen = {}, out = [];
    parts.forEach(function (x) {
      var v = x.trim();
      if (!v || seen[v]) return;      /* drop blanks and accidental repeats */
      seen[v] = 1;
      out.push(v);
    });
    return out;
  }

  function showDep(form, chip) {
    var d = depFor(form);
    if (!d.wrap) return;
    var raw = chip.getAttribute("data-options") || "";
    var opts = parseOptions(raw);
    if (!opts.length) { clearDep(form); return; }

    var kind = chip.getAttribute("data-optkind") || "beds";
    d.label.textContent = DEP_LABELS[kind] || "Options";
    d.chips.innerHTML = "";
    d.input.value = "";
    opts.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = o;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        d.input.value = o;
        d.chips.querySelectorAll(".chip").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
      });
      d.chips.appendChild(b);
    });
    d.wrap.hidden = false;
  }

  function bindSingle(group) {
    if (group.getAttribute("data-single-bound") === "1") return;
    group.setAttribute("data-single-bound", "1");
    var form = group.closest("form");
    group.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip || !group.contains(chip)) return;
      if (chip.disabled || chip.getAttribute("data-status") === "sold_out") return;
      group.querySelectorAll(".chip").forEach(function (c) {
        c.setAttribute("aria-pressed", String(c === chip));
      });
      var hidden = group.querySelector("input[type=hidden]");
      if (hidden) hidden.value = chip.getAttribute("data-label") || chip.textContent.trim();
      if (form) showDep(form, chip);
    });
    group.addEventListener("keydown", function (e) {
      var chip = e.target.closest(".chip");
      if (chip && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); chip.click(); }
    });
  }

  function bindAllSingle(root) {
    (root || document).querySelectorAll("[data-single]").forEach(bindSingle);
  }

  /* ── Multi-select chips ──────────────────────────────────── */
  function initMulti(root) {
    root.querySelectorAll("[data-multi]").forEach(function (group) {
      bindGroup(group);
    });
  }

  function bindGroup(group) {
    var hidden = group.querySelector("input[type=hidden]");
    if (!hidden) return;

    function sync() {
      var picked = [];
      group.querySelectorAll('.chip[aria-pressed="true"]').forEach(function (c) {
        picked.push((c.dataset.label || c.textContent).trim());
      });
      hidden.value = picked.join(", ");
    }

    // Delegated so it keeps working after the CMS re-renders the chips
    if (!group._bound) {
      group.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip || !group.contains(chip)) return;
        e.preventDefault();
        if (chip.disabled || chip.getAttribute("data-status") === "sold_out") return;
        var on = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", on ? "false" : "true");
        sync();
      });
      group.addEventListener("keydown", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chip.click(); }
      });
      group._bound = true;
    }
    sync();
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── Submit ──────────────────────────────────────────────── */
  function initSubmit(form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var msg = form.querySelector(".fmsg");
      var btn = form.querySelector("button[type=submit]");

      if (form.querySelector("[name=website_url]") &&
          form.querySelector("[name=website_url]").value) return;

      var phoneOk = form._validatePhone ? form._validatePhone() : true;
      if (!form.checkValidity() || !phoneOk) {
        form.reportValidity();
        var bad = form.querySelector("[aria-invalid=true], :invalid");
        if (bad) bad.focus();
        return;
      }

      var url = (window.SITE_SETTINGS && window.SITE_SETTINGS.formEndpoint) || "";
      if (!url || url.indexOf("PASTE_") === 0) {
        show(msg, "err", "The form isn't connected yet. Please use WhatsApp instead.");
        return;
      }

      /* The hidden "project" input and the form's data-lead attribute both name
         the project, and a page cloned from another one can leave them
         disagreeing — Shams Soma shipped with value="Ramla", which would have
         filed every Red Sea lead under Ramla in the sheet. data-lead is the
         single source of truth; the hidden input is set from it here so the two
         cannot drift apart again. */
      var projectField = form.querySelector("[name=project]");
      if (projectField && form.getAttribute("data-lead")) {
        projectField.value = form.getAttribute("data-lead");
      }

      var data = new FormData(form);
      data.append("submitted", new Date().toISOString());

      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Sending...";

      var leadPayload = {
        project: form.getAttribute("data-lead") || "",
        enquiry_type: (form.querySelector("[name=enquiry_type]") || {}).value || "Residential",
        budget: (form.querySelector("[name=budget]") || {}).value || "",
        property_types: (form.querySelector("[name=property_types]") || {}).value || "",
        unit_size:      (form.querySelector("[name=unit_size]")      || {}).value || "",
        email: (form.querySelector("[name=email]") || {}).value || "",
        phone_e164: (form.querySelector("[name=phone_e164]") || {}).value || ""
      };

      fetch(url, { method: "POST", body: data })
        .then(function () {
          if (window.trackEvent) window.trackEvent("lead_submit", leadPayload);

          /* Reset first. If the visitor comes back with the browser's back
             button the form is clean rather than still holding their details. */
          form.reset();
          form.querySelectorAll('.chip[aria-pressed="true"]')
              .forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
          clearDep(form);
          form.querySelectorAll("[data-single] input[type=hidden]")
              .forEach(function (h) { h.value = ""; });
          form.querySelectorAll("[data-multi] input[type=hidden]")
              .forEach(function (h) { h.value = ""; });

          /* Hand the thank-you page a one-time token. It fires the conversion
             only when this is present, so refreshes and direct visits to that
             URL don't each count as another lead. */
          try {
            sessionStorage.setItem("marakez_lead", JSON.stringify(leadPayload));
          } catch (e) {
            /* Private browsing, or storage blocked. The redirect still happens
               and the lead still reaches the sheet — only the thank-you page's
               conversion event is lost, because the token it checks isn't
               there. A handful of missed conversions is a fair price for not
               counting every refresh as a new lead. */
          }

          /* Shown first so that if the redirect is blocked the visitor still
             sees confirmation rather than a form that appears to have done
             nothing. */
          show(msg, "ok", "Thank you. You'll be contacted shortly.");

          /* The project goes in the URL as well as the token, so a conversion
             can be built on the URL alone — Meta and Google Ads both match
             query strings, and that is the setup that needs no tag manager. */
          var slug = String(leadPayload.project || "")
            .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          /* Extensionless on purpose. GTM triggers match the path "/thank-you",
             so redirecting to "thank-you.html" would not match them and the
             conversion tags would never fire. Cloudflare serves thank-you.html
             at /thank-you automatically. */
          window.location.href = "/thank-you" + (slug ? "?project=" + slug : "");
          return;
        })
        .catch(function () {
          show(msg, "err", "Couldn't send. Please reach out on WhatsApp instead.");
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = label;
        });
    });
  }

  function show(el, cls, text) {
    if (!el) return;
    el.className = "fmsg " + cls;
    el.textContent = text;
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    document.addEventListener("chips:rendered", function () {
      document.querySelectorAll("[data-multi]").forEach(bindGroup);
      bindAllSingle();
    });

    loadCountries().then(function () {
      document.querySelectorAll("form[data-lead]").forEach(function (f) {
        initPhone(f);
        initMulti(f);
        bindAllSingle(f);
        initSubmit(f);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
