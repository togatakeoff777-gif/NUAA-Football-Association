"use client";

import { useState } from "react";

export function ShareActions({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  const [message, setMessage] = useState("");

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setMessage("已打开系统分享。");
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("链接已复制。");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("无法自动复制，请从浏览器地址栏复制链接。");
    }
  }

  return (
    <div className="share-actions">
      <button onClick={share} type="button">分享 / 复制链接</button>
      <span aria-live="polite">{message}</span>
    </div>
  );
}
