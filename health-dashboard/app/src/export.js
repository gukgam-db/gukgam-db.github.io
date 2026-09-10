// 카드(패널) 단위 내보내기: SVG(PPT 편집용) · PNG · CSV
// SVG는 CSS 변수/클래스에 의존하므로 계산된 스타일을 속성으로 인라인해 독립 파일로 만든다.

const SVG_PROPS = ["fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linejoin", "stroke-linecap",
  "opacity", "font-size", "font-family", "font-weight", "fill-opacity", "stroke-opacity", "paint-order", "text-anchor"];

const safe = (s) => String(s).replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 80);

const UA = navigator.userAgent || "";
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(UA);
const IN_APP = /KAKAOTALK|FBAN|FBAV|Instagram|Line\/|NAVER\(inapp|DaumApps/i.test(UA);

function toast(msg, ms = 3500) {
  let t = document.getElementById("hd-toast");
  if (!t) { t = document.createElement("div"); t.id = "hd-toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), ms);
}

/** 카카오톡 등 내장 브라우저: 파일 저장이 막혀 있으므로 외부 브라우저로 열도록 안내 */
function openExternal() {
  const url = location.href;
  if (/KAKAOTALK/i.test(UA)) { location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url); return; }
  if (/Line\//i.test(UA)) { location.href = url + (url.includes("?") ? "&" : "?") + "openExternalBrowser=1"; return; }
  toast("이 앱의 내장 브라우저에서는 파일 저장이 막혀 있습니다. 메뉴에서 '다른 브라우저로 열기'를 눌러 주세요.", 6000);
}

async function download(blob, filename) {
  if (!blob) { toast("이미지를 만들지 못했습니다. 다시 시도해 주세요."); return; }
  // claude.ai 아티팩트 뷰어 안에서는 일반 다운로드가 막혀 있어 뷰어의 저장 기능을 사용
  if (window.claude?.use) {
    try {
      const dl = await window.claude.use("downloads");
      if (dl) { await dl.save({ filename, data: blob }); return; }
    } catch (err) {
      if (err?.code !== "declined") console.warn("뷰어 저장 실패:", err);
      return;
    }
  }
  // 모바일: 공유 시트(갤러리·파일·카카오톡 등으로 저장)
  if (IS_MOBILE && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return; }
    } catch (err) {
      if (err?.name === "AbortError") return;      // 사용자가 공유 시트를 닫음
      console.warn("공유 실패, 다운로드로 대체:", err);
    }
  }
  if (IN_APP) { openExternal(); return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  toast(`${filename} 저장을 시작했습니다`);
  // 브라우저가 blob을 가져가기 전에 해제되면 다운로드가 조용히 실패하므로 충분히 늦게 해제
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
}

/** 원본 SVG의 계산 스타일을 복제본 속성으로 인라인 */
function inlineStyles(srcSvg, dstSvg) {
  const src = [srcSvg, ...srcSvg.querySelectorAll("*")];
  const dst = [dstSvg, ...dstSvg.querySelectorAll("*")];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const d = dst[i];
    SVG_PROPS.forEach((p) => {
      const v = cs.getPropertyValue(p);
      if (v && v !== "none" || p === "fill" || p === "stroke") d.setAttribute(p, (v || "none").replace(/"/g, "'"));
    });
    d.removeAttribute("class");
    d.removeAttribute("style");
    // 투명 히트 영역·이벤트 핸들러 잔재 제거
    if (d.getAttribute("fill") === "transparent" || d.getAttribute("fill") === "rgba(0, 0, 0, 0)") d.remove();
  });
}

/** 카드 → 제목·범례를 포함한 독립 SVG 문자열 */
export function cardToSvg(card) {
  const svg = card.querySelector("svg");
  if (!svg) return null;
  const vb = (svg.getAttribute("viewBox") || "0 0 560 260").split(/\s+/).map(Number);
  const W = vb[2], H = vb[3];
  const cs = getComputedStyle(card);
  const bg = cs.backgroundColor, fg = getComputedStyle(card.querySelector("h3") || card).color;
  const muted = getComputedStyle(card.querySelector(".desc") || card).color;
  // 글꼴 목록의 큰따옴표는 XML 속성값을 깨뜨리므로 작은따옴표로
  const font = cs.fontFamily.replace(/"/g, "'");
  const title = card.querySelector("h3")?.innerText?.trim() || "";
  const desc = card.querySelector(".desc")?.innerText?.trim() || "";

  const legendItems = [...card.querySelectorAll(".legend > span, .maplegend .lg-item")]
    .filter((sp) => sp.querySelector("i"))
    .map((sp) => ({ color: getComputedStyle(sp.querySelector("i")).backgroundColor, text: sp.innerText.trim() }));
  const legendNote = card.querySelector(".maplegend .lg-item:not(:has(i)) small")?.innerText?.trim() || "";

  const clone = svg.cloneNode(true);
  inlineStyles(svg, clone);
  const TOP = title ? 46 : 8;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  // 글자 폭 추정(한글 11.5px, 영문·숫자 6.5px) → 범례를 여러 줄로 배치
  const textW = (s) => [...s].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 11.5 : 6.5), 0);
  const legendRows = [];
  if (legendItems.length) {
    let row = [], x = 12;
    legendItems.forEach((it) => {
      const w = textW(it.text) + 30;
      if (x + w > W - 8 && row.length) { legendRows.push(row); row = []; x = 12; }
      row.push({ ...it, x }); x += w;
    });
    legendRows.push(row);
  }
  const LEG = legendRows.length * 18 + (legendRows.length ? 8 : 0);
  const total = TOP + H + LEG + 8;
  if (legendNote) legendRows.push([{ color: null, text: legendNote, x: 12 }]);
  const legend = legendRows.map((row, r) =>
    `<g transform="translate(0,${TOP + H + 6 + r * 18})" font-family="${font}" font-size="11" fill="${muted}">` +
    row.map((it) => (it.color ? `<rect x="${it.x}" y="4" width="12" height="8" rx="2" fill="${it.color}"/><text x="${it.x + 16}" y="12">${esc(it.text)}</text>` : `<text x="${it.x}" y="12">${esc(it.text)}</text>`)).join("") +
    "</g>").join("");
  const header = title ? `<text x="12" y="20" font-family="${font}" font-size="14" font-weight="700" fill="${fg}">${esc(title)}</text>
    <text x="12" y="36" font-family="${font}" font-size="10.5" fill="${muted}">${esc(desc)}</text>` : "";
  const inner = clone.innerHTML;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${total}" viewBox="0 0 ${W} ${total}" font-family="${font}">
<rect width="${W}" height="${total}" fill="${bg}"/>
${header}
<g transform="translate(0,${TOP})">${inner}</g>
${legend}
</svg>`;
}

export function downloadSvg(card, name) {
  const s = cardToSvg(card);
  if (!s) return;
  download(new Blob([s], { type: "image/svg+xml;charset=utf-8" }), safe(name) + ".svg");
}

export function downloadPng(card, name, scale = 2) {
  const s = cardToSvg(card);
  if (!s) return;
  const img = new Image();
  const [, , vw, vh] = (s.match(/viewBox="([^"]+)"/)?.[1] || "0 0 560 260").split(/\s+/).map(Number);
  const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml;charset=utf-8" }));
  img.onerror = () => { URL.revokeObjectURL(url); toast("PNG 변환에 실패했습니다. SVG로 저장해 주세요."); };
  img.onload = () => {
    const c = document.createElement("canvas");
    const w = img.naturalWidth || vw, h = img.naturalHeight || vh;
    c.width = w * scale; c.height = h * scale;
    const ctx = c.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    c.toBlob((b) => download(b, safe(name) + ".png"), "image/png");
  };
  img.src = url;
}

/** 카드 안의 표 → CSV (엑셀 한글 호환 BOM) */
export function downloadCsv(card, name) {
  const table = card.querySelector("table");
  if (!table) return;
  const rows = [...table.querySelectorAll("tr")].map((tr) =>
    [...tr.querySelectorAll("th,td")].map((c) => `"${c.innerText.trim().replace(/\s+/g, " ").replace(/"/g, '""')}"`).join(","));
  download(new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" }), safe(name) + ".csv");
}

/** 순위/막대 목록(HTML) → CSV */
export function downloadListCsv(card, name) {
  const rows = [...card.querySelectorAll(".rrow, .drow")].map((r) =>
    [...r.children].filter((c) => !c.classList.contains("bar-track")).map((c) => `"${c.innerText.trim().replace(/"/g, '""')}"`).join(","));
  if (!rows.length) return;
  download(new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" }), safe(name) + ".csv");
}
