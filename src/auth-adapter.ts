import "server-only";

import { and, eq } from "drizzle-orm";
import type {
  Adapter,
  AdapterAccount,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";
import { getDb, schema } from "@/db/client";

type AuthUserRow = typeof schema.authUsers.$inferSelect;

function toAdapterUser(user: AuthUserRow): AdapterUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? "",
    emailVerified: user.emailVerified,
    image: user.image,
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function HypervoidAuthAdapter(): Adapter {
  return {
    async createUser(user) {
      const id = user.id || crypto.randomUUID();
      const [created] = await getDb()
        .insert(schema.authUsers)
        .values({
          id,
          name: user.name ?? null,
          email: user.email || null,
          emailVerified: user.emailVerified ?? null,
          image: user.image ?? null,
        })
        .onConflictDoNothing({ target: schema.authUsers.email })
        .returning();

      // If the email already existed (concurrent OAuth callback), fetch it.
      if (!created) {
        const existing = await getDb()
          .select()
          .from(schema.authUsers)
          .where(eq(schema.authUsers.email, user.email!))
          .limit(1);
        return toAdapterUser(existing[0]);
      }
      return toAdapterUser(created);
    },

    async getUser(id) {
      const [user] = await getDb()
        .select()
        .from(schema.authUsers)
        .where(eq(schema.authUsers.id, id))
        .limit(1);

      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const [user] = await getDb()
        .select()
        .from(schema.authUsers)
        .where(eq(schema.authUsers.email, email))
        .limit(1);

      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const [row] = await getDb()
        .select({ user: schema.authUsers })
        .from(schema.authAccounts)
        .innerJoin(
          schema.authUsers,
          eq(schema.authUsers.id, schema.authAccounts.userId),
        )
        .where(
          and(
            eq(schema.authAccounts.provider, provider),
            eq(schema.authAccounts.providerAccountId, providerAccountId),
          ),
        )
        .limit(1);

      return row?.user ? toAdapterUser(row.user) : null;
    },

    async updateUser(user) {
      const [updated] = await getDb()
        .update(schema.authUsers)
        .set({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
        })
        .where(eq(schema.authUsers.id, user.id))
        .returning();

      return toAdapterUser(updated);
    },

    async linkAccount(account) {
      const [created] = await getDb()
        .insert(schema.authAccounts)
        .values({
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: stringOrNull(account.session_state),
        })
        .onConflictDoNothing()
        .returning();

      return created as AdapterAccount | null;
    },

    async createVerificationToken(verificationToken) {
      const [created] = await getDb()
        .insert(schema.authVerificationTokens)
        .values(verificationToken)
        .onConflictDoUpdate({
          target: [
            schema.authVerificationTokens.identifier,
            schema.authVerificationTokens.token,
          ],
          set: { expires: verificationToken.expires },
        })
        .returning();

      return created satisfies VerificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      const [deleted] = await getDb()
        .delete(schema.authVerificationTokens)
        .where(
          and(
            eq(schema.authVerificationTokens.identifier, identifier),
            eq(schema.authVerificationTokens.token, token),
          ),
        )
        .returning();

      return deleted ?? null;
    },
  };
}
