import "server-only";

import { getSiteSetting, setSiteSetting } from "@/db/site-settings";
import { cvData, type CvData } from "@/lib/cv-data";

// Resume content + visibility live in the generic `site_overrides` store so they
// can be edited from /admin/cv without a redeploy. Content is one JSON blob;
// visibility is a boolean flag, default hidden.
const DATA_KEY = "cv.data";
const VISIBLE_KEY = "cv.visible";

type CvCache = { data: CvData; raw: string; visible: boolean };
let _cache: CvCache | null = null;
let _cacheTs = 0;
const TTL = 60_000;

async function load(): Promise<CvCache> {
  const now = Date.now();
  if (_cache && now - _cacheTs < TTL) return _cache;

  let data = cvData;
  let raw = "";
  let visible = false;
  try {
    const [storedData, storedVisible] = await Promise.all([
      getSiteSetting(DATA_KEY),
      getSiteSetting(VISIBLE_KEY),
    ]);
    if (storedData) {
      // Keep the admin's exact text for the editor; parse for rendering.
      raw = storedData;
      data = JSON.parse(storedData) as CvData;
    }
    visible = storedVisible === "1";
  } catch (error) {
    console.warn(
      "[cv-store] failed to load résumé, using defaults:",
      error instanceof Error ? error.message : error,
    );
    data = cvData;
    raw = "";
  }

  _cache = { data, raw, visible };
  _cacheTs = now;
  return _cache;
}

function invalidateCvCache(): void {
  _cache = null;
  _cacheTs = 0;
}

/** Parsed résumé content for rendering /cv. */
export async function getCvData(): Promise<CvData> {
  return (await load()).data;
}

/** Whether the résumé is publicly shown (chip + page). Default false (hidden). */
export async function isCvVisible(): Promise<boolean> {
  return (await load()).visible;
}

/** Just the repeating-array sections, pretty-printed for the admin JSON box. */
export async function getCvArraysJson(): Promise<string> {
  const { data } = await load();
  const { stats, skills, experience, projects, education, contacts } = data;
  return JSON.stringify({ stats, skills, experience, projects, education, contacts }, null, 2);
}

/** Validate (must JSON.parse) and persist résumé content. Throws on bad JSON. */
export async function saveCvData(raw: string): Promise<void> {
  JSON.parse(raw); // throws SyntaxError if invalid — caller surfaces it
  await setSiteSetting(DATA_KEY, raw);
  invalidateCvCache();
}

export async function setCvVisible(visible: boolean): Promise<void> {
  await setSiteSetting(VISIBLE_KEY, visible ? "1" : "0");
  invalidateCvCache();
}
