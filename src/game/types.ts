/** 四基础情绪（开发一期范围，规划 T4） */
export type Emotion = 'happy' | 'sad' | 'angry' | 'scared';

/** 表情强度：教学从夸张（high）起步，逐步降到低强度（研 03 §4.1） */
export type Intensity = 'high' | 'mid' | 'low';

export type AssetSource = 'openmoji' | 'twemoji';

/** 一张具体的表情卡素材 */
export interface EmotionVariant {
  emotion: Emotion;
  intensity: Intensity;
  source: AssetSource;
  /** 相对 base 的素材路径 */
  src: string;
  /**
   * 面部线索描述（用作 img alt）——描述眉眼嘴的线索而非直接报情绪名，
   * 既不给读屏用户泄题，又本身就是"看线索"的教学引导。
   */
  cues: string;
}

/** 认表情题：从若干表情卡中点出目标情绪 */
export interface QuestionRound {
  kind: 'question';
  target: Emotion;
  options: EmotionVariant[];
}

/** 情境题（难度递进第三档雏形）：听情境，选感受。无错题——见 rounds.ts 注释 */
export interface SceneRound {
  kind: 'scene';
  /** 该情境下的常见感受（不是唯一正确答案） */
  common: Emotion;
  sceneSrc: string;
  sceneAlt: string;
  text: string;
  options: EmotionVariant[];
}

/** 屏外共玩回合（泛化机制，ADR-0002）：家长真人做表情，孩子来认 */
export interface CoPlayRound {
  kind: 'coplay';
  target: Emotion;
  options: EmotionVariant[];
}

export type Round = QuestionRound | SceneRound | CoPlayRound;

export const EMOTION_LABEL: Record<Emotion, string> = {
  happy: '高兴',
  sad: '难过',
  angry: '生气',
  scared: '害怕',
};
