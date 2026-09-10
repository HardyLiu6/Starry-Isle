import { useRef, useState } from 'react';
import { Disclaimer } from '../components/Disclaimer';
import { setParentGateAccepted } from '../storage';

/**
 * 首启家长页：免责声明（三处同文之一）+ 共玩约定。
 * "按住 2 秒"是最轻量的成人确认动作——本产品无任何数据收集，
 * 这里只为确保声明真的被家长看到（研 04 §六使用位置清单）。
 */
export function ParentGate({ onDone }: { onDone: () => void }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  function startHold() {
    if (timerRef.current !== null) return;
    setHolding(true);
    const startedAt = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - startedAt) / 2000);
      setProgress(p);
      if (p >= 1) {
        stopHold();
        setParentGateAccepted();
        onDone();
        return;
      }
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
  }

  function stopHold() {
    if (timerRef.current !== null) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
    setProgress(0);
  }

  return (
    <div className="screen doc">
      <h1>请家长先看这一页</h1>
      <p>
        星屿是一款公益、免费、开源的儿童情绪认知练习软件，为孤独症谱系儿童的家庭设计。
        它完全在本设备上运行：<strong>无账号、不联网上报、不收集任何数据</strong>。
      </p>

      <h2>怎么一起玩</h2>
      <ul>
        <li>星屿是<strong>亲子共玩</strong>的练习，请家长全程陪在孩子身边，而不是把设备交给孩子。</li>
        <li>
          带 <span className="parent-read">🗣 家长读</span> 标记的句子，请您读给孩子听。
        </li>
        <li>中途会有"轮到家长"的环节：您用自己的脸做表情，孩子来认——这是把练习带进真实表情的关键一步。</li>
        <li>每次固定 10 个小回合，几分钟就结束，结束时和孩子一起收尾。</li>
      </ul>

      <h2>重要声明</h2>
      <Disclaimer />

      <button
        className="btn btn-big mt-3"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        {holding ? `请按住…… ${Math.ceil((1 - progress) * 2)} 秒` : '我已阅读，按住 2 秒开始'}
      </button>
      <p className="footer-note">此确认只在本设备记录一次，不会上传。</p>
    </div>
  );
}
