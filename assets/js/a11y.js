/* =========================================================
   갈매역삼성부동산 — 접근성 도구 (모든 페이지 공통)
   ① 화면 확대/축소  ② 소리내어 읽기(TTS)  ③ 고대비
   외부 라이브러리 없음. 설정은 브라우저에 기억됩니다.
   ========================================================= */
(function(){
  if (window.__a11yLoaded) return; window.__a11yLoaded = true;

  var LS = {
    get: function(k, d){ try{ var v=localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } },
    set: function(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  };

  /* ---------- 1) 화면 확대 (실제 화면을 크게 — Ctrl+ 와 같은 효과) ---------- */
  var ZOOMS = [1, 1.15, 1.3, 1.5, 1.75];
  var zi = parseInt(LS.get('a11y-zoom','0'),10); if(isNaN(zi)||zi<0||zi>=ZOOMS.length) zi=0;
  function applyZoom(){
    var z = ZOOMS[zi];
    // zoom 지원(크롬/사파리/엣지) → 그대로, 미지원(구형 파이어폭스) → transform 대체
    if('zoom' in document.documentElement.style){ document.documentElement.style.zoom = z; }
    else { document.body.style.transform='scale('+z+')'; document.body.style.transformOrigin='0 0'; document.body.style.width=(100/z)+'%'; }
    LS.set('a11y-zoom', zi);
    var lbl = Math.round(z*100)+'%';
    var el = document.getElementById('a11y-zoom-val'); if(el) el.textContent = lbl;
  }
  function zoomIn(){ if(zi<ZOOMS.length-1){ zi++; applyZoom(); } }
  function zoomOut(){ if(zi>0){ zi--; applyZoom(); } }
  function zoomReset(){ zi=0; applyZoom(); }

  /* ---------- 2) 고대비 ---------- */
  var hc = LS.get('a11y-contrast','0')==='1';
  function applyContrast(){ document.documentElement.classList.toggle('a11y-contrast', hc); LS.set('a11y-contrast', hc?'1':'0');
    var b=document.getElementById('a11y-hc'); if(b){ b.setAttribute('aria-pressed', hc?'true':'false'); b.classList.toggle('on', hc); } }
  function toggleContrast(){ hc=!hc; applyContrast(); }

  /* ---------- 3) 소리내어 읽기 (Web Speech API) ---------- */
  var synth = window.speechSynthesis || null;
  var speaking = false;
  function mainText(){
    // 선택한 글이 있으면 그걸, 없으면 본문 전체를 읽는다.
    var sel = (window.getSelection && String(window.getSelection())) || '';
    if (sel.trim().length > 1) return sel.trim();
    var src = document.querySelector('main, article, .jido-wrap, .container, .wrap') || document.body;
    var clone = src.cloneNode(true);
    ['header','footer','nav','script','style','.site-header','.site-nav','#a11y-panel','#a11y-fab'].forEach(function(s){
      clone.querySelectorAll(s).forEach(function(n){ n.remove(); });
    });
    return (clone.innerText||clone.textContent||'').replace(/\s+\n/g,'\n').replace(/\n{2,}/g,'\n').trim();
  }
  function chunk(t){ // 문장 단위로 잘라 정지/재생이 잘 되게
    var parts = t.replace(/([.!?。！？\n])/g,'$1').split('');
    var out=[], buf='';
    parts.forEach(function(p){ if((buf+p).length>180){ if(buf)out.push(buf); buf=p; } else buf+=p; });
    if(buf.trim()) out.push(buf);
    return out.filter(function(s){ return s.trim().length; });
  }
  function stopSpeak(){ if(synth){ synth.cancel(); } speaking=false; setReadBtn(false); }
  function startSpeak(){
    if(!synth){ alert('이 브라우저는 읽어주기를 지원하지 않습니다.'); return; }
    stopSpeak();
    var pieces = chunk(mainText());
    if(!pieces.length){ return; }
    speaking=true; setReadBtn(true);
    var i=0;
    (function next(){
      if(!speaking || i>=pieces.length){ speaking=false; setReadBtn(false); return; }
      var u = new SpeechSynthesisUtterance(pieces[i++]);
      u.lang='ko-KR'; u.rate=0.95; u.pitch=1;
      var vs = synth.getVoices()||[]; var ko = vs.filter(function(v){ return /ko/i.test(v.lang); })[0];
      if(ko) u.voice=ko;
      u.onend = next; u.onerror = function(){ speaking=false; setReadBtn(false); };
      synth.speak(u);
    })();
  }
  function toggleSpeak(){ if(speaking) stopSpeak(); else startSpeak(); }
  function setReadBtn(on){ var b=document.getElementById('a11y-read'); if(!b)return;
    b.classList.toggle('on', on); b.innerHTML = on ? '⏹ 그만 읽기' : '🔊 소리내어 읽기';
    b.setAttribute('aria-pressed', on?'true':'false'); }

  /* ---------- UI ---------- */
  function build(){
    var fab = document.createElement('button');
    fab.id='a11y-fab'; fab.type='button';
    fab.setAttribute('aria-label','접근성 도구 열기 — 화면 크게, 읽어주기');
    fab.innerHTML='<span aria-hidden="true">♿</span><span class="a11y-fab-t">접근성</span>';

    var panel = document.createElement('div');
    panel.id='a11y-panel'; panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','접근성 도구'); panel.hidden=true;
    panel.innerHTML =
      '<div class="a11y-hd">접근성 도구'
      + '<button id="a11y-x" type="button" aria-label="닫기">✕</button></div>'
      + '<div class="a11y-row"><span class="a11y-lab">글자·화면 크기</span>'
      +   '<div class="a11y-zoom">'
      +     '<button id="a11y-minus" type="button" aria-label="작게">−</button>'
      +     '<span id="a11y-zoom-val" aria-live="polite">100%</span>'
      +     '<button id="a11y-plus" type="button" aria-label="크게">+</button>'
      +     '<button id="a11y-rst" type="button" class="a11y-mini">기본</button>'
      +   '</div></div>'
      + '<div class="a11y-row"><button id="a11y-hc" type="button" class="a11y-big" aria-pressed="false">🌗 고대비 화면</button></div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function open(){ panel.hidden=false; fab.setAttribute('aria-expanded','true'); }
    function close(){ panel.hidden=true; fab.setAttribute('aria-expanded','false'); }
    fab.addEventListener('click', function(){ panel.hidden ? open() : close(); });
    document.getElementById('a11y-x').addEventListener('click', close);
    document.getElementById('a11y-plus').addEventListener('click', zoomIn);
    document.getElementById('a11y-minus').addEventListener('click', zoomOut);
    document.getElementById('a11y-rst').addEventListener('click', zoomReset);
    document.getElementById('a11y-hc').addEventListener('click', toggleContrast);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });

    // 저장된 설정 반영
    applyZoom(); applyContrast();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
