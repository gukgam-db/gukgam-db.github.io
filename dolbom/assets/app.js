/* 손길(SONGIL) — 공용 스크립트
   시니어 접근성: 글자크기 조절 · 고대비 · 모바일 내비 · 플로팅 상담버튼
   설정은 localStorage에 저장되어 페이지 이동/재방문 시 유지됩니다. */
(function () {
  var root = document.documentElement;

  // 저장된 설정 즉시 적용
  try {
    var fs = localStorage.getItem('songil_fs');
    var ct = localStorage.getItem('songil_contrast');
    if (fs) root.setAttribute('data-fs', fs);
    if (ct === 'high') root.setAttribute('data-contrast', 'high');
  } catch (e) {}

  function saveFs(v) {
    if (v) root.setAttribute('data-fs', v); else root.removeAttribute('data-fs');
    try { localStorage.setItem('songil_fs', v || ''); } catch (e) {}
    syncFsButtons(v || '');
  }
  function toggleContrast() {
    var on = root.getAttribute('data-contrast') === 'high';
    if (on) { root.removeAttribute('data-contrast'); } else { root.setAttribute('data-contrast', 'high'); }
    try { localStorage.setItem('songil_contrast', on ? '' : 'high'); } catch (e) {}
    var btn = document.getElementById('a11y-contrast');
    if (btn) btn.classList.toggle('on', !on);
  }
  function syncFsButtons(cur) {
    ['', 'lg', 'xl'].forEach(function (v) {
      var b = document.getElementById('a11y-fs-' + (v || 'base'));
      if (b) b.classList.toggle('on', cur === v);
    });
  }

  function build() {
    // 접근성 바
    var bar = document.createElement('div');
    bar.className = 'a11y-bar';
    bar.innerHTML =
      '<div class="a11y-inner">' +
        '<span class="label">글자 크기</span>' +
        '<button class="a11y-btn" id="a11y-fs-base" aria-label="기본 글자크기">가</button>' +
        '<button class="a11y-btn" id="a11y-fs-lg" aria-label="큰 글자" style="font-size:1rem">가+</button>' +
        '<button class="a11y-btn" id="a11y-fs-xl" aria-label="가장 큰 글자" style="font-size:1.1rem">가++</button>' +
        '<button class="a11y-btn" id="a11y-contrast" aria-label="고대비 모드">고대비</button>' +
        '<span class="spacer"></span>' +
        '<a class="a11y-link" href="tel:129">복지상담 129</a>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);

    document.getElementById('a11y-fs-base').addEventListener('click', function () { saveFs(''); });
    document.getElementById('a11y-fs-lg').addEventListener('click', function () { saveFs('lg'); });
    document.getElementById('a11y-fs-xl').addEventListener('click', function () { saveFs('xl'); });
    document.getElementById('a11y-contrast').addEventListener('click', toggleContrast);
    syncFsButtons(root.getAttribute('data-fs') || '');
    if (root.getAttribute('data-contrast') === 'high') {
      var cb = document.getElementById('a11y-contrast'); if (cb) cb.classList.add('on');
    }

    // 모바일 내비 토글
    var header = document.querySelector('.nav-inner');
    var nav = document.querySelector('.site-nav');
    if (header && nav) {
      var t = document.createElement('button');
      t.className = 'nav-toggle'; t.setAttribute('aria-label', '메뉴 열기'); t.innerHTML = '메뉴';
      header.insertBefore(t, nav);
      t.addEventListener('click', function () { nav.classList.toggle('open'); });
    }

    // 플로팅 상담 버튼
    var help = document.createElement('a');
    help.className = 'float-help'; help.href = 'jaryo.html';
    help.innerHTML = '<span class="txt">상담·전화 안내</span><span>&nbsp;›</span>';
    document.body.appendChild(help);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
