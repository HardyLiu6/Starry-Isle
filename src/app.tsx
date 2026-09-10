import { useState } from 'react';
import { setSound } from './audio';
import { Ending } from './screens/Ending';
import { ParentGate } from './screens/ParentGate';
import { ParentInfo } from './screens/ParentInfo';
import { Play } from './screens/Play';
import { Title } from './screens/Title';
import { isParentGateAccepted, loadSoundOn } from './storage';

type Screen = 'gate' | 'title' | 'parentInfo' | 'play' | 'ending';

export function App() {
  const [screen, setScreen] = useState<Screen>(isParentGateAccepted() ? 'title' : 'gate');
  // 声音偏好仅恢复"开关状态"；实际 AudioContext 仍在第一次用户手势中创建
  const [soundRestored] = useState(() => {
    if (loadSoundOn()) setSound(true);
    return true;
  });
  void soundRestored;

  switch (screen) {
    case 'gate':
      return <ParentGate onDone={() => setScreen('title')} />;
    case 'parentInfo':
      return <ParentInfo onBack={() => setScreen('title')} />;
    case 'play':
      return <Play onFinish={() => setScreen('ending')} onExit={() => setScreen('title')} />;
    case 'ending':
      return <Ending onHome={() => setScreen('title')} />;
    default:
      return <Title onStart={() => setScreen('play')} onParentInfo={() => setScreen('parentInfo')} />;
  }
}
