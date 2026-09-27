import { describe, expect, it } from 'vitest';
import manifest from '../asset-manifest.json';
import { ALL_VARIANTS, SCENES, pick } from './emotions';
import { ENDING_PREVIEW_AFTER, TOTAL_ROUNDS, balancedPool, makeSession } from './rounds';
import type { CoPlayRound, Emotion, EmotionVariant } from './types';

/**
 * 这些不变量坏了是"静默教错"（选项里出现两张同情绪卡、目标不在场……），
 * 人工点几局未必撞见——所以交给机器锁死（ADR-0005 Q4）。
 * 回合生成含随机性，全部性质断言跑 200 局。
 */

const RUNS = 200;
const EMOTIONS: Emotion[] = ['happy', 'sad', 'angry', 'scared'];

describe('makeSession 结构不变量', () => {
  it(`每局恒为 ${TOTAL_ROUNDS} 回合，结束预告点在界内`, () => {
    for (let r = 0; r < RUNS; r++) {
      expect(makeSession()).toHaveLength(TOTAL_ROUNDS);
    }
    expect(ENDING_PREVIEW_AFTER).toBeGreaterThan(0);
    expect(ENDING_PREVIEW_AFTER).toBeLessThan(TOTAL_ROUNDS);
  });

  it('回合类型序列恒定：3 认知题 → 共玩 → 4 认知题 → 共玩 → 情境题', () => {
    for (let r = 0; r < RUNS; r++) {
      const kinds = makeSession().map((x) => x.kind);
      expect(kinds).toEqual([
        'question',
        'question',
        'question',
        'coplay',
        'question',
        'question',
        'question',
        'question',
        'coplay',
        'scene',
      ]);
    }
  });

  it('每局含 ≥1 次屏外共玩回合（一期验收项 / ADR-0002）', () => {
    for (let r = 0; r < RUNS; r++) {
      const coplays = makeSession().filter((x) => x.kind === 'coplay');
      expect(coplays.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('选项不变量', () => {
  it('任何回合的选项互不同情绪，且认知/共玩回合的目标恰在场一次', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const round of makeSession()) {
        const emotions = round.options.map((o) => o.emotion);
        expect(new Set(emotions).size).toBe(emotions.length);
        if (round.kind !== 'scene') {
          expect(emotions.filter((e) => e === round.target)).toHaveLength(1);
        }
      }
    }
  });

  it('难度递进：前 3 题为 2 选 1 且全部夸张强度，第 5-6 题 3 选 1，第 7-8 题 4 选 1', () => {
    for (let r = 0; r < RUNS; r++) {
      const s = makeSession();
      for (const i of [0, 1, 2]) {
        expect(s[i].options).toHaveLength(2);
        expect(s[i].options.every((o) => o.intensity === 'high')).toBe(true);
      }
      expect(s[4].options).toHaveLength(3);
      expect(s[5].options).toHaveLength(3);
      expect(s[6].options).toHaveLength(4);
      expect(s[7].options).toHaveLength(4);
    }
  });

  it('第一题目标从「高兴」开始（识别难度最低，研 03 §4.1）', () => {
    for (let r = 0; r < RUNS; r++) {
      const first = makeSession()[0];
      expect(first.kind).toBe('question');
      if (first.kind === 'question') expect(first.target).toBe('happy');
    }
  });

  it('两次共玩回合目标情绪不同，选项覆盖全部四情绪', () => {
    for (let r = 0; r < RUNS; r++) {
      const coplays = makeSession().filter((x): x is CoPlayRound => x.kind === 'coplay');
      expect(coplays).toHaveLength(2);
      expect(coplays[0].target).not.toBe(coplays[1].target);
      for (const c of coplays) {
        expect(new Set(c.options.map((o) => o.emotion))).toEqual(new Set(EMOTIONS));
      }
    }
  });

  it('情境题选项覆盖四情绪，常见感受在其中', () => {
    for (let r = 0; r < RUNS; r++) {
      const scene = makeSession()[9];
      expect(scene.kind).toBe('scene');
      if (scene.kind === 'scene') {
        expect(new Set(scene.options.map((o) => o.emotion))).toEqual(new Set(EMOTIONS));
        expect(EMOTIONS).toContain(scene.common);
        expect(scene.text.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('素材映射表', () => {
  const registered = new Set(manifest.assets.map((a) => a.path));

  it('20 张表情卡与 4 张情境图都登记在溯源清单里，画风目录与来源一致（ADR-0007）', () => {
    expect(ALL_VARIANTS).toHaveLength(20);
    for (const v of ALL_VARIANTS) {
      expect(registered.has(`public/${v.src}`)).toBe(true);
      expect(v.src.startsWith(`assets/emotions/${v.source}/`)).toBe(true);
      expect(v.cues.length).toBeGreaterThan(0);
    }
    expect(SCENES).toHaveLength(4);
    for (const s of SCENES) {
      expect(registered.has(`public/${s.sceneSrc}`)).toBe(true);
    }
  });

  it('四情绪均有夸张强度的 openmoji 卡（前 3 题与共玩回合的素材前提）', () => {
    for (const e of EMOTIONS) {
      expect(() => pick(e, 'high', 'openmoji')).not.toThrow();
    }
  });
});

describe('强度与画风不泄题（ADR-0008 决定 6）', () => {
  it('认表情题的每张选项卡，其画风×强度组合四种情绪都有卡', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const round of makeSession()) {
        if (round.kind !== 'question') continue;
        for (const o of round.options) {
          for (const e of EMOTIONS) {
            const has = ALL_VARIANTS.some(
              (v) => v.emotion === e && v.source === o.source && v.intensity === o.intensity,
            );
            expect(has, `${o.source}/${o.intensity} 缺「${e}」却进了题库`).toBe(true);
          }
        }
      }
    }
  });

  it('balancedPool 整组剔除缺情绪的组合：低强度只有高兴、难过时，低强度一张不留', () => {
    const card = (emotion: Emotion, intensity: EmotionVariant['intensity']): EmotionVariant => ({
      emotion,
      intensity,
      source: 'openmoji',
      src: `assets/emotions/openmoji/${emotion}-${intensity}.svg`,
      cues: '测试',
      validation: 'pending',
    });
    const pool = [
      ...EMOTIONS.map((e) => card(e, 'high')),
      card('happy', 'low'),
      card('sad', 'low'),
    ];
    const kept = balancedPool(pool);
    expect(kept).toHaveLength(4);
    expect(kept.every((v) => v.intensity === 'high')).toBe(true);
  });
});
