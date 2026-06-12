import { redirect } from "next/navigation";
import { getAllPostSlugs } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function RandomPostPage() {
  const slugs = await getAllPostSlugs();
  if (slugs.length === 0) {
    redirect("/posts");
  }
  const pick = slugs[Math.floor(Math.random() * slugs.length)];
  redirect(`/posts/${pick}`);
}
