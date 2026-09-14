/* 속 페이지 공통 머리글의 전화 단추.
   site-keys.js의 PHONE이 있으면 tel: 링크가 되고, 없으면 '준비 중'으로 보입니다. */
(function () {
  var raw = (window.PHONE || "").replace(/[^\d+]/g, "");
  var els = document.querySelectorAll("[data-phone]");
  for (var i = 0; i < els.length; i++) {
    var a = els[i];
    if (raw) { a.href = "tel:" + raw; a.textContent = "전화"; a.classList.remove("soon"); }
    else { a.removeAttribute("href"); a.textContent = "접수 준비 중"; a.classList.add("soon"); a.setAttribute("aria-disabled", "true"); }
  }
})();
