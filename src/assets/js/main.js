// 나컴퍼니 사이트 스크립트
// 1) 1면 고정 기간이 지났으면 철학을 맨 위로 되돌리기
// 2) 기사 벽돌 쌓기(칸 너비는 같고, 가장 짧은 줄 아래로 차례로 쌓기)
// 3) 링크 복사 버튼

(function () {
  var pin = document.querySelector("[data-hero-pin]");
  if (!pin) return;
  var until = pin.getAttribute("data-until");
  if (!until) return;
  var today = new Date();
  var t = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  if (until >= t) return;
  pin.hidden = true;
  var about = document.querySelector("[data-hero-about]");
  if (about) about.hidden = false;
  var think = document.querySelector("[data-think]");
  if (think) think.hidden = true;
  var brick = document.querySelector("[data-pin-brick]");
  if (brick) brick.hidden = false;
  var ab = document.querySelector("[data-about-brick]");
  if (ab) ab.hidden = true;
})();

(function () {
  var walls = document.querySelectorAll("[data-wall]");
  if (!walls.length) return;
  walls.forEach(function (wall) {
    var items = [].slice.call(wall.children).filter(function (el) { return !el.classList.contains("col"); });
    function count() {
      var w = wall.clientWidth;
      return w >= 1450 ? 5 : w >= 1000 ? 4 : w >= 640 ? 3 : w >= 480 ? 2 : 1;
    }
    var last = 0;
    function layout() {
      var n = count();
      if (n === last) return;
      last = n;
      var cols = [], hs = [];
      for (var i = 0; i < n; i++) { var c = document.createElement("div"); c.className = "col"; cols.push(c); hs.push(0); }
      var k = 0;
      items.forEach(function (el) {
        if (el.hidden) { cols[0].appendChild(el); return; }
        var idx = k < n ? k : hs.indexOf(Math.min.apply(null, hs));
        cols[idx].appendChild(el);
        hs[idx] += parseFloat(el.getAttribute("data-h")) || 1;
        k++;
      });
      wall.innerHTML = "";
      cols.forEach(function (c) { wall.appendChild(c); });
      wall.classList.add("is-masonry");
    }
    layout();
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 150); });
  });
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

// 변화 읽기 칸: 아래 기사 벽과 같은 칸 수로 맞춰서 세로 경계가 어긋나지 않게
(function () {
  var list = document.querySelector("[data-watch]");
  if (!list) return;
  function set() {
    var w = list.clientWidth;
    list.setAttribute("data-cols", w >= 1450 ? 5 : w >= 1000 ? 4 : w >= 640 ? 3 : w >= 480 ? 2 : 1);
  }
  set();
  window.addEventListener("resize", set);
})();

// 회사 소개: 대상별(학생·교사·기관·기업) 세 가지 힘 바꿔 보기
(function () {
  var tabs = document.querySelectorAll("[data-aud]");
  if (!tabs.length) return;
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var k = t.getAttribute("data-aud");
      tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); });
      document.querySelectorAll("[data-aud-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-aud-panel") !== k; });
    });
  });
})();
