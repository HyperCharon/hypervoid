import { getPostBySlug } from "@/lib/posts";
import { isAiConfigured, streamAnswer } from "@/lib/ai";
import { getViewer } from "@/lib/viewer";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { slug: string };

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(
  request: Request,
  ctx: { params: Promise<Params> },
) {
  if (!(await isAiConfigured())) {
    return Response.json(
      { error: "AI 未配置，无法回答问题" },
      { status: 503 },
    );
  }

  const rl = await rateLimit(getIp(request), {
    key: "ask",
    limit: 10,
    windowSec: 300,
  });
  if (!rl.ok) {
    return Response.json(
      { error: `请求过于频繁，请 ${rl.resetInSec} 秒后重试` },
      { status: 429 },
    );
  }

  const { slug } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as {
    question?: string;
  };
  const question = (body.question ?? "").trim();
  if (!question) {
    return Response.json({ error: "问题不能为空" }, { status: 400 });
  }
  if (question.length > 500) {
    return Response.json({ error: "问题最多 500 字" }, { status: 400 });
  }

  const viewer = await getViewer();
  const post = await getPostBySlug(slug, { isAdmin: viewer.isAdmin });
  if (!post) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  let aiStream;
  try {
    aiStream = await streamAnswer({
      title: post.frontmatter.title,
      content: post.content,
      question,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI 请求失败";
    return Response.json({ error: msg }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of aiStream) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `\n\n[AI 错误:${(e instanceof Error ? e.message : "未知错误").slice(0, 200)}]`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
