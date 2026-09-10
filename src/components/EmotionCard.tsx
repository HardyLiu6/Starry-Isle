import type { EmotionVariant } from '../game/types';

export type CardState = 'idle' | 'dimmed' | 'correct' | 'pulse';

export function EmotionCard({
  variant,
  state,
  onPick,
  disabled,
}: {
  variant: EmotionVariant;
  state: CardState;
  onPick: () => void;
  disabled?: boolean;
}) {
  const cls =
    'emotion-card' +
    (state === 'dimmed' ? ' dimmed' : '') +
    (state === 'correct' ? ' correct' : '') +
    (state === 'pulse' ? ' pulse' : '');
  return (
    <button className={cls} onClick={onPick} disabled={disabled}>
      {/* alt 是面部线索描述而非情绪名：不泄题，且本身是"看线索"的引导 */}
      <img src={variant.src} alt={`一张脸：${variant.cues}`} draggable={false} />
    </button>
  );
}
