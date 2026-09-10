/* 근거영양 — 공용 스크립트: 헤더/푸터 주입, 모바일 내비, 글자 크기 */
(function () {
  var root = document.documentElement;
  try { var fs = localStorage.getItem('ebn_fs'); if (fs) root.setAttribute('data-fs', fs); } catch (e) {}

  var NAV = [
    ['index.html', '홈'],
    ['gyeollon.html', '핵심 결론'],
    ['seongbun.html', '성분별 근거'],
    ['jilhwan.html', '질환별 판정'],
    ['bokyong.html', '약·복용법'],
    ['saengae.html', '생애주기'],
    ['jeungsang.html', '증상별'],
    ['geomsa.html', '검사·계산기'],
    ['deunggeup.html', '허가 등급'],
    ['yongeo.html', '용어집'],
    ['yeongu.html', '연구 DB'],
    ['chucheon.html', '내게 맞는 영양제'],
    ['jepum.html', '제품 고르는 법'],
    ['rnd.html', 'R&D'],
    ['about.html', '원칙·소개']
  ];

  function here() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }

  function header() {
    var cur = here();
    var links = NAV.map(function (n) {
      return '<a href="' + n[0] + '"' + (n[0] === cur ? ' class="on"' : '') + '>' + n[1] + '</a>';
    }).join('');
    return '<div class="a11y-bar"><div class="a11y-inner">' +
      '<span>글자 크기</span>' +
      '<button class="a11y-btn" data-fs="">보통</button>' +
      '<button class="a11y-btn" data-fs="lg">크게</button>' +
      '<button class="a11y-btn" data-fs="xl">더 크게</button>' +
      '<span class="spacer"></span><span>근거 갱신 2026-09 · 광고·협찬 없음</span>' +
      '</div></div>' +
      '<div class="beta-bar"><div class="a11y-inner"><b>전문가 감수 전(베타)</b> 이 사이트의 모든 내용은 공개 연구를 정리한 <b>일반 정보</b>이며 진단·처방이 아닙니다. 약사·의사 감수 후 표시가 바뀝니다. 질환·약 복용·임신 중에는 영양제 시작 전 반드시 의료인과 상의하세요.' +
      '</div></div>' +
      '<header class="site-header"><div class="nav-inner">' +
      '<a class="brand" href="index.html"><span class="mark">EB</span>근거영양 <span class="tag">연구로 고르는 영양제</span></a>' +
      '<button class="nav-toggle" aria-label="메뉴" aria-expanded="false">☰ 메뉴</button>' +
      '<nav class="site-nav">' + links + '</nav>' +
      '</div></header>';
  }

  function footer() {
    return '<footer class="site-footer"><div class="footer-inner">' +
      '<h4>근거영양 · Evidence-Based Nutrition Lab</h4>' +
      '<div class="footer-links">' + NAV.map(function (n) { return '<a href="' + n[0] + '">' + n[1] + '</a>'; }).join('') + '</div>' +
      '<div class="footer-note"><b>면책</b> 본 사이트는 공개된 임상연구·공식 기관 자료를 정리한 일반 건강 정보이며 의료법상 진단·처방·의료행위가 아닙니다. 개인의 건강 상태·복용 약 전체를 반영하지 못하므로 어떤 영양제든 시작·중단 전 의사·약사와 상의하세요. 이 정보를 근거로 한 판단과 결과의 책임은 이용자에게 있습니다. 내용은 전문가 감수 전이며 오류가 있을 수 있습니다(발견 시 제보 바랍니다). ' +
      '인용 연구는 각 항목의 원문 링크(PubMed·학술지·NIH·식약처)를 통해 직접 확인할 수 있습니다. ' +
      '이해상충: 현재 제품 판매·광고·협찬이 없으며, 향후 판매를 시작하면 해당 페이지에 명시합니다. © 2026 근거영양.</div>' +
      '</div></footer>';
  }

  function mount() {
    var h = document.getElementById('site-header');
    var f = document.getElementById('site-footer');
    if (h) h.outerHTML = header();
    if (f) f.outerHTML = footer();

    var tg = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.site-nav');
    if (tg && nav) tg.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      tg.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    var cur = root.getAttribute('data-fs') || '';
    document.querySelectorAll('.a11y-btn[data-fs]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-fs') === cur);
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-fs');
        if (v) root.setAttribute('data-fs', v); else root.removeAttribute('data-fs');
        try { localStorage.setItem('ebn_fs', v); } catch (e) {}
        document.querySelectorAll('.a11y-btn[data-fs]').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
  }

  function glossify() {
    var G = window.EBN_GLOSSARY; if (!G || !G.length || document.body.hasAttribute('data-noglossary')) return;
    var map = {}, keys = [];
    G.forEach(function (g) { [g.term].concat(g.alias || []).forEach(function (t) { if (t && t.length >= 2) { map[t] = g; keys.push(t); } }); });
    keys.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('(?<![\\w가-힣])(' + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![\w가-힣])', 'g');
    var counts = {}, MAX = 3;
    var walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      var p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
      var tag = p.nodeName; if (/^(A|SCRIPT|STYLE|CODE|PRE|INPUT|TEXTAREA|SELECT|OPTION|BUTTON|H1|ABBR)$/.test(tag)) return NodeFilter.FILTER_REJECT;
      if (p.closest && p.closest('a, .gl, .nosrc, .grade, .verdict, .chip, .drug-chip, .c, h1, h2, .page-head, .beta-bar, .a11y-bar')) return NodeFilter.FILTER_REJECT;
      return re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment(), last = 0, txt = n.nodeValue, m; re.lastIndex = 0;
      while ((m = re.exec(txt))) {
        var g = map[m[1]]; counts[g.term] = (counts[g.term] || 0) + 1; if (counts[g.term] > MAX) continue;
        frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
        var ab = document.createElement('abbr'); ab.className = 'gl'; ab.textContent = m[1]; ab.setAttribute('title', g.def); ab.setAttribute('tabindex', '0');
        ab.addEventListener('click', function (e) { e.preventDefault(); showGl(g, ab); });
        frag.appendChild(ab); last = m.index + m[1].length;
      }
      if (last === 0) return; frag.appendChild(document.createTextNode(txt.slice(last))); n.parentNode.replaceChild(frag, n);
    });
    function showGl(g, at) {
      var old = document.getElementById('gl-pop'); if (old) old.remove();
      var d = document.createElement('div'); d.id = 'gl-pop'; d.className = 'gl-pop';
      d.innerHTML = '<b>' + g.term + '</b> <span class="small">' + (g.cat || '') + '</span><p>' + g.def + '</p><a href="yongeo.html#' + encodeURIComponent(g.term) + '">용어집에서 보기</a> <button type="button" aria-label="닫기">✕</button>';
      document.body.appendChild(d);
      var r = at.getBoundingClientRect(); d.style.top = (window.scrollY + r.bottom + 6) + 'px'; d.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.innerWidth - 340)) + 'px';
      d.querySelector('button').addEventListener('click', function () { d.remove(); });
      setTimeout(function () { document.addEventListener('click', function h(e) { if (!d.contains(e.target) && e.target !== at) { d.remove(); document.removeEventListener('click', h); } }); }, 0);
    }
  }
  window.EBN_glossify = glossify;
  function mountAll() { mount(); setTimeout(glossify, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();

  // 공용 유틸
  window.EBN = {
    gradeLabel: { A: 'A · 대규모 RCT 다수 일관', B: 'B · RCT 또는 메타분석 근거', C: 'C · 관찰연구·소규모·혼재', D: 'D · 효과 없음(잘 설계된 연구)', X: 'X · 유해 근거' },
    verdictLabel: { rec: '근거 있음', cond: '조건부 근거', opt: '근거 약함', no: '효과 없음(연구 확인)', avoid: '유해 근거' },
    verdictClass: { rec: 'rec', cond: 'cond', opt: 'opt', no: 'no', avoid: 'avoid' },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  };
})();
