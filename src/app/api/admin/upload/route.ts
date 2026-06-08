import { requireAdmin } from "@/auth";
import { isBlobConfigured, uploadImage } from "@/lib/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// SVG intentionally excluded: it can embed <script>, a stored-XSS vector.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

// Verify the file's real format by its magic bytes, so a spoofed Content-Type
// (e.g. an HTML/SVG payload renamed to .png) can't slip past the allowlist.
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  // RIFF....WEBP
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  // ISO-BMFF "ftyp" box → AVIF (ftypavif / ftypavis)
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBlobConfigured()) {
    return Response.json(
      {
        error:
          "Vercel Blob 未配置。在 Vercel Dashboard → Storage 创建一个 Blob 库，它会自动注入 BLOB_READ_WRITE_TOKEN env 变量。",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json(
      { error: `不支持的文件类型: ${file.type}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `文件超过 5MB (实际 ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const sniffed = sniffImageType(buffer);
  if (!sniffed || sniffed !== file.type) {
    return Response.json(
      { error: "文件内容与声明类型不符，或不是受支持的图片格式" },
      { status: 400 },
    );
  }

  try {
    const url = await uploadImage(buffer, sniffed);
    return Response.json({ url });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
