"use client";

import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

// Hosts configured in next.config.ts `images.remotePatterns`. next/image throws
// on any other host, so article images from arbitrary external hosts (shields,
// random image CDNs, etc.) must keep using a plain <img>. Only our own uploads
// (Vercel Blob) and the few known hosts get the optimizer + AVIF/WebP + srcset.
const OPTIMIZABLE_HOST = /(\.public\.blob\.vercel-storage\.com|^avatars\.githubusercontent\.com$|^lain\.bgm\.tv$|^cdn\.cloudflare\.steamstatic\.com)$/;

function canOptimize(src: string): boolean {
  try {
    return OPTIMIZABLE_HOST.test(new URL(src).hostname);
  } catch {
    return false; // relative/invalid → not a known remote host
  }
}

export function ZoomableImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const src = typeof props.src === "string" ? props.src : "";
  const alt = props.alt ?? "";

  if (src && canOptimize(src)) {
    // width/height are placeholder intrinsics for the optimizer; `height:auto`
    // makes the browser honour the real aspect ratio once loaded. `sizes` drives
    // a responsive srcset capped at the article column width.
    return (
      <Zoom>
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={675}
          sizes="(max-width: 768px) 100vw, 768px"
          style={{ width: "100%", height: "auto" }}
          className={props.className}
        />
      </Zoom>
    );
  }

  return (
    <Zoom>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async" {...props} alt={alt} />
    </Zoom>
  );
}
