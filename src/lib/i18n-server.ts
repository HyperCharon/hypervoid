import { cookies } from "next/headers";
import { MESSAGES, DEFAULT_LOCALE, type Locale, type Messages } from "@/lib/i18n";

function isLocale(value: string): value is Locale {
  return value === "zh-CN" || value === "en";
}

/**
 * Server-side i18n helper. Reads locale from cookie and returns messages.
 * Use in server components (async functions, page.tsx, layout.tsx, etc.)
 */
export async function getMessages(): Promise<Messages> {
  const store = await cookies();
  const raw = store.get("hypervoid:locale")?.value;
  const locale = raw && isLocale(raw) ? raw : DEFAULT_LOCALE;
  return MESSAGES[locale];
}

/**
 * Synchronous version for when you already know the locale.
 */
export function getMessagesSync(locale: string): Messages {
  return MESSAGES[isLocale(locale) ? locale : DEFAULT_LOCALE];
}
