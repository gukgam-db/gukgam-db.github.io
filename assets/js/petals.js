/* ── 떨어지는 백합 꽃잎 ──────────────────────────────────
   사진 위에 캔버스를 한 장 얹고, 상아색 꽃잎 몇 장이 천천히 내려온다.
   흔들리며 돌고, 아래쪽 글자 근처에서는 옅어져 사라진다.
   사용: Petals.mount(container)  — container는 position:relative/absolute인 요소
   움직임 줄이기 설정이면 그리지 않는다. 화면 밖·다른 탭이면 멈춘다. */
(function () {
  "use strict";
  function mount(host, opts) {
    opts = opts || {};
    if (!host || !window.requestAnimationFrame) return null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    var cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:" + (opts.z || 1);
    host.appendChild(cv);
    var ctx = cv.getContext("2d");
    var w = 0, h = 0, dpr = 1, petals = [], raf = 0, running = false, visible = true, last = 0;
    var fadeFrom = opts.fadeFrom || 0.55;   // 이 높이(비율)부터 옅어진다
    var count = opts.count || (window.innerWidth < 760 ? 9 : 16);

    function resize() {
      var r = host.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }
    function spawn(p, top) {
      p.x = Math.random() * w;
      p.y = top ? -20 - Math.random() * 40 : Math.random() * h * 0.7;
      p.s = 9 + Math.random() * 9;                 // 크기
      p.vy = 14 + Math.random() * 14;               // 초당 픽셀
      p.sway = 18 + Math.random() * 22;             // 좌우 흔들림 폭
      p.sp = 0.5 + Math.random() * 0.6;             // 흔들림 속도
      p.ph = Math.random() * Math.PI * 2;
      p.rot = Math.random() * Math.PI * 2;
      p.vr = (Math.random() - 0.5) * 0.9;           // 회전 속도
      p.a = 0.55 + Math.random() * 0.35;            // 불투명도
      p.t = Math.random() * 100;
      return p;
    }
    function petal(x, y, s, rot, alpha) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      var g = ctx.createLinearGradient(-s, 0, s, 0);
      g.addColorStop(0, "rgba(236,228,206,1)");
      g.addColorStop(0.5, "rgba(248,244,232,1)");
      g.addColorStop(1, "rgba(225,214,186,1)");
      ctx.fillStyle = g;
      ctx.beginPath();                              // 백합 꽃잎: 길고 끝이 뾰족한 잎 모양
      ctx.moveTo(0, -s * 1.6);
      ctx.bezierCurveTo(s * 0.9, -s * 0.9, s * 0.8, s * 0.9, 0, s * 1.4);
      ctx.bezierCurveTo(-s * 0.8, s * 0.9, -s * 0.9, -s * 0.9, 0, -s * 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(190,178,150,0.35)";  // 잎맥 한 줄
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(0, s * 1.1); ctx.stroke();
      ctx.restore();
    }
    function frame(ts) {
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.t += dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        var x = p.x + Math.sin(p.t * p.sp + p.ph) * p.sway;
        var f = p.y / h;
        var fade = f < fadeFrom ? 1 : Math.max(0, 1 - (f - fadeFrom) / (0.95 - fadeFrom));
        if (p.y > h * 0.96 || fade <= 0) { spawn(p, true); continue; }
        petal(x, p.y, p.s, p.rot + Math.sin(p.t * 0.7) * 0.3, p.a * fade);
      }
      raf = requestAnimationFrame(frame);
    }
    function play() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
    function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    if (!resize()) return null;
    for (var i = 0; i < count; i++) petals.push(spawn({}, false));
    play();

    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); else if (visible) play(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !document.hidden) play(); else pause(); }, { threshold: 0 }).observe(host);
    }
    return { pause: pause, play: play };
  }
  window.Petals = { mount: mount };
})();
