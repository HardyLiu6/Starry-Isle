/**
 * 海岛夜景（自制素材，CC BY-SA 4.0）：标题屏与收尾屏的场景画面，
 * 也是开发一期的"美术样张"——星空 + 海岛剪影 + 几何形态，年龄中性。
 */
export function IslandScene() {
  return (
    <svg
      className="island-scene"
      viewBox="0 0 720 300"
      role="img"
      aria-label="夜空下的小岛，海面映着星光"
    >
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123252" />
          <stop offset="100%" stopColor="#0b1e3d" />
        </linearGradient>
      </defs>
      {/* 星点（静态，不闪烁——感官友好） */}
      <g fill="#e8ecf5" opacity="0.75">
        <circle cx="60" cy="40" r="2" />
        <circle cx="150" cy="90" r="1.5" />
        <circle cx="240" cy="30" r="2" />
        <circle cx="330" cy="70" r="1.4" />
        <circle cx="430" cy="36" r="2" />
        <circle cx="520" cy="86" r="1.5" />
        <circle cx="610" cy="46" r="2" />
        <circle cx="680" cy="100" r="1.4" />
        <circle cx="100" cy="130" r="1.2" />
        <circle cx="580" cy="140" r="1.2" />
      </g>
      {/* 一颗大星 */}
      <path
        d="M360 26 l5 11 12 1.5 -9 8.4 2.4 12 -10.4 -6 -10.4 6 2.4 -12 -9 -8.4 12 -1.5 z"
        fill="#ffd966"
      />
      {/* 海面 */}
      <rect x="0" y="190" width="720" height="110" fill="url(#sea)" />
      {/* 岛：几何形态的丘与峰 */}
      <ellipse cx="360" cy="205" rx="190" ry="34" fill="#1d4a5e" />
      <polygon points="290,196 340,120 386,196" fill="#26607a" />
      <polygon points="368,198 410,146 448,198" fill="#1d4a5e" />
      <circle cx="300" cy="184" r="22" fill="#26607a" />
      {/* 海面星光倒影 */}
      <g fill="#ffd966" opacity="0.35">
        <rect x="352" y="246" width="16" height="3" rx="1.5" />
        <rect x="342" y="258" width="36" height="3" rx="1.5" />
        <rect x="356" y="270" width="10" height="3" rx="1.5" />
      </g>
    </svg>
  );
}
