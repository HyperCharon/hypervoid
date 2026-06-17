import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const rl = await rateLimit(getIp(request), {
    key: "subscribe",
    limit: 3,
    windowSec: 900,
  });
  if (!rl.ok) {
    return Response.json(
      { error: `请求过于频繁，请 ${rl.resetInSec} 秒后重试` },
      { status: 429 },
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "邮箱格式不对" }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    return Response.json(
      { error: "邮件服务未配置，暂不能订阅。" },
      { status: 503 },
    );
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.email, email))
    .limit(1);

  let row = existing[0];
  if (row?.verified) {
    return Response.json({
      ok: true,
      already: true,
      message: "你已订阅。",
    });
  }

  const verifyToken = randomUUID() + randomUUID();
  const unsubscribeToken = randomUUID() + randomUUID();

  if (!row) {
    try {
      const inserted = await db
        .insert(schema.subscribers)
        .values({ email, verifyToken, unsubscribeToken })
        .returning();
      row = inserted[0];
    } catch {
      // Concurrent request inserted the same email — re-fetch.
      const refetch = await db
        .select()
        .from(schema.subscribers)
        .where(eq(schema.subscribers.email, email))
        .limit(1);
      row = refetch[0];
      if (row?.verified) {
        return Response.json({ ok: true, already: true, message: "你已订阅。" });
      }
      if (row) {
        await db
          .update(schema.subscribers)
          .set({ verifyToken, unsubscribeToken, unsubscribedAt: null })
          .where(eq(schema.subscribers.id, row.id));
      }
    }
  } else {
    await db
      .update(schema.subscribers)
      .set({ verifyToken, unsubscribeToken, unsubscribedAt: null })
      .where(eq(schema.subscribers.id, row.id));
  }

  const verifyUrl = `${siteConfig.url}/api/subscribe/confirm?token=${verifyToken}`;
  const result = await sendEmail({
    to: email,
    subject: `确认订阅 ${siteConfig.name}`,
    text: `感谢订阅 ${siteConfig.name}。

请点击下方链接确认你的邮箱：
${verifyUrl}

如果不是你本人订阅的，请忽略这封邮件。`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;line-height:1.6;color:#18181b">
  <h2 style="margin-top:0">确认订阅 ${siteConfig.name}</h2>
  <p>感谢订阅，请点击下方按钮确认你的邮箱：</p>
  <p style="margin:24px 0">
    <a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">确认订阅</a>
  </p>
  <p style="color:#71717a;font-size:14px">如果按钮无法点击，请复制以下链接到浏览器：<br/><span style="word-break:break-all">${verifyUrl}</span></p>
  <p style="color:#71717a;font-size:14px;margin-top:32px">如果不是你本人订阅的，请忽略这封邮件。</p>
</div>`,
  });

  if ("error" in result) {
    console.error("[subscribe] email send failed:", result.error);
    return Response.json(
      { error: "发送验证邮件失败，请稍后重试" },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
