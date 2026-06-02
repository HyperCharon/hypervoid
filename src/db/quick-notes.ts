import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";

export interface QuickNote {
  id: string;
  content: string;
  createdAt: Date;
}

export async function listQuickNotes(limit = 50): Promise<QuickNote[]> {
  const rows = await getDb()
    .select({
      id: schema.quickNotes.id,
      content: schema.quickNotes.content,
      createdAt: schema.quickNotes.createdAt,
    })
    .from(schema.quickNotes)
    .orderBy(desc(schema.quickNotes.createdAt))
    .limit(limit);
  return rows;
}

export async function createQuickNote(content: string): Promise<string> {
  const [row] = await getDb()
    .insert(schema.quickNotes)
    .values({ content })
    .returning({ id: schema.quickNotes.id });
  return row.id;
}

export async function deleteQuickNote(id: string): Promise<void> {
  await getDb()
    .delete(schema.quickNotes)
    .where(eq(schema.quickNotes.id, id));
}
