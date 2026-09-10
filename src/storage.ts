/**
 * 本地偏好存储。零收集架构（ADR-0004）下这里只允许存"设备偏好"布尔值，
 * 不存任何游玩记录与儿童信息（进度保存是开发二期 T9 的课题，届时另行设计）。
 */

const KEY_GATE = 'starry-isle.parentGateAccepted';
const KEY_SOUND = 'starry-isle.soundOn';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // 隐私模式等场景下降级为"每次都显示首启页"
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 忽略：不可持久化时功能照常 */
  }
}

export function isParentGateAccepted(): boolean {
  return safeGet(KEY_GATE) === '1';
}

export function setParentGateAccepted(): void {
  safeSet(KEY_GATE, '1');
}

export function loadSoundOn(): boolean {
  return safeGet(KEY_SOUND) === '1';
}

export function saveSoundOn(on: boolean): void {
  safeSet(KEY_SOUND, on ? '1' : '0');
}
