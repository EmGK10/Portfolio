/* ============================================================
   lightbox.js — popup de imagen grande para certificados/reconocimientos
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const img = document.getElementById("lightboxImg");
    const title = document.getElementById("lightboxTitle");
    const desc = document.getElementById("lightboxDesc");
    const closeBtn = document.getElementById("lightboxClose");
    let lastFocused = null;

    function open(card) {
      const src = card.getAttribute("data-img");
      img.src = src;
      img.alt = card.getAttribute("data-title") || "";
      title.textContent = card.getAttribute("data-title") || "";
      desc.textContent = card.getAttribute("data-desc") || "";
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      lastFocused = document.activeElement;
      closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll("[data-lightbox]").forEach((card) => {
      card.addEventListener("click", () => open(card));
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(card);
        }
      });
    });

    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) close();
    });
  });
})();
