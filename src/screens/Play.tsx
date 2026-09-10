import { useMemo, useState } from 'react';
import { chime } from '../audio';
import { EmotionCard, type CardState } from '../components/EmotionCard';
import { StarBar } from '../components/StarBar';
import { ENDING_PREVIEW_AFTER, TOTAL_ROUNDS, makeSession } from '../game/rounds';
import {
  EMOTION_LABEL,
  type CoPlayRound,
  type QuestionRound,
  type Round,
  type SceneRound,
} from '../game/types';

type Feedback =
  | { tone: 'good'; lines: string[] }
  | { tone: 'hint'; lines: string[] }
  | { tone: 'reveal'; lines: string[] }
  | { tone: 'scene'; lines: string[] };

interface RoundState {
  phase: 'answer' | 'done' | 'preview';
  wrongOnce: boolean;
  dimmed: number[];
  correctIdx: number | null;
  feedback: Feedback | null;
  coplayStep: 'parent' | 'child';
  peeked: boolean;
}

const FRESH: RoundState = {
  phase: 'answer',
  wrongOnce: false,
  dimmed: [],
  correctIdx: null,
  feedback: null,
  coplayStep: 'parent',
  peeked: false,
};

export function Play({ onFinish, onExit }: { onFinish: () => void; onExit: () => void }) {
  const rounds = useMemo<Round[]>(() => makeSession(), []);
  const [index, setIndex] = useState(0);
  const [rs, setRs] = useState<RoundState>(FRESH);

  const round = rounds[index];
  // 星星"完成即点亮"：只表进度，不与对错挂钩（无惩罚，设计原则 5）
  const starsLit = index + (rs.phase !== 'answer' && rs.phase !== 'preview' ? 1 : 0);

  function targetOf(r: QuestionRound | CoPlayRound): number {
    return r.options.findIndex((o) => o.emotion === r.target);
  }

  function pickOption(i: number) {
    if (rs.phase !== 'answer') return;

    if (round.kind === 'scene') {
      const chosen = round.options[i].emotion;
      const commonLabel = EMOTION_LABEL[round.common];
      const lines =
        chosen === round.common
          ? [`嗯，很多小朋友会觉得「${commonLabel}」。你也是吗？和家长说一说。`]
          : [
              `也可以哦——每个人的感受可能不一样。`,
              `很多小朋友会觉得「${commonLabel}」。和家长聊聊你的感受吧。`,
            ];
      chime();
      setRs({ ...rs, phase: 'done', correctIdx: i, feedback: { tone: 'scene', lines } });
      return;
    }

    const r = round as QuestionRound | CoPlayRound;
    const label = EMOTION_LABEL[r.target];
    const correct = targetOf(r);

    if (i === correct) {
      chime();
      setRs({
        ...rs,
        phase: 'done',
        correctIdx: correct,
        feedback: {
          tone: 'good',
          lines: [
            round.kind === 'coplay'
              ? `猜对啦！刚才家长做的就是「${label}」的表情。`
              : `对啦！这是「${label}」的表情。`,
          ],
        },
      });
      return;
    }

    if (!rs.wrongOnce) {
      // 第一次不对：不判负，暗掉所点的卡，给"看线索"提示，正确卡轻微脉动（提示渐退）
      setRs({
        ...rs,
        wrongOnce: true,
        dimmed: [...rs.dimmed, i],
        feedback: {
          tone: 'hint',
          lines: [
            round.kind === 'coplay'
              ? '再看看家长的脸——看看眼睛和嘴巴。'
              : '再看看——注意眼睛和嘴巴。',
          ],
        },
      });
      return;
    }

    // 第二次不对：直接展示答案并继续，不卡关、不惩罚
    setRs({
      ...rs,
      phase: 'done',
      correctIdx: correct,
      feedback: {
        tone: 'reveal',
        lines: [
          round.kind === 'coplay'
            ? `刚才是「${label}」的表情。我们继续。`
            : `这一张才是「${label}」的表情。我们看下一个。`,
        ],
      },
    });
  }

  function next() {
    const doneCount = index + 1;
    if (doneCount === TOTAL_ROUNDS) {
      onFinish();
      return;
    }
    if (doneCount === ENDING_PREVIEW_AFTER && rs.phase !== 'preview') {
      // 结束预告：完成第 8 个回合后明确告知"还有 2 个"（优雅结束，研 03 §二）
      setRs({ ...FRESH, phase: 'preview' });
      return;
    }
    setIndex(index + 1);
    setRs(FRESH);
  }

  function cardState(i: number): CardState {
    if (rs.correctIdx === i && rs.phase === 'done') return 'correct';
    if (rs.dimmed.includes(i)) return 'dimmed';
    if (
      rs.wrongOnce &&
      rs.phase === 'answer' &&
      round.kind !== 'scene' &&
      i === targetOf(round as QuestionRound | CoPlayRound)
    )
      return 'pulse';
    return 'idle';
  }

  /* ---------- 渲染 ---------- */

  if (rs.phase === 'preview') {
    return (
      <div className="screen justify-center text-center">
        <StarBar total={TOTAL_ROUNDS} lit={ENDING_PREVIEW_AFTER} />
        <span className="parent-read self-center">🗣 家长读</span>
        <p className="prompt animate-appear">还有 2 个，就到今天的收尾啦。</p>
        <div className="mt-5">
          <button
            className="btn btn-big"
            onClick={() => {
              setIndex(index + 1);
              setRs(FRESH);
            }}
          >
            好，继续
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="topbar">
        <StarBar total={TOTAL_ROUNDS} lit={starsLit} />
        <button className="btn btn-secondary" onClick={onExit} aria-label="结束练习，回到开始">
          ✕
        </button>
      </div>

      {round.kind === 'coplay' ? (
        <CoPlayView
          round={round}
          rs={rs}
          onPeek={() => setRs({ ...rs, peeked: true })}
          onReady={() => setRs({ ...rs, coplayStep: 'child' })}
          onPick={pickOption}
          cardState={cardState}
        />
      ) : (
        <QuestionView round={round} rs={rs} onPick={pickOption} cardState={cardState} />
      )}

      {rs.feedback && (
        <div
          className={'feedback' + (rs.feedback.tone === 'good' ? ' good' : '')}
          aria-live="polite"
        >
          <span className="parent-read">🗣 家长读</span>
          {rs.feedback.lines.map((l) => (
            <div className="line" key={l}>
              {l}
            </div>
          ))}
        </div>
      )}

      {rs.phase === 'done' && (
        <div className="mt-4 text-center">
          <button className="btn btn-big min-w-[60%]" onClick={next}>
            {index + 1 === TOTAL_ROUNDS ? '去收尾' : '下一个'}
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionView({
  round,
  rs,
  onPick,
  cardState,
}: {
  round: QuestionRound | SceneRound;
  rs: RoundState;
  onPick: (i: number) => void;
  cardState: (i: number) => CardState;
}) {
  const isScene = round.kind === 'scene';
  return (
    <div>
      <span className="parent-read">🗣 家长读</span>
      {isScene ? (
        <div>
          <p className="prompt">{(round as SceneRound).text}</p>
          <div className="text-center my-2">
            <img
              src={(round as SceneRound).sceneSrc}
              alt={(round as SceneRound).sceneAlt}
              className="inline-block w-[110px] h-[110px]"
              draggable={false}
            />
          </div>
        </div>
      ) : (
        <p className="prompt">
          哪一个是
          <span className="target-word">「{EMOTION_LABEL[(round as QuestionRound).target]}」</span>
          的表情？
        </p>
      )}
      <div
        className={
          'grid gap-4 my-5 ' +
          (round.options.length === 3 ? 'grid-cols-3 max-[480px]:grid-cols-2' : 'grid-cols-2')
        }
      >
        {round.options.map((v, i) => (
          <EmotionCard
            key={v.src}
            variant={v}
            state={cardState(i)}
            onPick={() => onPick(i)}
            disabled={rs.phase !== 'answer'}
          />
        ))}
      </div>
    </div>
  );
}

function CoPlayView({
  round,
  rs,
  onPeek,
  onReady,
  onPick,
  cardState,
}: {
  round: CoPlayRound;
  rs: RoundState;
  onPeek: () => void;
  onReady: () => void;
  onPick: (i: number) => void;
  cardState: (i: number) => CardState;
}) {
  const label = EMOTION_LABEL[round.target];
  const refImg = round.options.find((o) => o.emotion === round.target)!;

  if (rs.coplayStep === 'parent') {
    return (
      <div>
        <span className="parent-read">🗣 家长读</span>
        <p className="prompt">轮到家长啦！</p>
        <p className="sub">
          （给家长的话）请翻开下面的卡片——别让孩子看到，然后用您自己的脸做出这个表情，让孩子猜一猜。夸张一点更好。
        </p>
        <div className="peek-card my-4">
          {rs.peeked ? (
            <div>
              <div className="word">{label}</div>
              <img src={refImg.src} alt={`参考：${refImg.cues}`} draggable={false} />
              <p className="sub">照着这个感觉做表情，做好了就点下面的按钮。</p>
            </div>
          ) : (
            <button className="btn btn-secondary min-h-24 w-full" onClick={onPeek}>
              🂠 家长点这里翻开（别让孩子看）
            </button>
          )}
        </div>
        {rs.peeked && (
          <div className="text-center">
            <button className="btn btn-big" onClick={onReady}>
              我做好表情了，让孩子猜
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <span className="parent-read">🗣 家长读</span>
      <p className="prompt">看看家长的脸——这是什么心情？</p>
      <div className="grid grid-cols-2 gap-4 my-5">
        {round.options.map((v, i) => (
          <EmotionCard
            key={v.src}
            variant={v}
            state={cardState(i)}
            onPick={() => onPick(i)}
            disabled={rs.phase !== 'answer'}
          />
        ))}
      </div>
      <p className="sub">孩子直接说出答案也可以——由家长替孩子点对应的卡片。</p>
    </div>
  );
}
