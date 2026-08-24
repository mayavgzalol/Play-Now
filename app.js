/* ==========================================================================
   PLAYNOW — gemeinsames Script
   Vanilla JS, keine Libraries.
   ========================================================================== */
(() => {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const slow = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- Intro
     Logo + Schriftzug starten groß in der Mitte und fahren anschließend
     exakt auf die Position der Marke in der Navigation (FLIP).            */
  const intro = $("#intro");
  const brand = $("#brand");

  const startPage = () => {
    document.body.classList.remove("locked");
    if (brand) brand.classList.remove("intro-hide");
  };

  if (intro && brand) {
    let seen = false;
    try { seen = sessionStorage.getItem("pn_intro") === "1"; } catch (e) {}

    if (true) {
      intro.remove();
      startPage();
    } else {
      document.body.classList.add("locked");
      brand.classList.add("intro-hide");

      // Schriftzug in einzelne Buchstaben zerlegen
      const word = $(".intro-word", intro);
      const text = word.textContent.trim();
      word.textContent = "";
      [...text].forEach((ch, i) => {
        const s = document.createElement("span");
        s.textContent = ch;
        s.style.animationDelay = (140 + i * 45) + "ms";
        word.appendChild(s);
      });

      const fly = () => {
        const grp = $(".intro-grp", intro);
        const from = grp.getBoundingClientRect();
        const to   = brand.getBoundingClientRect();
        const scale = to.width / from.width;
        intro.classList.add("fly");
        grp.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})`;
        setTimeout(() => {
          intro.classList.add("done");
          startPage();
          setTimeout(() => intro.remove(), 900);
        }, 620);
        try { sessionStorage.setItem("pn_intro", "1"); } catch (e) {}
      };

      requestAnimationFrame(() => intro.classList.add("run"));
      const t = setTimeout(fly, 1500);
      // Überspringen per Klick oder Taste
      const skip = () => { clearTimeout(t); fly(); };
      intro.addEventListener("click", skip, { once: true });
      addEventListener("keydown", skip, { once: true });
    }
  } else {
    startPage();
  }

  /* ---------------------------------------------------------------- Navigation */
  const nav = $("#nav");
  let tick = false;
  const onScroll = () => {
    if (nav) nav.classList.toggle("stuck", scrollY > 30);
    tick = false;
  };
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const burger = $("#burger"), sheet = $("#sheet");
  if (burger && sheet) {
    const toggle = force => {
      const open = force ?? !sheet.classList.contains("open");
      sheet.classList.toggle("open", open);
      burger.classList.toggle("x", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("locked", open);
      $$("a.m", sheet).forEach((a, i) => a.style.transitionDelay = open ? (60 + i * 50) + "ms" : "0ms");
    };
    burger.addEventListener("click", () => toggle());
    $$("a", sheet).forEach(a => a.addEventListener("click", () => toggle(false)));
    addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
  }

  /* ---------------------------------------------------------------- Reveal */
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -5% 0px" });

  const watch = root => $$(".rv", root).forEach((el, i) => {
    if (el.dataset.w) return;
    el.dataset.w = "1";
    el.style.transitionDelay = Math.min(i, 6) * 55 + "ms";
    io.observe(el);
  });
  watch(document);

  /* ---------------------------------------------------------------- Equalizer */
  const eq = $("#eq");
  if (eq && !slow) {
    for (let i = 0; i < 16; i++) {
      const b = document.createElement("b");
      b.style.animationDelay = (Math.random() * 1.3).toFixed(2) + "s";
      b.style.animationDuration = (1 + Math.random()) .toFixed(2) + "s";
      eq.appendChild(b);
    }
  }

  /* ==========================================================================
     ÖFFNUNGSZEITEN
     0 = Sonntag … 6 = Samstag, Angabe in Minuten ab Mitternacht.
     1440 = 00:00 Uhr.  >>> Zeiten NUR hier ändern. <<<
     ========================================================================== */
  const HOURS = {
    0: { open: 12 * 60,      close: 1440 }, // Sonntag
    1: { open: 12 * 60,      close: 1440 }, // Montag
    2: { open: 12 * 60,      close: 1440 }, // Dienstag
    3: { open: 12 * 60,      close: 1440 }, // Mittwoch
    4: { open: 12 * 60,      close: 1440 }, // Donnerstag
    5: { open: 14 * 60 + 15, close: 1440 }, // Freitag
    6: { open: 12 * 60,      close: 1440 }  // Samstag
  };
  const fmt = m => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  const groups = $$("[data-days]");
  const today = new Date().getDay();
  groups.forEach(row => {
    const days = row.dataset.days.split(",").map(Number);
    if (days.includes(today)) {
      row.classList.add("now");
      const k = $(".k", row);
      if (k && !$(".tag", row)) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = "heute";
        k.appendChild(tag);
      }
    }
  });

  const state = $("#state"), note = $("#note"), clock = $("#clock"),
        heroState = $("#heroState"), heroNote = $("#heroNote");

  const update = () => {
    const now = new Date(), day = now.getDay();
    const min = now.getHours() * 60 + now.getMinutes();
    const { open, close } = HOURS[day];
    const isOpen = min >= open && min < close;

    if (clock) clock.textContent = "Ortszeit " + fmt(min);

    if (isOpen) {
      const left = close - min, h = Math.floor(left / 60), m = left % 60;
      const txt = `Schließt um 00:00 — noch ${h ? h + " Std. " : ""}${m} Min.`;
      if (state) { state.innerHTML = '<span class="dot"></span>Jetzt geöffnet'; state.className = "state open"; }
      if (note) note.textContent = txt;
      if (heroState) heroState.innerHTML = '<span class="dot"></span><b>Jetzt geöffnet</b>';
      if (heroNote) heroNote.textContent = "bis 00:00 Uhr";
    } else {
      const next = min < open ? { min: open, heute: true } : { min: HOURS[(day + 1) % 7].open, heute: false };
      const txt = next.heute ? `Öffnet heute um ${fmt(next.min)} Uhr` : `Öffnet morgen um ${fmt(next.min)} Uhr`;
      if (state) { state.innerHTML = '<span class="dot shut"></span>Derzeit geschlossen'; state.className = "state shut"; }
      if (note) note.textContent = txt;
      if (heroState) heroState.innerHTML = '<span class="dot shut"></span>Derzeit geschlossen';
      if (heroNote) heroNote.textContent = txt.replace("Öffnet ", "öffnet ");
    }
  };
  update();
  setInterval(update, 20000);

  /* ---------------------------------------------------------------- Schriftzug einpassen
     Der Wortmarke im Hero wird die größte Schriftgröße gegeben, die noch in
     eine Zeile passt — unabhängig davon, ob die Webfont geladen wurde.      */
  const word = $(".hero-word");
  if (word) {
    const fit = () => {
      const box = word.parentElement.clientWidth;
      word.style.fontSize = "";
      let size = parseFloat(getComputedStyle(word).fontSize);
      let guard = 0;
      while (word.scrollWidth > box && size > 34 && guard++ < 120) {
        size -= 2;
        word.style.fontSize = size + "px";
      }
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    let ft;
    addEventListener("resize", () => { clearTimeout(ft); ft = setTimeout(fit, 150); });
  }

  /* ---------------------------------------------------------------- Jahr */
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
})();
