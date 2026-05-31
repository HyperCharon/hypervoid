"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";

const DISMISS_KEY = "hypervoid:announce:dismissed";

export function AnnouncementBar({
  message,
  linkHref,
  linkText,
  id = "default",
}: {
  message: string;
  linkHref?: string;
  linkText?: string;
  id?: string;
}) {
  const t = useT();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(`${DISMISS_KEY}:${id}`) === "1";
      setHidden(dismissed);
    } catch {
      setHidden(false);
    }
  }, [id]);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(`${DISMISS_KEY}:${id}`, "1");
    } catch {
      // ignore
    }
  };

  return (
    <div className="border-b border-primary/30 bg-primary/5 text-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <p className="flex-1">
          <span className="mr-2">✦</span>
          {message}
          {linkHref ? (
            <>
              {" "}
              <a
                href={linkHref}
                className="ml-2 font-medium text-primary underline-offset-2 hover:underline"
              >
                {linkText ?? t.common.learnMore}
              </a>
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.widget.closeNotice}
          className="shrink-0 rounded p-1 text-muted hover:bg-card hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
