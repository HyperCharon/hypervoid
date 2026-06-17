/** Shared cache for /api/mascot/policy — deduplicates fetches from MascotRouter + MascotCharacterSwitcher. */

export type MascotPolicy = {
  allowUserSwitch: boolean;
  showSwitchButton: boolean;
  defaultCharacter: "kanna" | "rem" | "ram";
};

let cached: MascotPolicy | null = null;
let inflight: Promise<MascotPolicy> | null = null;

export function fetchMascotPolicy(): Promise<MascotPolicy> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = fetch("/api/mascot/policy", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data: Partial<MascotPolicy>) => {
      const policy: MascotPolicy = {
        allowUserSwitch: data.allowUserSwitch !== false,
        showSwitchButton: data.showSwitchButton !== false,
        defaultCharacter:
          data.defaultCharacter === "kanna" ||
          data.defaultCharacter === "rem" ||
          data.defaultCharacter === "ram"
            ? data.defaultCharacter
            : "ram",
      };
      cached = policy;
      inflight = null;
      return policy;
    })
    .catch(() => {
      inflight = null;
      return { allowUserSwitch: true, showSwitchButton: true, defaultCharacter: "ram" as const };
    });

  return inflight;
}
