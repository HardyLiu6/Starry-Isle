/**
 * 星灵：星屿的几何感引导角色。图形是自制素材 public/assets/original/mascot.svg（CC BY-SA 4.0），
 * 来源与许可登记在溯源清单里（ADR-0007 决定 7）；本文件只是引用它的界面代码，随代码按 MIT。
 * 造型约束（ADR-0003 年龄中性）：圆 + 三角的几何组合，无低幼卡通特征。
 */
export function Mascot({ size = 120 }: { size?: number }) {
  return (
    <img
      src="assets/original/mascot.svg"
      width={size}
      height={size}
      alt="星灵——星屿的小向导"
      draggable={false}
    />
  );
}
