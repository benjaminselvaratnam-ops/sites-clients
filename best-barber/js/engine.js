// Moteur commun : film piloté par le scroll (vidéo sur ordinateur, suite d'images sur téléphone),
// apparitions, galerie à glisser, badge ouvert/fermé.
// Réglages par site dans window.SITE = { frames, ranges, hours }.
(function () {
  "use strict";
  var S = window.SITE || {};
  document.documentElement.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(hover: none) and (pointer: coarse), (max-width: 860px)").matches;

  /* ---------- 1. Intro : film au scroll sur ordinateur, film en lecture auto sur téléphone ---------- */
  var phone = window.matchMedia("(max-width: 860px), (hover: none) and (pointer: coarse)").matches;
  var killed = document.getElementById(phone ? "journey" : "top");
  if (killed) killed.remove();

  if (phone) {
    var vid = document.querySelector(".hero__vid");
    var saveData = navigator.connection && navigator.connection.saveData;
    if (vid && !reduced && !saveData) {
      vid.src = vid.getAttribute("data-src");
      vid.addEventListener("playing", function () { vid.classList.add("is-playing"); }, { once: true });
      var tryPlay = function () { var p = vid.play(); if (p && p.catch) p.catch(function () {}); };
      tryPlay();
      // iOS en mode économie d'énergie bloque l'autoplay : on relance au premier toucher.
      window.addEventListener("touchstart", tryPlay, { once: true, passive: true });
      // On met la vidéo en pause quand l'intro n'est plus visible (batterie, fluidité du scroll).
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) tryPlay(); else vid.pause(); }); }).observe(vid);
    } else if (vid) { vid.remove(); }
  }

  /* ---------- 1. Film piloté par le scroll ---------- */
  var root = document.getElementById("journey");
  if (root && !phone) {
    var media = root.querySelector(".ss__media");
    var bar = root.querySelector(".ss__progress span");
    var chapters = Array.prototype.slice.call(root.querySelectorAll(".ss__chapter"));
    var layers = [];
    var canvasMode = false;

    chapters.forEach(function (ch, i) {
      var n = ch.getAttribute("data-clip");
      ch.style.minHeight = parseFloat(ch.getAttribute("data-scroll") || "1.4") * 100 + "dvh";
      var layer = document.createElement("figure");
      layer.className = "ss__layer" + (i === 0 ? " is-active" : "");
      var poster = document.createElement("img");
      poster.alt = "";
      poster.src = "assets/world/scene-0" + n + "-poster.jpg";
      layer.appendChild(poster);
      media.appendChild(layer);
      layers.push({ el: layer, ch: ch, src: "assets/world/scene-0" + n + ".mp4", video: null, target: 0 });
    });

    var seek = function (l) {
      var v = l.video;
      if (!v || !v.duration || v.seeking) return;
      var t = l.target * (v.duration - 0.05);
      if (Math.abs(v.currentTime - t) > 0.01) v.currentTime = t;
    };
    var loadVideo = function (l) {
      if (l.video || reduced || canvasMode) return;
      var v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      l.video = v;
      fetch(l.src).then(function (r) { return r.blob(); }).then(function (b) {
        v.src = URL.createObjectURL(b);
        v.addEventListener("loadeddata", function () { l.el.appendChild(v); seek(l); }, { once: true });
        v.addEventListener("seeked", function () { seek(l); });
      }).catch(function () { l.video = null; });
    };
    // On ne charge que le chapitre en cours et le suivant, au fil du défilement.
    var preload = function (i) { [i, i + 1].forEach(function (k) { if (layers[k]) loadVideo(layers[k]); }); };

    var active = -1;
    var onScroll = function () {
      var y = window.scrollY, vh = window.innerHeight;
      var top = root.getBoundingClientRect().top + y;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, (y - top) / (root.offsetHeight - vh))) + ")";
      var idx = 0;
      layers.forEach(function (l, i) {
        var start = top + l.ch.offsetTop;
        var len = Math.max(1, l.ch.offsetHeight - (i === layers.length - 1 ? vh : 0));
        var p = Math.min(1, Math.max(0, (y - start) / len));
        l.target = p;
        if (y >= start - 1) {
          idx = i;
        }
      });
      if (idx !== active) {
        layers.forEach(function (l, i) { l.el.classList.toggle("is-active", i === idx); });
        active = idx;
        preload(idx);
      }
      seek(layers[idx]);
    };
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); }
    }, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  /* ---------- En-tête opaque après l'intro ---------- */
  var hdr = document.querySelector(".hdr");
  if (hdr) {
    var solid = function () { hdr.classList.toggle("is-solid", window.scrollY > (document.getElementById("journey") ? document.getElementById("journey").offsetHeight - 80 : window.innerHeight * 0.7)); };
    window.addEventListener("scroll", solid, { passive: true });
    solid();
  }

  /* ---------- 2. Apparitions (transform uniquement, rien n'est caché) ---------- */
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll(".rise").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".rise").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 3. Galerie à glisser à la souris ---------- */
  document.querySelectorAll(".track").forEach(function (track) {
    var down = false, sx = 0, sl = 0;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add("is-drag");
    });
    window.addEventListener("pointermove", function (e) { if (down) track.scrollLeft = sl - (e.clientX - sx); });
    window.addEventListener("pointerup", function () { down = false; track.classList.remove("is-drag"); });
  });

  /* ---------- 4. Ouvert / fermé, heure de Lausanne ---------- */
  var H = S.hours;
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var fmt = function (m) { return Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : ""); };
  var status = function () {
    var els = document.querySelectorAll("[data-status]");
    if (!H || !els.length) return;
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    var mins = Number(get("hour")) * 60 + Number(get("minute"));
    var open = (H[wd] || []).find(function (s) { return mins >= s[0] && mins < s[1]; });
    var txt = "";
    if (open) txt = "Ouvert maintenant · jusqu'à " + fmt(open[1]);
    else {
      for (var k = 0; k < 8 && !txt; k++) {
        var d = (wd + k) % 7;
        var nx = (H[d] || []).find(function (s) { return k > 0 || s[0] > mins; });
        if (nx) txt = "Fermé · ouvre " + (k === 0 ? "aujourd'hui" : k === 1 ? "demain" : DAYS[d]) + " à " + fmt(nx[0]);
      }
    }
    els.forEach(function (el) { el.textContent = txt; el.classList.toggle("is-open", !!open); });
  };
  status();
  setInterval(status, 60000);

  /* ---------- 5. Réservation (démo, rien n'est envoyé) ---------- */
  var form = document.getElementById("book");
  var MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  // Disponibilités simulées mais stables : même résultat pour un même jour et une même heure.
  var busy = function (dayKey, m, who) { var x = Math.sin(dayKey * 12.9898 + m * 78.233 + who.length * 3.1) * 43758.5; return (x - Math.floor(x)) < 0.42; };
  var zurichNow = function () {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    var g = function (t) { return Number((p.find(function (q) { return q.type === t; }) || {}).value); };
    return { d: new Date(g("year"), g("month") - 1, g("day")), mins: g("hour") * 60 + g("minute") };
  };
  var openDays = function (n) {
    var now = zurichNow(), out = [];
    for (var k = 0; out.length < n && k < 21; k++) {
      var d = new Date(now.d); d.setDate(d.getDate() + k);
      var sp = (H || {})[d.getDay()] || [];
      if (!sp.length) continue;
      var slots = [];
      sp.forEach(function (r) { for (var m = r[0]; m + 30 <= r[1]; m += 30) if (k > 0 || m > now.mins + 30) slots.push(m); });
      if (slots.length) out.push({ date: d, key: d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(), k: k, slots: slots });
    }
    return out;
  };
  var label = function (o) { return o.k === 0 ? "aujourd'hui" : o.k === 1 ? "demain" : DAYS[o.date.getDay()] + " " + o.date.getDate() + " " + MONTHS[o.date.getMonth()]; };

  var nexts = document.querySelectorAll("[data-next] b, [data-next2] b");
  if (nexts.length) {
    var found = null;
    openDays(3).some(function (o) { return o.slots.some(function (m) { if (!busy(o.key, m, "any")) { found = label(o) + " à " + fmt(m); return true; } }); });
    nexts.forEach(function (n) { n.textContent = found || "demain"; });
  }
  var row = document.querySelector('[data-hours] [data-day="' + zurichNow().d.getDay() + '"]');
  if (row) row.classList.add("is-today");

  if (form) {
    var st = { service: null, barber: null, day: null, time: null }, step = 0;
    var panels = form.querySelectorAll(".book__panel"), dots = form.querySelectorAll(".book__steps li");
    var back = form.querySelector("[data-back]");
    var go = function (n) {
      step = n;
      panels.forEach(function (p) { p.classList.toggle("is-on", Number(p.dataset.step) === n); });
      dots.forEach(function (d, i) { d.classList.toggle("is-on", i === n); d.classList.toggle("is-done", i < n); });
      back.hidden = n === 0 || n === 4;
      if (n === 2) drawDays();
      if (n === 3) form.querySelector("[data-recap]").innerHTML = "<b>" + st.service[0] + "</b> · " + st.service[1] + " CHF<br>avec " + (st.barber.indexOf("Peu") === 0 ? "le premier barbier libre" : st.barber) + "<br>" + label(st.day) + " à " + fmt(st.time);
    };
    var mk = function (html, fn, cls) { var b = document.createElement("button"); b.type = "button"; b.className = cls || "opt"; b.innerHTML = html; b.addEventListener("click", fn); return b; };
    var sv = form.querySelector('[data-group="service"]');
    (S.services || []).forEach(function (x) { sv.appendChild(mk("<span>" + x[0] + " <small>· " + x[2] + " min</small></span><small>" + x[1] + ".–</small>", function () { st.service = x; go(st.barber ? 2 : 1); })); });
    var bb = form.querySelector('[data-group="barber"]');
    (S.barbers || []).forEach(function (x) { bb.appendChild(mk("<span>" + x + "</span><small>→</small>", function () { st.barber = x; go(2); })); });
    var days = openDays(6), dWrap = form.querySelector("[data-days]"), sWrap = form.querySelector("[data-slots]");
    var drawSlots = function () {
      sWrap.innerHTML = "";
      st.day.slots.forEach(function (m) {
        var b = mk(fmt(m), function () { st.time = m; go(3); }, "slot");
        b.disabled = busy(st.day.key, m, st.barber || "any");
        sWrap.appendChild(b);
      });
    };
    var drawDays = function () {
      dWrap.innerHTML = "";
      if (!st.day) st.day = days[0];
      days.forEach(function (o) {
        var b = mk("<span>" + (o.k === 0 ? "Auj." : o.k === 1 ? "Dem." : DAYS[o.date.getDay()].slice(0, 3) + ".") + "</span><b>" + o.date.getDate() + "</b>", function () { st.day = o; drawDays(); }, "day" + (o === st.day ? " is-on" : ""));
        dWrap.appendChild(b);
      });
      drawSlots();
    };
    back.addEventListener("click", function () { if (step === 2) st.barber = null; if (step === 1) st.service = null; go(Math.max(0, step - 1)); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["name", "tel"].forEach(function (n) { var i = form.elements[n]; var bad = !i.value.trim() || (n === "tel" && i.value.replace(/\D/g, "").length < 9); i.classList.toggle("is-bad", bad); if (bad) ok = false; });
      if (!ok) return;
      form.querySelector("[data-done]").textContent = "Merci " + form.elements.name.value.trim() + " ! Votre " + st.service[0].toLowerCase() + " est demandée pour " + label(st.day) + " à " + fmt(st.time) + ". Le salon vous confirme par SMS.";
      go(4);
    });
    form.querySelector("[data-restart]").addEventListener("click", function () { form.reset(); st = { service: null, barber: null, day: null, time: null }; go(0); });
    document.querySelectorAll("[data-pick-barber]").forEach(function (b) {
      b.addEventListener("click", function () {
        st.barber = b.getAttribute("data-pick-barber");
        go(st.service ? 2 : 0);
        document.getElementById("reserver").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    });
  }
})();
