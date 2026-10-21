/* SUGAR RUSH — site script
   メニュー・ヘッダー・お問い合わせ送信・HOMEのマイクロインタラクション（記録の線・淡い光・Canvas） */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---- モバイルメニュー ----
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("gnav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // ---- ヘッダーの境界線 ----
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- お問い合わせフォーム（Netlify Forms）----
  // 送信に失敗したとき「ページが見つかりません」に移動せず、その場でお知らせする
  Array.prototype.forEach.call(document.querySelectorAll('form[data-netlify="true"]'), function (form) {
    form.addEventListener("submit", function (e) {
      if (!window.fetch || !window.URLSearchParams || !window.FormData) return; // 古いブラウザは通常の送信
      e.preventDefault();
      if (form.reportValidity && !form.reportValidity()) return;
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      var box = form.querySelector(".form-status");
      if (!box) {
        box = document.createElement("p");
        box.className = "form-status alert alert-error";
        box.setAttribute("role", "alert");
        box.hidden = true;
        form.insertBefore(box, form.firstChild);
      }
      box.hidden = true;
      if (btn) { btn.disabled = true; btn.textContent = "送信しています…"; }
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .then(function (res) {
          if (!res.ok) throw new Error("status " + res.status);
          window.location.href = form.getAttribute("action") || "/contact/thanks/";
        })
        .catch(function () {
          box.textContent = "送信できませんでした。時間をおいて再度お試しいただくか、お手数ですが sugar5502@gmail.com までメールでご連絡ください。";
          box.hidden = false;
          box.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  });

  // =================================================================
  // HOME：マイクロインタラクション
  // =================================================================
  var hero = document.querySelector(".hero");
  if (!hero) return;

  // ---- 1. 記録の線（SVGパスの描画）と、線上に順番に現れる点 ----
  var thread = hero.querySelector(".hero-thread");
  if (thread) {
    var path = thread.querySelector("path.main");
    var dotsG = thread.querySelector(".dots");
    if (path && dotsG && path.getTotalLength) {
      var L = path.getTotalLength();
      var N = 9;
      for (var i = 0; i < N; i++) {
        var pt = path.getPointAtLength(L * (0.08 + (0.86 * i) / (N - 1)));
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", pt.x.toFixed(1));
        c.setAttribute("cy", pt.y.toFixed(1));
        c.setAttribute("r", i === N - 1 ? "5" : "3");
        if (i === N - 1) c.setAttribute("class", "end");
        c.style.animationDelay = (0.5 + i * 0.22) + "s";
        dotsG.appendChild(c);
      }
    }
    // 画面に入ったら描き始める
    var startThread = function () { hero.classList.add("is-drawn"); };
    if (reduce || !("IntersectionObserver" in window)) startThread();
    else new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { startThread(); ob.disconnect(); } }, { threshold: 0.2 }).observe(hero);
  }

  // ---- 2. カーソルに追従する淡い光 ----
  var glow = hero.querySelector(".hero-glow");
  var pointer = { x: -9999, y: -9999, inside: false };
  if (glow && finePointer && !reduce) {
    var gx = 0, gy = 0, tx = 0, ty = 0, glowRaf = 0;
    var tick = function () {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
      if (Math.abs(tx - gx) > 0.4 || Math.abs(ty - gy) > 0.4) glowRaf = requestAnimationFrame(tick);
      else glowRaf = 0;
    };
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = e.clientX - r.left - glow.offsetWidth / 2;
      ty = e.clientY - r.top - glow.offsetHeight / 2;
      if (!pointer.inside) { gx = tx; gy = ty; }
      pointer.inside = true;
      pointer.x = e.clientX; pointer.y = e.clientY;
      hero.classList.add("is-lit");
      if (!glowRaf) glowRaf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", function () {
      pointer.inside = false;
      pointer.x = pointer.y = -9999;
      hero.classList.remove("is-lit");
    });
  }

  // ---- 3. 5つの段階 ↔ Canvas の枝 ----
  var highlight = -1;
  Array.prototype.forEach.call(hero.querySelectorAll(".hero-steps li"), function (li, idx) {
    li.addEventListener("pointerenter", function () { highlight = idx; li.classList.add("is-active"); });
    li.addEventListener("pointerleave", function () { highlight = -1; li.classList.remove("is-active"); });
  });

  // ---- 4. ヒーロー Canvas：気づく → 記録する → 整理する → 振り返る → 続ける ----
  var canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var SAGE = "72,103,93", ROSE = "184,135,131", CHAMP = "217,200,173";
  var W = 0, H = 0, dpr = 1, start = 0, raf = 0, visible = true;
  var hl = [0, 0, 0, 0, 0]; // 枝ごとの強調度（なめらかに変化）

  var stem = [[0.08, 0.92], [0.30, 0.70], [0.42, 0.42], [0.88, 0.10]];
  var branches = [
    { t: 0.14, dx: -0.10, dy: -0.12 },
    { t: 0.32, dx: 0.16, dy: 0.02 },
    { t: 0.50, dx: -0.16, dy: -0.06 },
    { t: 0.68, dx: 0.14, dy: 0.10 },
    { t: 0.86, dx: -0.08, dy: -0.12 }
  ];
  var DAYS = 30;

  function bez(p, t) {
    var u = 1 - t;
    return [
      u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]
    ];
  }
  function X(v) { return v * W; }
  function Y(v) { return v * H; }
  function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3); }

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // カーソルとの距離から 0〜1 の近さを返す
  function near(x, y) {
    if (!pointer.inside) return 0;
    var r = canvas.getBoundingClientRect();
    var dx = pointer.x - r.left - x, dy = pointer.y - r.top - y;
    var d = Math.sqrt(dx * dx + dy * dy);
    return d > 90 ? 0 : 1 - d / 90;
  }

  function drawStem(progress) {
    ctx.beginPath();
    var steps = 120, n = Math.floor(steps * progress);
    for (var i = 0; i <= n; i++) {
      var p = bez(stem, i / steps);
      if (i === 0) ctx.moveTo(X(p[0]), Y(p[1])); else ctx.lineTo(X(p[0]), Y(p[1]));
    }
    ctx.strokeStyle = "rgba(" + SAGE + ",0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawBranch(b, k, h) {
    if (k <= 0) return;
    var o = bez(stem, b.t);
    var ex = o[0] + b.dx, ey = o[1] + b.dy;
    var cx = o[0] + b.dx * 0.2 + (b.dy * 0.4), cy = o[1] + b.dy * 0.8 - Math.abs(b.dx) * 0.3;
    ctx.beginPath();
    var steps = 40, n = Math.floor(steps * k);
    for (var i = 0; i <= n; i++) {
      var t = i / steps, u = 1 - t;
      var x = u * u * o[0] + 2 * u * t * cx + t * t * ex;
      var y = u * u * o[1] + 2 * u * t * cy + t * t * ey;
      if (i === 0) ctx.moveTo(X(x), Y(y)); else ctx.lineTo(X(x), Y(y));
    }
    ctx.strokeStyle = "rgba(" + (h > 0.01 ? ROSE : SAGE) + "," + (0.28 + 0.5 * h) + ")";
    ctx.lineWidth = 0.9 + 1.1 * h;
    ctx.stroke();
    if (k >= 1) {
      var lit = Math.max(h, near(X(ex), Y(ey)));
      ctx.beginPath();
      ctx.arc(X(ex), Y(ey), 3 + 3 * lit, 0, Math.PI * 2);
      ctx.fillStyle = lit > 0.01 ? "rgba(" + ROSE + "," + (0.6 + 0.4 * lit) + ")" : "rgba(" + CHAMP + ",0.95)";
      ctx.fill();
      if (lit > 0.01) {
        ctx.beginPath();
        ctx.arc(X(ex), Y(ey), 9 + 6 * lit, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + ROSE + "," + (0.35 * lit) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function drawDays(progress, time) {
    var shown = Math.floor(DAYS * progress);
    for (var i = 0; i < shown; i++) {
      var t = (i + 0.5) / DAYS;
      var p = bez(stem, t);
      var px = X(p[0]), py = Y(p[1]);
      var lit = near(px, py);
      var breathe = reduce ? 0 : Math.sin(time / 1400 + i * 0.6) * 0.5;
      var r = 2.2 + (i % 7 === 6 ? 1.2 : 0) + breathe * 0.4 + lit * 2.4;
      if (lit > 0.01) {
        ctx.beginPath();
        ctx.arc(px, py, r + 6 * lit, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + CHAMP + "," + (0.35 * lit) + ")";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + SAGE + "," + Math.min(1, 0.55 + 0.4 * (i / DAYS) + 0.3 * lit) + ")";
      ctx.fill();
    }
    if (progress >= 1) {
      var end = bez(stem, 1);
      ctx.beginPath();
      ctx.arc(X(end[0]), Y(end[1]), 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + ROSE + ",0.95)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(X(end[0]), Y(end[1]), 11 + (reduce ? 0 : Math.sin(time / 1600) * 2), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + ROSE + ",0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawGrain() {
    ctx.strokeStyle = "rgba(" + CHAMP + ",0.28)";
    ctx.lineWidth = 0.6;
    for (var y = 0.16; y < 1; y += 0.12) {
      ctx.beginPath();
      ctx.moveTo(X(0.04), Y(y));
      ctx.lineTo(X(0.96), Y(y));
      ctx.stroke();
    }
  }

  function frame(now) {
    if (!start) start = now;
    var el = reduce ? 1e9 : now - start;
    for (var k = 0; k < hl.length; k++) {
      var target = highlight === k ? 1 : 0;
      hl[k] += (target - hl[k]) * (reduce ? 1 : 0.15);
    }
    ctx.clearRect(0, 0, W, H);
    drawGrain();
    drawStem(ease(el / 3200));
    drawDays(ease((el - 600) / 4200), now);
    for (var i = 0; i < branches.length; i++) {
      drawBranch(branches[i], ease((el - 900 - i * 700) / 1200), hl[i]);
    }
    if (visible) raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    }).observe(canvas);
  }
  raf = requestAnimationFrame(frame);
})();
