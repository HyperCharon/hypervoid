/** Shared cache for /api/effects — deduplicates fetches from SparkleEffect + ClickEffect. */

type EffectsData = {
  textSparkle?: boolean;
  clickParticles?: boolean;
};

let cached: EffectsData | null = null;
let inflight: Promise<EffectsData> | null = null;

export function fetchEffects(): Promise<EffectsData> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = fetch("/api/effects")
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: EffectsData) => {
      cached = d;
      inflight = null;
      return d;
    })
    .catch(() => {
      inflight = null;
      return {} as EffectsData;
    });

  return inflight;
}
