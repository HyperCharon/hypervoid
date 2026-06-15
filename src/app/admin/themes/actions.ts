"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { saveCustomTheme, type ThemeColors } from "@/lib/custom-theme";
import { recordAudit } from "@/lib/audit";

export async function saveThemeAction(input: {
  enabled: boolean;
  light: ThemeColors;
  dark: ThemeColors;
  wallpaperDesktop: string | null;
  wallpaperMobile: string | null;
  wallpaperOpacity: number;
  wallpaperBlur: number;
}): Promise<void> {
  await requireAdmin();
  await saveCustomTheme(input);
  await recordAudit({
    action: "theme.save",
    targetType: "custom_theme",
    details: {
      enabled: input.enabled,
      lightKeys: Object.keys(input.light),
      darkKeys: Object.keys(input.dark),
      wallpaperDesktop: input.wallpaperDesktop ? "set" : null,
      wallpaperMobile: input.wallpaperMobile ? "set" : null,
    },
  });
  revalidatePath("/", "layout");
}
