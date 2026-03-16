/** 브라우저별 전체화면 API 호환성 (iOS Safari, Chrome, MS 등) */

const doc = typeof document !== "undefined" ? document : null;

function getFullscreenEl(): Element | null {
  if (!doc) return null;
  return (
    doc.fullscreenElement ??
    (doc as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ??
    (doc as Document & { msFullscreenElement?: Element }).msFullscreenElement ??
    null
  );
}

function getRequestMethod(el: Element): () => Promise<void> {
  const e = el as Element & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    webkitEnterFullscreen?: () => void;
    msRequestFullscreen?: () => Promise<void>;
  };
  return (
    e.requestFullscreen?.bind(e) ??
    e.webkitRequestFullscreen?.bind(e) ??
    e.webkitEnterFullscreen?.bind(e) ??
    e.msRequestFullscreen?.bind(e) ??
    (() => Promise.resolve())
  );
}

function getExitMethod(): () => Promise<void> {
  if (!doc) return () => Promise.resolve();
  const d = doc as Document & {
    exitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  };
  return (
    d.exitFullscreen?.bind(d) ??
    d.webkitExitFullscreen?.bind(d) ??
    d.msExitFullscreen?.bind(d) ??
    (() => Promise.resolve())
  );
}

/** 전체화면 활성화 여부 */
export function isFullscreen(): boolean {
  return !!getFullscreenEl();
}

/** 전체화면 진입 요청 */
export async function requestFullscreen(el: Element = document.documentElement): Promise<void> {
  try {
    const fn = getRequestMethod(el);
    if (typeof fn === "function") {
      const p = fn();
      if (p && typeof p.then === "function") await p;
      else await Promise.resolve();
    }
  } catch {
    // 일부 브라우저(특히 iOS)는 사용자 제스처 내에서만 허용
  }
}

/** 전체화면 해제 */
export async function exitFullscreen(): Promise<void> {
  try {
    if (getFullscreenEl()) {
      await getExitMethod()();
    }
  } catch {
    // ignore
  }
}

/** 전체화면 토글 */
export async function toggleFullscreen(): Promise<void> {
  if (getFullscreenEl()) {
    await exitFullscreen();
  } else {
    await requestFullscreen(doc?.documentElement);
  }
}
