/**
 * 海岛夜景：标题屏与收尾屏的场景画面，也是开发一期的"美术样张"——星空 + 海岛剪影 + 几何形态，年龄中性。
 * 图形是自制素材 public/assets/original/island-scene.svg（CC BY-SA 4.0），来源与许可登记在溯源清单里
 * （ADR-0007 决定 7）；本文件只是引用它的界面代码，随代码按 MIT。星点静态不闪烁——感官友好。
 */
export function IslandScene() {
  return (
    <img
      className="island-scene"
      src="assets/original/island-scene.svg"
      alt="夜空下的小岛，海面映着星光"
      draggable={false}
    />
  );
}
