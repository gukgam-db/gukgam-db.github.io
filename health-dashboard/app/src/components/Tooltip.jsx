import { useLayoutEffect, useRef, useState } from "react";

// tip = { x, y, title, rows: [[라벨, 값], ...] } | null
export default function Tooltip({ tip }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const { offsetWidth: w, offsetHeight: h } = ref.current;
    setPos({
      left: Math.min(tip.x + 14, window.innerWidth - w - 8),
      top: Math.max(8, tip.y - h - 12),
    });
  }, [tip]);

  if (!tip) return null;
  return (
    <div className="tooltip" ref={ref} style={pos}>
      <div className="tt-t">{tip.title}</div>
      {tip.rows.map(([label, value]) => (
        <div className="tt-r" key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
