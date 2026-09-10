/**
 * 星灵：星屿的几何感引导角色（自制素材，CC BY-SA 4.0，见 CREDITS.md）。
 * 造型约束（ADR-0003 年龄中性）：圆 + 三角的几何组合，无低幼卡通特征。
 */
export function Mascot({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="星灵——星屿的小向导"
    >
      <defs>
        <linearGradient id="mascot-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fb7e8" />
          <stop offset="100%" stopColor="#5577b8" />
        </linearGradient>
      </defs>
      {/* 三角耳 */}
      <polygon points="34,42 44,18 56,40" fill="#5577b8" />
      <polygon points="86,42 76,18 64,40" fill="#5577b8" />
      {/* 圆身 */}
      <circle cx="60" cy="70" r="36" fill="url(#mascot-body)" />
      {/* 眼 */}
      <circle cx="47" cy="64" r="7" fill="#f7f4ec" />
      <circle cx="73" cy="64" r="7" fill="#f7f4ec" />
      <circle cx="48.5" cy="65.5" r="3.4" fill="#22314f" />
      <circle cx="74.5" cy="65.5" r="3.4" fill="#22314f" />
      {/* 微笑 */}
      <path
        d="M50 82 Q60 90 70 82"
        stroke="#22314f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* 头顶小星 */}
      <path
        d="M60 2 l2.6 5.6 6 .7 -4.4 4.2 1.2 6 -5.4 -3 -5.4 3 1.2 -6 -4.4 -4.2 6 -.7 z"
        fill="#ffd966"
      />
    </svg>
  );
}
