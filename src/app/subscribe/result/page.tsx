import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Info, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "订阅结果",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, { title: string; body: string; tone: "ok" | "error" | "info" }> = {
  ok: {
    title: "订阅确认成功",
    body: "你已确认订阅。新文章发布时会发邮件通知你。",
    tone: "ok",
  },
  already: {
    title: "邮箱已订阅",
    body: "这个邮箱之前已经确认过了，无需重复确认。",
    tone: "info",
  },
  invalid: {
    title: "链接无效",
    body: "这个确认链接已过期或不正确，请重新订阅。",
    tone: "error",
  },
  missing: {
    title: "缺少 token",
    body: "请使用邮件里完整的链接打开。",
    tone: "error",
  },
  unsubscribed: {
    title: "已退订",
    body: "你已成功退订，以后不会再收到 Hypervoid 的邮件。随时可以再次订阅。",
    tone: "info",
  },
  "rate-limited": {
    title: "请求过于频繁",
    body: "请稍后再试。",
    tone: "error",
  },
};

function ToneIcon({ tone }: { tone: "ok" | "error" | "info" }) {
  if (tone === "ok") return <CheckCircle2 className="h-9 w-9 text-emerald-300" aria-hidden />;
  if (tone === "error") return <TriangleAlert className="h-9 w-9 text-red-300" aria-hidden />;
  return <Info className="h-9 w-9 text-muted" aria-hidden />;
}

export default async function SubscribeResult(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await props.searchParams;
  const m = MESSAGES[status] ?? MESSAGES.missing;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <div className="hv-panel w-full p-8">
        <ToneIcon tone={m.tone} />
        <h1 className="hv-title mt-4 text-2xl font-bold tracking-tight">{m.title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{m.body}</p>
      </div>
      <Link href="/" className="hv-action px-4 py-2 text-sm">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        返回首页
      </Link>
    </div>
  );
}
