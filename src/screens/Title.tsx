import { useState } from 'react';
import { IslandScene } from '../components/IslandScene';
import { Mascot } from '../components/Mascot';
import { isSoundOn, setSound } from '../audio';
import { saveSoundOn } from '../storage';

export function Title({
  onStart,
  onParentInfo,
}: {
  onStart: () => void;
  onParentInfo: () => void;
}) {
  const [sound, setSoundState] = useState(isSoundOn());

  function toggleSound() {
    const next = !sound;
    setSound(next); // 在用户手势内调用，顺带解锁 iOS 音频
    saveSoundOn(next);
    setSoundState(next);
  }

  return (
    <div className="screen text-center">
      <div className="topbar">
        <button className="btn btn-secondary" onClick={toggleSound} aria-pressed={sound}>
          {sound ? '🔊 声音 开' : '🔇 声音 关'}
        </button>
        <button className="btn btn-secondary" onClick={onParentInfo}>
          给家长
        </button>
      </div>

      <div className="mt-6 animate-appear">
        <Mascot size={110} />
        <h1 className="text-4xl font-bold tracking-wider my-2">星屿</h1>
        <p className="sub">和家长一起，认一认心情</p>
      </div>

      <div className="my-7">
        <button className="btn btn-big min-w-[70%]" onClick={onStart}>
          开始今天的练习
        </button>
      </div>

      <IslandScene />

      <p className="footer-note">
        公益 · 免费 · 开源 ｜ 完全本地运行，不收集任何数据 ｜ 请家长陪同使用
      </p>
    </div>
  );
}
