// SVG 차트 공용 조각

export function pathOf(arr, x, y) {
  let out = "", pen = false;
  arr.forEach((v, i) => {
    if (v == null) { pen = false; return; }
    out += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1);
    pen = true;
  });
  return out;
}

export function nearestIndex(ev, svgEl, W, L, R, n) {
  const pt = ev.touches ? ev.touches[0] : ev;
  const box = svgEl.getBoundingClientRect();
  const px = ((pt.clientX - box.left) / box.width) * W;
  return Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1))));
}

export function clientXY(ev) {
  const pt = ev.touches ? ev.touches[0] : ev;
  return { x: pt.clientX, y: pt.clientY };
}

export function Gridlines({ lo, hi, y, W, L, R, ticks = 4 }) {
  const out = [];
  for (let k = 0; k <= ticks; k++) {
    const v = lo + ((hi - lo) * k) / ticks, yy = y(v);
    out.push(
      <g key={k}>
        <line x1={L} x2={W - R} y1={yy} y2={yy} style={{ stroke: "var(--grid)" }} />
        <text className="axis" x={L - 6} y={yy + 3.5} textAnchor="end">{v.toFixed(0)}</text>
      </g>
    );
  }
  return out;
}

export function XAxis({ years, x, H }) {
  const step = Math.max(1, Math.ceil(years.length / 6));
  const out = [];
  for (let i = 0; i < years.length; i += step)
    out.push(<text key={years[i]} className="axis" x={x(i)} y={H - 8} textAnchor="middle">{years[i]}</text>);
  return out;
}
