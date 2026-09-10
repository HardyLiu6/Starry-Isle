import type { AssetSource, Emotion, EmotionVariant, Intensity } from './types';

/**
 * 素材语义映射表（T3 管线约定：素材文件保留上游码点原名，语义只在这里）。
 * 同一情绪配多强度、双画风（OpenMoji/Twemoji）——多刺激变异是对抗
 * "把情绪记成一张图"的泛化设计（研 03 §4.3 反卡片化）。
 */
interface Entry {
  emotion: Emotion;
  intensity: Intensity;
  hex: string;
  cues: string;
}

const ENTRIES: Entry[] = [
  { emotion: 'happy', intensity: 'high', hex: '1F604', cues: '眼睛弯弯，嘴巴张大在笑' },
  { emotion: 'happy', intensity: 'mid', hex: '1F60A', cues: '微笑着，脸颊红红的' },
  { emotion: 'happy', intensity: 'low', hex: '1F642', cues: '嘴角轻轻向上' },
  { emotion: 'sad', intensity: 'high', hex: '1F62D', cues: '张着嘴大哭，眼泪很多' },
  { emotion: 'sad', intensity: 'mid', hex: '1F622', cues: '流下了一滴眼泪' },
  { emotion: 'sad', intensity: 'low', hex: '1F641', cues: '嘴角向下，垂着眼' },
  { emotion: 'angry', intensity: 'high', hex: '1F621', cues: '脸涨得通红，眉毛竖起来' },
  { emotion: 'angry', intensity: 'mid', hex: '1F620', cues: '皱着眉头，抿紧嘴巴' },
  { emotion: 'scared', intensity: 'high', hex: '1F631', cues: '睁大眼睛，张大嘴巴喊出声' },
  { emotion: 'scared', intensity: 'mid', hex: '1F628', cues: '睁大眼睛，眉毛拧在一起' },
];

function toVariant(e: Entry, source: AssetSource): EmotionVariant {
  const src =
    source === 'openmoji'
      ? `assets/emotions/openmoji/${e.hex}.svg`
      : `assets/emotions/twemoji/${e.hex.toLowerCase()}.svg`;
  return { emotion: e.emotion, intensity: e.intensity, source, src, cues: e.cues };
}

/** 全部可用表情卡（10 变体 × 2 画风） */
export const ALL_VARIANTS: EmotionVariant[] = ENTRIES.flatMap((e) => [
  toVariant(e, 'openmoji'),
  toVariant(e, 'twemoji'),
]);

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

/** 情境素材（OpenMoji，见 CREDITS.md） */
export const SCENES = [
  {
    common: 'happy' as Emotion,
    sceneSrc: 'assets/scenes/openmoji/1F381.svg',
    sceneAlt: '一份包着丝带的礼物',
    text: '过生日，收到了最想要的礼物。会是什么心情？',
  },
  {
    common: 'sad' as Emotion,
    sceneSrc: 'assets/scenes/openmoji/1F366.svg',
    sceneAlt: '一支甜筒冰淇淋',
    text: '最喜欢的冰淇淋，掉在了地上。会是什么心情？',
  },
  {
    common: 'scared' as Emotion,
    sceneSrc: 'assets/scenes/openmoji/26C8.svg',
    sceneAlt: '打着闪电的乌云',
    text: '打雷了，轰隆隆，声音好大。会是什么心情？',
  },
  {
    common: 'angry' as Emotion,
    sceneSrc: 'assets/scenes/openmoji/1F9F1.svg',
    sceneAlt: '搭起来的积木',
    text: '认真搭好的积木，被撞倒了。会是什么心情？',
  },
];
