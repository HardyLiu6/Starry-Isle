function Star({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="#ffd966" className={lit ? 'lit' : ''} aria-hidden="true">
      <path d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 16.9 6.1 20.2l1.3-6.6L2.5 9l6.6-.8z" />
    </svg>
  );
}

/** 星星进度：完成一个回合亮一颗——只表"今天玩到哪了"，不是分数（设计原则 5） */
export function StarBar({ total, lit }: { total: number; lit: number }) {
  return (
    <div
      className="star-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={lit}
      aria-label={`今天的进度：${lit} / ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <Star key={i} lit={i < lit} />
      ))}
    </div>
  );
}
