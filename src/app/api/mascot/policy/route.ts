import { NextResponse } from "next/server";
import { getSiteOverride } from "@/lib/site-config-server";

export const runtime = "nodejs";
export const revalidate = 300;

function isOn(value: string): boolean {
  return value !== "off";
}

function normalizeCharacter(value: string): "kanna" | "rem" | "ram" {
  return value === "kanna" || value === "rem" || value === "ram"
    ? value
    : "ram";
}

export async function GET() {
  const [allowUserSwitch, showSwitchButton, defaultCharacter] = await Promise.all([
    getSiteOverride("mascot.allowUserSwitch"),
    getSiteOverride("mascot.showSwitchButton"),
    getSiteOverride("mascot.defaultCharacter"),
  ]);

  return NextResponse.json({
    allowUserSwitch: isOn(allowUserSwitch),
    showSwitchButton: isOn(showSwitchButton),
    defaultCharacter: normalizeCharacter(defaultCharacter),
  });
}
