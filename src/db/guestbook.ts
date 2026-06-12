import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";

export type GuestbookMessage = typeof schema.guestbookMessages.$inferSelect;

export async function listVisibleMessages(limit = 200): Promise<GuestbookMessage[]> {
  return getDb()
    .select()
    .from(schema.guestbookMessages)
    .where(eq(schema.guestbookMessages.hidden, false))
    .orderBy(desc(schema.guestbookMessages.createdAt))
    .limit(limit);
}

export async function listAllMessages(): Promise<GuestbookMessage[]> {
  return getDb()
    .select()
    .from(schema.guestbookMessages)
    .orderBy(desc(schema.guestbookMessages.createdAt));
}

export async function postMessage(input: {
  githubLogin: string;
  githubName: string | null;
  avatarUrl: string | null;
  message: string;
}): Promise<GuestbookMessage> {
  const rows = await getDb()
    .insert(schema.guestbookMessages)
    .values({
      githubLogin: input.githubLogin,
      githubName: input.githubName,
      avatarUrl: input.avatarUrl,
      message: input.message,
    })
    .returning();
  return rows[0];
}

export async function hideMessage(id: string): Promise<void> {
  await getDb()
    .update(schema.guestbookMessages)
    .set({ hidden: true })
    .where(eq(schema.guestbookMessages.id, id));
}

export async function unhideMessage(id: string): Promise<void> {
  await getDb()
    .update(schema.guestbookMessages)
    .set({ hidden: false })
    .where(eq(schema.guestbookMessages.id, id));
}

export async function deleteMessage(id: string): Promise<void> {
  await getDb()
    .delete(schema.guestbookMessages)
    .where(eq(schema.guestbookMessages.id, id));
}
