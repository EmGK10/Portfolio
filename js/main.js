/* ============================================================
   main.js — nav, scroll reveal, grano de película, nav auto-hide
   Compartido por index.html, certificados.html y cad.html
   ============================================================ */

(function () {
  "use strict";

  /* ---- grano de película (SVG noise) ---- */
  function initGrain() {
    const grain = document.querySelector(".grain");
    if (!grain) return;
    grain.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
      </svg>`;
  }

  /* ---- nav: móvil toggle + estado activo + auto-hide ---- */
  function initNav() {
    const nav = document.querySelector(".site-nav");
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");

    if (toggle && links) {
      toggle.addEventListener("click", () => {
        links.classList.toggle("open");
        toggle.textContent = links.classList.contains("open") ? "✕" : "☰";
      });
      links.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          links.classList.remove("open");
          toggle.textContent = "☰";
        })
      );
    }

    // resaltar link activo según archivo actual
    const current = (location.pathname.split("/").pop() || "index.html");
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === current || (current === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });

    // ocultar nav al bajar, mostrar al subir
    if (nav) {
      let lastY = window.scrollY;
      window.addEventListener(
        "scroll",
        () => {
          const y = window.scrollY;
          if (y > 120 && y > lastY) {
            nav.classList.add("nav-hidden");
          } else {
            nav.classList.remove("nav-hidden");
          }
          nav.classList.toggle("nav-solid", y > 40);
          lastY = y;
        },
        { passive: true }
      );
    }
  }

  /* ---- reveal on scroll ---- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach((el) => obs.observe(el));

    // stagger: asigna --i según orden dentro de su contenedor .reveal-stagger
    document.querySelectorAll(".reveal-stagger").forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        child.style.setProperty("--i", i);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initGrain();
    initNav();
    initReveal();
  });
})();
