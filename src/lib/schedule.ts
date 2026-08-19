/**
 * Smart best-time defaults per platform (UTC times, IST +5:30).
 * These are common high-engagement windows.
 */
export const BEST_TIMES: Record<string, string> = {
  instagram: "11:00",
  linkedin: "08:30",
  twitter: "09:00",
  facebook: "10:00",
  tiktok: "19:00",
  youtube: "14:00",
};

export function getBestTime(platform: string): string {
  return BEST_TIMES[platform] || "09:00";
}

export function applyBestTime(date: Date, platform: string): string {
  const best = getBestTime(platform);
  const [h, m] = best.split(":").map((x) => parseInt(x, 10));
  const d = new Date(date);
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
}

/**
 * Generate the next N scheduled dates for a set of platforms.
 * Spreads posts across the next days, one day per post, at each
 * platform's best time.
 */
export function buildSchedule(
  platforms: string[],
  postsPerPlatform: number,
  start: Date = new Date()
): Array<{ platform: string; scheduledAt: string; bestTime: string }> {
  const out: Array<{ platform: string; scheduledAt: string; bestTime: string }> = [];
  let dayOffset = 1;
  for (const platform of platforms) {
    for (let i = 0; i < postsPerPlatform; i++) {
      const base = new Date(start.getTime() + dayOffset * 86400000);
      const bestTime = getBestTime(platform);
      const [h, m] = bestTime.split(":").map((x) => parseInt(x, 10));
      const d = new Date(base);
      d.setUTCHours(h, m, 0, 0);
      out.push({ platform, scheduledAt: d.toISOString(), bestTime });
      dayOffset++;
    }
  }
  return out;
}
