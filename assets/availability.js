/* Availability — renders property-type chips from content/*.json and
   disables anything marked sold out.

   Statuses: "available" | "limited" | "sold_out"
   Set per property type in the admin panel. */

(function () {
  "use strict";

  var LABELS = {
    available: { en: "Available",  ar: "متاح" },
    limited:   { en: "Few left",   ar: "وحدات محدودة" },
    sold_out:  { en: "Sold out",   ar: "نفدت الكمية" }
  };

  function base() {
    var p = location.pathname;
    return p.slice(0, p.lastIndexOf("/") + 1);
  }

  function currentLang() {
    try { return localStorage.getItem("mes-lang") || "en"; } catch (e) { return "en"; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Update the chips that are already in the HTML.
     The markup is the source of truth for WHICH types exist; the CMS data
     updates their availability. If this script never runs, the chips are
     still there and still usable — they just show the built-in status. */
  function updateChips(group, items, lang) {
    if (!group) return;
    var box = group.querySelector(".chips");
    if (!box) return;

    var chips = Array.prototype.slice.call(box.querySelectorAll(".chip"));
    if (!chips.length) return;

    var byLabel = {};
    (items || []).forEach(function (it) {
      if (it.label_en) byLabel[it.label_en.trim().toLowerCase()] = it;
    });

    var anySold = false;

    chips.forEach(function (chip) {
      var key = (chip.dataset.label || chip.textContent || "").trim().toLowerCase();
      var it  = byLabel[key];
      if (!it) return;                       // not in CMS data — leave as authored

      var status = it.status || "available";
      chip.setAttribute("data-status", status);

      var label = (lang === "ar" ? it.label_ar : it.label_en) || it.label_en;
      if (label) chip.textContent = label;

      if (status === "sold_out") {
        anySold = true;
        chip.disabled = true;
        chip.setAttribute("aria-disabled", "true");
        chip.setAttribute("tabindex", "-1");
        chip.setAttribute("aria-pressed", "false");
      } else {
        chip.disabled = false;
        chip.removeAttribute("aria-disabled");
        chip.removeAttribute("tabindex");
      }
    });

    var note = group.querySelector(".chipnote");
    if (anySold) {
      if (!note) {
        note = document.createElement("p");
        note.className = "chipnote";
        box.parentNode.insertBefore(note, box.nextSibling);
      }
      note.textContent = lang === "ar"
        ? "الأنواع التي نفدت غير متاحة للاختيار حالياً."
        : "Greyed-out types are currently sold out.";
    } else if (note) {
      note.remove();
    }
  }

  /* Availability badge inside a tab panel */
  function badge(status, lang) {
    var l = LABELS[status] || LABELS.available;
    return '<span class="availbadge" data-status="' + esc(status) + '">' +
           '<span class="dot"></span>' + esc(lang === "ar" ? l.ar : l.en) + "</span>";
  }

  function applyPanelBadges(items, lang) {
    if (!items) return;
    var map = {};
    items.forEach(function (it) {
      if (it.label_en) map[it.label_en.toLowerCase()] = it.status || "available";
    });

    document.querySelectorAll("[data-avail-for]").forEach(function (host) {
      var key = (host.getAttribute("data-avail-for") || "").toLowerCase();
      var st  = map[key];
      if (!st) { host.innerHTML = ""; return; }
      host.innerHTML = badge(st, lang);
    });
  }

  function boot() {
    var host = document.querySelector("[data-project]");
    if (!host) return;
    var file = host.getAttribute("data-project");

    fetch(base() + "content/" + file + ".json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var lang = currentLang();

        var resGroup = document.querySelector('[data-multi="property"]');
        var offGroup = document.querySelector('[data-multi="office"]');

        updateChips(resGroup, data.propertyTypes, lang);
        updateChips(offGroup, data.officeFormats, lang);
        applyPanelBadges(data.propertyTypes, lang);

        // logos — image if set in the CMS, otherwise the text wordmark stays
        if (data.logos) {
          var mk = data.logos.marakez;
          if (mk) document.querySelectorAll('[data-logo="marakez"]').forEach(function (el) {
            el.setAttribute("src", mk.replace(/^\//, ""));
          });
          var pj = data.logos.project;
          if (pj) document.querySelectorAll('[data-logo="project"]').forEach(function (el) {
            el.setAttribute("src", pj.replace(/^\//, ""));
          });
        }

        // hero overlay strength, also set from the CMS
        var scrim = { light: ".60", medium: ".78", strong: ".90" }[data.heroScrim || "medium"];
        if (scrim) document.documentElement.style.setProperty("--scrim", scrim);

        // re-bind the toggle behaviour for the freshly rendered chips
        document.dispatchEvent(new CustomEvent("chips:rendered"));
      })
      .catch(function (e) { console.error("Availability load failed:", e); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
