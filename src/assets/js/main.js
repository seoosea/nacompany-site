// 나컴퍼니 사이트 스크립트
// 1) 첫 화면: 주황 점("나")에서 선이 뻗어 나가며 공간을 그리는 움직임
// 2) 기사 페이지: 링크 복사 버튼

(function () {
  var c = document.getElementById("draw");
  if (!c) return;
  var x = c.getContext("2d");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LINE = "#e9eef7", SPARK = "#f26b1d";
  var W, H, walkers, segs, phase, t0, alpha;
  var A = [0, 1, 2, 3, 4, 5].map(function (k) {
    var r = (k * Math.PI) / 3 + Math.PI / 6;
    return [Math.cos(r), Math.sin(r)];
  });
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function size() {
    var D = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
    W = r.width || 300; H = r.height || 300;
    c.width = W * D; c.height = H * D; x.setTransform(D, 0, 0, D, 0, 0);
  }
  function reset() {
    segs = []; walkers = []; phase = "draw"; alpha = 1;
    var s = W / 400;
    for (var i = 0; i < 6; i++) walkers.push({ x: W / 2, y: H / 2, dir: i, left: rnd(20, 70) * s, life: rnd(420, 620) * s, alive: true });
  }
  function stepAll() {
    var s = W / 400, sp = 1.5 * s, any = false;
    walkers.forEach(function (w) {
      if (!w.alive) return;
      any = true;
      var nx = w.x + A[w.dir][0] * sp, ny = w.y + A[w.dir][1] * sp;
      if (nx < 8 || ny < 8 || nx > W - 8 || ny > H - 8 || w.life <= 0) { w.alive = false; segs.push({ dot: [w.x, w.y] }); return; }
      segs.push({ l: [w.x, w.y, nx, ny] }); w.x = nx; w.y = ny; w.left -= sp; w.life -= sp;
      if (w.left <= 0) {
        w.dir = (w.dir + [1, 5, 2, 4][Math.floor(Math.random() * 4)]) % 6;
        w.left = rnd(18, 80) * s; segs.push({ dot: [w.x, w.y] });
        if (Math.random() < 0.18 && walkers.length < 16)
          walkers.push({ x: w.x, y: w.y, dir: (w.dir + 3) % 6, left: rnd(18, 60) * s, life: w.life * 0.6, alive: true });
      }
    });
    return any;
  }
  function paint() {
    x.clearRect(0, 0, W, H);
    x.globalAlpha = alpha; x.strokeStyle = LINE; x.lineWidth = 1.6; x.lineCap = "round";
    x.beginPath();
    segs.forEach(function (s) { if (s.l) { x.moveTo(s.l[0], s.l[1]); x.lineTo(s.l[2], s.l[3]); } });
    x.stroke(); x.fillStyle = LINE;
    segs.forEach(function (s) { if (s.dot) { x.beginPath(); x.arc(s.dot[0], s.dot[1], 2, 0, 7); x.fill(); } });
    x.globalAlpha = 1; x.fillStyle = SPARK; x.beginPath(); x.arc(W / 2, H / 2, 7, 0, 7); x.fill();
  }
  function frame() {
    if (phase === "draw") { var go = stepAll(); go = stepAll() || go; if (!go) { phase = "hold"; t0 = performance.now(); } }
    else if (phase === "hold") { if (performance.now() - t0 > 2600) phase = "fade"; }
    else { alpha -= 0.02; if (alpha <= 0) reset(); }
    paint(); requestAnimationFrame(frame);
  }
  size(); reset();
  if (reduce) { while (stepAll()) {} paint(); window.addEventListener("resize", function () { size(); reset(); while (stepAll()) {} paint(); }); return; }
  window.addEventListener("resize", function () { size(); reset(); });
  requestAnimationFrame(frame);
})();

(function () {
  var b = document.getElementById("copyLink");
  if (!b) return;
  var done = document.getElementById("copyDone");
  b.addEventListener("click", function () {
    var url = location.href.split("#")[0];
    function show(t) { done.textContent = t; done.hidden = false; }
    try { navigator.clipboard.writeText(url).then(function () { show("링크를 복사했습니다"); }, function () { show(url); }); }
    catch (e) { show(url); }
  });
})();
