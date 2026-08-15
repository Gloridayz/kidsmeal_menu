"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 서비스 워커 등록 실패는 앱 사용에 치명적이지 않으므로 무시합니다.
      });
    }
  }, []);
  return null;
}
