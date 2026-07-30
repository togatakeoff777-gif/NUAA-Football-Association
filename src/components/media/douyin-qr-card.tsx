"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { douyinPlatform } from "@/data/platforms";

export function DouyinQrCard() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <article className="media-douyin-card" id="douyin">
        <button
          aria-label="放大南航足协抖音二维码"
          className="media-douyin-image"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Image
            src={douyinPlatform.qrImage}
            alt={douyinPlatform.qrAlt}
            fill
            sizes="(max-width: 720px) 84vw, 360px"
          />
        </button>
        <div>
          <span>DOUYIN / 官方账号</span>
          <h2>{douyinPlatform.name}</h2>
          <strong>{douyinPlatform.label}</strong>
          <p>{douyinPlatform.description}</p>
          <button onClick={() => setOpen(true)} type="button">放大二维码</button>
        </div>
      </article>
      {open ? (
        <div
          aria-label="南航足协抖音二维码"
          aria-modal="true"
          className="qr-modal"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div onClick={(event) => event.stopPropagation()}>
            <button aria-label="关闭二维码" onClick={() => setOpen(false)} type="button">关闭</button>
            <Image
              src={douyinPlatform.qrImage}
              alt={douyinPlatform.qrAlt}
              height={980}
              priority
              width={720}
            />
            <p>保存图片后，可在抖音中使用“扫一扫”识别；抖音号：nuaafa。</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
