"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut, ADMIN_LOGIN, requireAdmin } from "@/auth";
import {
  deleteMessage,
  hideMessage,
  postMessage,
} from "@/db/guestbook";
import { notifyAdmin } from "@/lib/email";
import { parseMentions } from "@/lib/mentions";
import { rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/lib/site-config";

export async function postGuestbookAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("请先用 GitHub 登录");
  const login = (session.user as { login?: string }).login;
  if (!login) throw new Error("Missing GitHub login on session");

  // 6 messages per 10 minutes per GitHub account — admin is unmetered.
  if (login !== ADMIN_LOGIN) {
    const rl = await rateLimit(login, {
      key: "guestbook:post",
      limit: 6,
      windowSec: 10 * 60,
    });
    if (!rl.ok) {
      throw new Error(
        `留言太快了,${rl.resetInSec} 秒后再试。`,
      );
    }
  }

  const raw = String(formData.get("message") ?? "").trim();
  if (!raw) throw new Error("内容不能为空");
  if (raw.length > 1000) throw new Error("最多 1000 字");

  await postMessage({
    githubLogin: login,
    githubName: session.user.name ?? null,
    avatarUrl: session.user.image ?? null,
    message: raw,
  });
  revalidatePath("/guestbook");

  // Fire-and-forget admin notification with @mention summary.
  const mentions = parseMentions(raw);
  const mentionsLine =
    mentions.length > 0
      ? `\n@提及：${mentions.map((m) => `@${m}`).join(" ")}`
      : "";
  void notifyAdmin({
    subject: `[Hypervoid] 留言板有新留言来自 @${login}`,
    bodyText: `${session.user.name ?? login} (@${login}) 在留言板留言：\n\n${raw}${mentionsLine}\n\n${siteConfig.url}/guestbook`,
  });
}

export async function hideGuestbookAction(id: string) {
  await requireAdmin();
  await hideMessage(id);
  revalidatePath("/guestbook");
}

export async function deleteGuestbookAction(id: string) {
  await requireAdmin();
  await deleteMessage(id);
  revalidatePath("/guestbook");
}

export async function signInForGuestbook() {
  await signIn("github", { redirectTo: "/guestbook" });
}

export async function signOutFromGuestbook() {
  await signOut({ redirectTo: "/guestbook" });
}
