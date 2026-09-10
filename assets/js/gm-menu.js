/* 전체 메뉴 — 모든 페이지 공통.
   [data-menu-open] 단추를 누르면 묶음별 전체 목록이 화면을 덮는다. */
(function () {
  var GROUPS = [
    { t: "지금 상을 당하셨다면", items: [
      ["jeolcha.html", "무엇부터 해야 하나", "임종 직후 여섯 시간, 3일장"],
      ["sikjang.html", "장례식장·납골당 찾기", "지금 계신 곳에서 가까운 순"],
      ["bugojang.html", "모바일 부고장", "링크 하나로 빈소·지도·전화까지"],
      ["bugo.html", "부고 문안", "문자로 보낼 짧은 글"]
    ]},
    { t: "후불제 장례", items: [
      ["hubul.html", "어떻게 진행되나", "접수부터 정산까지 다섯 단계"],
      ["danga.html", "품목별 단가표", "먼저 드리고, 없는 항목은 청구 안 함"]
    ]},
    { t: "장례가 끝난 뒤", items: [
      ["kiil.html", "기일 리마인드", "해마다 먼저 연락, 전부 무료"],
      ["hyeopryeok.html", "함께하는 곳", "화환·답례품·영정사진·유품정리"]
    ]},
    { t: "미리 알아두기", items: [
      ["gaeum.html", "장례비 가늠", "조건을 넣으면 대략의 액수"],
      ["jeoul.html", "내 상조 점검", "해약환급금 계산"],
      ["gyeolhap.html", "결합상품 판별", "여덟 문항"],
      ["christian.html", "기독교 장례", "네 번의 예배"]
    ]},
    { t: "고마움 상조", items: [
      ["yaksok.html", "대표의 글", "김병호 · Since 2006"],
      ["./", "홈", ""]
    ]}
  ];
  var here = location.pathname.split("/").pop() || "index.html";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var html = '<div class="gm-menu" id="gmMenu" hidden role="dialog" aria-modal="true" aria-label="전체 메뉴">' +
    '<div class="gm-menu-top"><span class="gm-menu-brand">고마움 상조</span>' +
    '<button type="button" class="gm-menu-close" data-menu-close aria-label="메뉴 닫기">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="gm-menu-body">';
  for (var g = 0; g < GROUPS.length; g++) {
    html += '<section class="gm-menu-group"><h2>' + esc(GROUPS[g].t) + '</h2><ul>';
    var items = GROUPS[g].items;
    for (var i = 0; i < items.length; i++) {
      var f = items[i][0], cur = (f === here) || (f === "./" && here === "index.html");
      html += '<li><a href="' + esc(f) + '"' + (cur ? ' aria-current="page"' : '') + '><b>' + esc(items[i][1]) + '</b>' +
        (items[i][2] ? '<small>' + esc(items[i][2]) + '</small>' : '') + '</a></li>';
    }
    html += '</ul></section>';
  }
  html += '</div><div class="gm-menu-foot"><a class="gm-menu-call" data-phone href="#">전화</a>' +
    '<span>미리 받지 않습니다 · 쓰신 만큼만 · 해마다 곁에</span></div></div>';

  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  ready(function () {
    document.body.insertAdjacentHTML("beforeend", html);
    var menu = document.getElementById("gmMenu"), lastFocus = null;
    // 전화 단추 채우기 (gm-chrome.js가 먼저 돌았을 수 있으므로 여기서도 한 번)
    var raw = (window.PHONE || "").replace(/[^\d+]/g, "");
    var call = menu.querySelector(".gm-menu-call");
    if (raw) { call.href = "tel:" + raw; call.textContent = "전화 " + raw.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, "$1-$2-$3"); }
    else { call.removeAttribute("href"); call.textContent = "전화 접수 준비 중"; call.classList.add("soon"); }

    function open() { lastFocus = document.activeElement; menu.hidden = false; document.body.classList.add("gm-menu-open"); menu.querySelector("[data-menu-close]").focus(); }
    function close() { menu.hidden = true; document.body.classList.remove("gm-menu-open"); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    var opens = document.querySelectorAll("[data-menu-open]");
    for (var k = 0; k < opens.length; k++) opens[k].addEventListener("click", open);
    menu.addEventListener("click", function (e) { if (e.target.closest("[data-menu-close]")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) close(); });
  });
})();
