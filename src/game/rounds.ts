import { ALL_VARIANTS, SCENES, pick } from './emotions';
import type { CoPlayRound, Emotion, EmotionVariant, QuestionRound, Round, SceneRound } from './types';

/**
 * 一局 = 固定 10 个回合（回合上限，设计原则 5"优雅结束"）：
 *
 *   1-3   认表情 · 2 选 1 · 夸张强度 · 单一画风     ← 难度递进第一档（研 03：夸张起步）
 *   4     屏外共玩：家长做表情，孩子来认            ← 泛化机制（ADR-0002）
 *   5-6   认表情 · 3 选 1 · 中强度 · 双画风混出
 *   7-8   认表情 · 4 选 1 · 含低强度 · 双画风混出   ← 完成第 8 回合后触发"结束预告"
 *   9     屏外共玩（第二次）
 *   10    情境题（"卡通→真人→情境"第三档雏形）
 *
 * 情境题是无错题：情绪认知里"情境→感受"没有唯一正确答案（同一情境不同孩子
 * 感受可以不同），任何选择都完成回合，反馈区分"常见感受/不同感受"两种话术，
 * 并引导与家长聊——这是刻意的设计，不是漏判。
 */

/** 完成第几回合后显示结束预告（"还有 N 个就结束"） */
export const ENDING_PREVIEW_AFTER = 8;
export const TOTAL_ROUNDS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

const EMOTIONS: Emotion[] = ['happy', 'sad', 'angry', 'scared'];

/** 共玩回合的选项固定为四情绪的夸张卡通版（孩子从中点出家长演的情绪） */
function coPlayOptions(): EmotionVariant[] {
  return shuffle(EMOTIONS.map((e) => pick(e, 'high', 'openmoji')));
}

function makeQuestion(
  target: Emotion,
  optionCount: number,
  pool: EmotionVariant[],
): QuestionRound {
  const targetVariant = sample(pool.filter((v) => v.emotion === target), 1)[0];
  const distractors: EmotionVariant[] = [];
  // 干扰项彼此不同情绪，避免同屏出现两张同情绪卡
  const others = shuffle(EMOTIONS.filter((e) => e !== target));
  for (const e of others.slice(0, optionCount - 1)) {
    distractors.push(sample(pool.filter((v) => v.emotion === e), 1)[0]);
  }
  return { kind: 'question', target, options: shuffle([targetVariant, ...distractors]) };
}

function makeScene(): SceneRound {
  const s = sample(SCENES, 1)[0];
  return {
    kind: 'scene',
    common: s.common,
    sceneSrc: s.sceneSrc,
    sceneAlt: s.sceneAlt,
    text: s.text,
    options: shuffle(EMOTIONS.map((e) => pick(e, 'high', 'openmoji'))),
  };
}

export function makeSession(): Round[] {
  const highOpenmoji = ALL_VARIANTS.filter(
    (v) => v.intensity === 'high' && v.source === 'openmoji',
  );
  const midAll = ALL_VARIANTS.filter((v) => v.intensity !== 'low');
  const all = ALL_VARIANTS;

  // 前三题目标情绪顺序：从"高兴"开始（识别难度最低，研 03 §4.1），其余打乱
  const firstTargets: Emotion[] = ['happy', ...shuffle(['sad', 'angry', 'scared'] as Emotion[])];

  const coPlayTargets = shuffle(EMOTIONS);
  const coplay1: CoPlayRound = { kind: 'coplay', target: coPlayTargets[0], options: coPlayOptions() };
  const coplay2: CoPlayRound = { kind: 'coplay', target: coPlayTargets[1], options: coPlayOptions() };

  return [
    makeQuestion(firstTargets[0], 2, highOpenmoji),
    makeQuestion(firstTargets[1], 2, highOpenmoji),
    makeQuestion(firstTargets[2], 2, highOpenmoji),
    coplay1,
    makeQuestion(sample(EMOTIONS, 1)[0], 3, midAll),
    makeQuestion(sample(EMOTIONS, 1)[0], 3, midAll),
    makeQuestion(sample(EMOTIONS, 1)[0], 4, all),
    makeQuestion(sample(EMOTIONS, 1)[0], 4, all),
    coplay2,
    makeScene(),
  ];
}
