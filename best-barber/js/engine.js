// Moteur commun : film piloté par le scroll (vidéo sur ordinateur, suite d'images sur téléphone),
// apparitions, galerie à glisser, badge ouvert/fermé.
// Réglages par site dans window.SITE = { frames, ranges, hours }.
(function () {
  "use strict";
  var S = window.SITE || {};
  document.documentElement.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(hover: none) and (pointer: coarse), (max-width: 860px)").matches;

  /* ---------- 1. Film piloté par le scroll ---------- */
  var root = document.getElementById("journey");
  if (root) {
    var media = root.querySelector(".ss__media");
    var bar = root.querySelector(".ss__progress span");
    var chapters = Array.prototype.slice.call(root.querySelectorAll(".ss__chapter"));
    var layers = [];
    var frameTarget = 0;
    var canvasMode = mobile && !reduced && S.frames;

    chapters.forEach(function (ch, i) {
      var n = ch.getAttribute("data-clip");
      ch.style.minHeight = parseFloat(ch.getAttribute("data-scroll") || "1.4") * 100 + "dvh";
      var layer = document.createElement("figure");
      layer.className = "ss__layer" + (i === 0 ? " is-active" : "");
      var poster = document.createElement("img");
      poster.alt = "";
      poster.src = "assets/world/scene-0" + n + (mobile ? "-mobile" : "") + "-poster.jpg";
      layer.appendChild(poster);
      media.appendChild(layer);
      layers.push({ el: layer, ch: ch, src: "assets/world/scene-0" + n + ".mp4", video: null, target: 0 });
    });

    if (canvasMode) {
      var canvas = document.createElement("canvas");
      canvas.className = "ss__canvas";
      media.appendChild(canvas);
      var ctx = canvas.getContext("2d");
      var frames = new Array(S.frames);
      var current = 0, drawn = -1;
      var load = function (i) {
        if (frames[i]) return;
        var img = new Image();
        img.decoding = "async";
        img.onload = function () { img.ready = true; drawn = -1; };
        img.src = "assets/frames/f" + String(i + 1).padStart(3, "0") + ".webp";
        frames[i] = img;
      };
      for (var s = 0; s < S.frames; s += 8) load(s);
      setTimeout(function () { for (var k = 0; k < S.frames; k++) load(k); }, 300);
      var size = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(canvas.clientWidth * dpr);
        canvas.height = Math.round(canvas.clientHeight * dpr);
        drawn = -1;
      };
      window.addEventListener("resize", size);
      size();
      var nearest = function (i) {
        for (var d = 0; d < S.frames; d++) {
          if (frames[i - d] && frames[i - d].ready) return i - d;
          if (frames[i + d] && frames[i + d].ready) return i + d;
        }
        return -1;
      };
      var tick = function () {
        current += (frameTarget - current) * 0.18;
        var f = nearest(Math.round(current));
        if (f >= 0 && f !== drawn) {
          var img = frames[f], cw = canvas.width, chh = canvas.height;
          var sc = Math.max(cw / img.naturalWidth, chh / img.naturalHeight);
          var w = img.naturalWidth * sc, h = img.naturalHeight * sc;
          ctx.drawImage(img, (cw - w) / 2, (chh - h) / 2, w, h);
          drawn = f;
          canvas.classList.add("is-ready");
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

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
          if (S.ranges) frameTarget = S.ranges[i][0] + p * (S.ranges[i][1] - S.ranges[i][0]);
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
})();
