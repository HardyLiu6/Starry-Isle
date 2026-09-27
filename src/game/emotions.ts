import catalog from './catalog.json';
import type { AssetSource, Emotion, EmotionVariant, Intensity, ValidationStatus } from './types';

/**
 * 素材语义映射：读取语义表 catalog.json（ADR-0007 决定 5）。
 * 素材文件保留上游码点原名，语义只在语义表里；来源、许可、哈希在 src/asset-manifest.json，两表按路径对接。
 *
 * 同一情绪配多个强度，是朝"低强度的日常表情"拉开的变异设计。两套 emoji 画风只是符号层内部的
 * 画风变化，不计为泛化设计：emoji 不区分人，缺了身份这一维；泛化由共玩回合承担（ADR-0008 决定 3、4）。
 */

const EMOTIONS: readonly Emotion[] = ['happy', 'sad', 'angry', 'scared'];
const INTENSITIES: readonly Intensity[] = ['high', 'mid', 'low'];
const SOURCES: readonly AssetSource[] = ['openmoji', 'twemoji'];
const STATUSES: readonly ValidationStatus[] = ['validated', 'pending', 'failed'];

function oneOf<T extends string>(allowed: readonly T[], value: string, what: string): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`语义表里的${what}不合法：${value}`);
  }
  return value as T;
}

/** 路径形如 assets/emotions/<画风>/<文件>：画风目录即来源（check:assets 保证它与溯源清单一致） */
function sourceOf(path: string): AssetSource {
  return oneOf(SOURCES, path.split('/')[2] ?? '', '画风目录');
}

/** 全部可用表情卡：含"待验证"，验证不达标的已移出（ADR-0008 决定 8） */
export const ALL_VARIANTS: EmotionVariant[] = catalog.cards
  .map((c) => ({
    emotion: oneOf(EMOTIONS, c.emotion, '情绪'),
    intensity: oneOf(INTENSITIES, c.intensity, '强度'),
    source: sourceOf(c.path),
    src: c.path,
    cues: c.cues,
    validation: oneOf(STATUSES, c.validation.status, '验证状态'),
  }))
  .filter((v) => v.validation !== 'failed');

export function pick(
  emotion: Emotion,
  intensity: Intensity,
  source: AssetSource = 'openmoji',
): EmotionVariant {
  const found = ALL_VARIANTS.find(
    (v) => v.emotion === emotion && v.intensity === intensity && v.source === source,
  );
  if (!found) throw new Error(`missing variant ${emotion}/${intensity}/${source}`);
  return found;
}

/** 情境素材（语义表 scenes 节；来源与许可见溯源清单） */
export const SCENES = catalog.scenes.map((s) => ({
  common: oneOf(EMOTIONS, s.common, '常见感受'),
  sceneSrc: s.path,
  sceneAlt: s.alt,
  text: s.text,
}));
