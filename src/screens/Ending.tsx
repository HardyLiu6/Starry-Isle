import { useState } from 'react';
import { celebrate } from '../audio';
import { IslandScene } from '../components/IslandScene';
import { Mascot } from '../components/Mascot';
import { TOTAL_ROUNDS } from '../game/rounds';

/**
 * 收尾仪式（T6）：星星升空 → 星灵道别 → 击掌 →"明天再来"。
 * 刻意不提供"再来一局"入口——回合上限的意义就是好好结束（研 03：
 * "拿走即崩溃"是家长的一票否决项，平滑退出比多玩一局重要）。
 */
export function Ending({ onHome }: { onHome: () => void }) {
  const [highFived, setHighFived] = useState(false);

  return (
    <div className="screen text-center justify-center">
      <div className="animate-rise text-2xl tracking-[.4em]" aria-hidden="true">
        {'⭐'.repeat(Math.min(TOTAL_ROUNDS, 10))}
      </div>

      <div className="animate-appear">
        <Mascot size={130} />
        <div>
          <span className="parent-read">🗣 家长读</span>
        </div>
        <p className="prompt">今天的星星都收好啦。</p>
      </div>

      {!highFived ? (
        <div className="mt-6 animate-appear">
          <button
            className="btn btn-big"
            onClick={() => {
              celebrate();
              setHighFived(true);
            }}
          >
            🖐 和家人击个掌
          </button>
        </div>
      ) : (
        <div className="mt-6 animate-appear">
          <p className="prompt">明天再来玩！</p>
          <button className="btn btn-secondary mt-3" onClick={onHome}>
            回到开始
          </button>
        </div>
      )}

      <IslandScene />
    </div>
  );
}
