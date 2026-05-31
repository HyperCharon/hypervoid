"use client";

import { useState } from "react";
import { Check, Link2, Send, Share2 } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

type Props = {
  title: string;
  url: string;
};

export function ShareButtons({ title, url }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        /* clipboard blocked */
      });
  }

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const xHref = "https://twitter.com/intent/tweet?text=" + encodedTitle + "&url=" + encodedUrl;
  const weiboHref = "https://service.weibo.com/share/share.php?url=" + encodedUrl + "&title=" + encodedTitle;

  return (
    <div className="inline-flex items-center gap-1">
      <ActionButton onClick={copy} label={copied ? t.common.copied : t.common.copyLink}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </ActionButton>
      <ActionLink href={xHref} label={t.common.shareX}>
        <Share2 className="h-4 w-4" />
      </ActionLink>
      <ActionLink href={weiboHref} label={t.common.shareWeibo}>
        <Send className="h-4 w-4" />
      </ActionLink>
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hv-action h-9 w-9 p-0"
    >
      {children}
    </button>
  );
}

function ActionLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className="hv-action h-9 w-9 p-0"
    >
      {children}
    </a>
  );
}
