/**
 * Mobile Navigation – full vanilla JS replacement for Alpine.js directives.
 *
 * Handles:
 *  1. Hamburger toggle (mobileNavOpen)
 *  2. Shop top-level submenu (shopShowSubmenuParent / .mn-shop-body)
 *  3. Shop by Concern accordion (shopConcernOpen / first .mn-nested-body)
 *  4. Shop by Product accordion (shopProductOpen / second .mn-nested-body)
 *  5. Secondary nav accordion – Napiers (showSubmenuParent == 'Napiers')
 */
(function () {
  "use strict";

  /* ── Utility ───────────────────────────────────────────────────────────── */

  /**
   * Wire up a toggle button + its collapsible panel.
   * @param {HTMLElement} btn       - the trigger button
   * @param {HTMLElement} panel     - the element to show/hide
   * @param {HTMLElement} chevron   - optional .mn-chev-wrap to rotate
   * @param {string}      openClass - CSS class applied to panel when open
   * @param {boolean}     accordion - if true, closing is done by external caller
   * @returns {{ isOpen: function, close: function }}
   */
  function makeAccordion(btn, panel, chevron, openClass) {
    if (!btn || !panel)
      return {
        isOpen: function () {
          return false;
        },
        close: function () {},
      };

    openClass = openClass || "mn--open";

    // Strip Alpine attrs so they don't interfere
    [btn, panel].forEach(function (el) {
      [
        "x-cloak",
        "x-show",
        "x-transition:enter",
        "x-transition:enter-start",
        "x-transition:enter-end",
        "x-transition:leave",
        "x-transition:leave-start",
        "x-transition:leave-end",
        "@click",
        ":class",
      ].forEach(function (attr) {
        el.removeAttribute(attr);
      });
    });

    // Start hidden
    panel.style.display = "none";
    var open = false;

    function toggle() {
      open = !open;
      if (open) {
        panel.style.display = "";
      } else {
        panel.style.display = "none";
      }
      if (chevron) {
        chevron.classList.toggle("mn-chev-open", open);
      }
      btn.setAttribute("aria-expanded", String(open));
    }

    function close() {
      if (open) toggle();
    }

    btn.addEventListener("click", toggle);

    return {
      isOpen: function () {
        return open;
      },
      close: close,
    };
  }

  /* ── DOMContentLoaded ──────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    /* ── 1. Hamburger / drawer ─────────────────────────────────────────── */
    var toggleBtn = document.querySelector(".header-mobile-toggle");
    var drawer = document.querySelector(".header-mobile-drawer");
    var header = document.querySelector(".header");
    var iconHamburger =
      toggleBtn && toggleBtn.querySelector("span:first-child");
    var iconClose = toggleBtn && toggleBtn.querySelector("span:last-child");

    if (!toggleBtn || !drawer) return;

    // Strip leftover Alpine attributes from drawer
    [
      "x-cloak",
      "x-show",
      "x-trap.noscroll.noautofocus",
      "x-transition:enter",
      "x-transition:enter-start",
      "x-transition:enter-end",
      "x-transition:leave",
      "x-transition:leave-start",
      "x-transition:leave-end",
    ].forEach(function (a) {
      drawer.removeAttribute(a);
    });

    if (iconClose) {
      iconClose.removeAttribute("x-cloak");
      iconClose.removeAttribute("x-show");
    }
    if (iconHamburger) {
      iconHamburger.removeAttribute("x-show");
    }

    // Hide drawer via class initially
    drawer.classList.add("mobile-nav--hidden");
    if (iconClose) iconClose.style.display = "none";

    var menuOpen = false;

    function openMenu() {
      menuOpen = true;
      drawer.classList.remove("mobile-nav--hidden");
      void drawer.offsetHeight; // force reflow → transition fires
      drawer.classList.add("mobile-nav--open");
      if (iconHamburger) iconHamburger.style.display = "none";
      if (iconClose) iconClose.style.display = "";
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.setAttribute("aria-label", "Close mobile navigation");
      document.body.style.overflow = "hidden";
      syncHeaderHeight();
    }

    function closeMenu() {
      menuOpen = false;
      drawer.classList.remove("mobile-nav--open");
      setTimeout(function () {
        if (!menuOpen) drawer.classList.add("mobile-nav--hidden");
      }, 320);
      if (iconHamburger) iconHamburger.style.display = "";
      if (iconClose) iconClose.style.display = "none";
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "Open mobile navigation");
      document.body.style.overflow = "";
    }

    toggleBtn.addEventListener("click", function () {
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuOpen) {
        closeMenu();
        toggleBtn.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (
        menuOpen &&
        !drawer.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener("resize", function () {
      syncHeaderHeight();
      if (window.innerWidth >= 1024 && menuOpen) closeMenu();
    });

    /* ── 2. Shop top-level ("Shop" button → .mn-shop-body) ────────────── */
    var shopBtn = drawer.querySelector(".mn-shop-zone > .mn-top-link");
    var shopBody = drawer.querySelector(".mn-shop-zone > .mn-shop-body");
    var shopChev = shopBtn && shopBtn.querySelector(".mn-chev-wrap");

    makeAccordion(shopBtn, shopBody, shopChev, "mn--open");

    /* ── 3. Shop by Concern (.mn-nested-body first child) ──────────────── */
    var nestedAccs = drawer.querySelectorAll(".mn-nested-acc");
    var concernAcc = nestedAccs[0];
    var productAcc = nestedAccs[1];

    if (concernAcc) {
      var concernBtn = concernAcc.querySelector(".mn-nested-trigger");
      var concernBody = concernAcc.querySelector(".mn-nested-body");
      var concernChev = concernBtn && concernBtn.querySelector(".mn-chev-wrap");
      makeAccordion(concernBtn, concernBody, concernChev, "mn--open");
    }

    /* ── 4. Shop by Product (.mn-nested-body second child) ─────────────── */
    if (productAcc) {
      var productBtn = productAcc.querySelector(".mn-nested-trigger");
      var productBody = productAcc.querySelector(".mn-nested-body");
      var productChev = productBtn && productBtn.querySelector(".mn-chev-wrap");
      makeAccordion(productBtn, productBody, productChev, "mn--open");
    }

    /* ── 5. Secondary nav – "Napiers" accordion ────────────────────────── */
    var secTriggers = drawer.querySelectorAll(".mn-sec-acc-trigger");
    secTriggers.forEach(function (trigger) {
      // The panel immediately follows the button inside .mn-secondary-zone
      var panel = trigger.nextElementSibling;
      if (!panel) return;
      var chev = trigger.querySelector(".mn-chev-wrap");

      // Each trigger should close every other trigger in the same zone
      var acc = makeAccordion(trigger, panel, chev, "mn--open");

      // Override: close siblings when this one opens
      trigger.addEventListener("click", function () {
        // Close all other secondary accordions
        secTriggers.forEach(function (otherTrigger) {
          if (otherTrigger !== trigger) {
            var otherPanel = otherTrigger.nextElementSibling;
            var otherChev = otherTrigger.querySelector(".mn-chev-wrap");
            if (otherPanel && otherPanel.style.display !== "none") {
              otherPanel.style.display = "none";
              if (otherChev) otherChev.classList.remove("mn-chev-open");
              otherTrigger.setAttribute("aria-expanded", "false");
            }
          }
        });
      });
    });

    /* ── Helpers ───────────────────────────────────────────────────────── */
    function syncHeaderHeight() {
      if (header) {
        document.documentElement.style.setProperty(
          "--header-height",
          header.offsetHeight + "px",
        );
      }
    }

    syncHeaderHeight();
  });
})();
