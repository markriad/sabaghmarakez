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
        email: (form.querySelector("[name=email]") || {}).value || "",
        phone_e164: (form.querySelector("[name=phone_e164]") || {}).value || ""
      };

      fetch(url, { method: "POST", body: data })
        .then(function () {
          if (window.trackEvent) window.trackEvent("lead_submit", leadPayload);
          form.reset();
          form.querySelectorAll('.chip[aria-pressed="true"]')
              .forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
          form.querySelectorAll("[data-multi] input[type=hidden]")
              .forEach(function (h) { h.value = ""; });
          show(msg, "ok", "Thank you. Mohamed will be in touch shortly.");
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
    });

    loadCountries().then(function () {
      document.querySelectorAll("form[data-lead]").forEach(function (f) {
        initPhone(f);
        initMulti(f);
        initSubmit(f);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
