const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const absoluteDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const absoluteDateFormatterWithYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Format a unix-seconds timestamp as a short "time ago" label
 *  ("just now", "2 mins ago", "3 hours ago", "5 days ago"). Returns null
 *  for missing/unknown timestamps (0) so callers can omit the line. The
 *  `nowSecs` arg is injectable for deterministic tests. */
export function formatRelativeTime(
  openedAt: number,
  nowSecs: number = Math.floor(Date.now() / 1000),
): string | null {
  if (!openedAt) return null;

  const diff = Math.max(0, nowSecs - openedAt);

  if (diff < 45) return "just now";
  if (diff < HOUR) {
    const mins = Math.round(diff / MINUTE);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const hours = Math.round(diff / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diff < WEEK) {
    const days = Math.round(diff / DAY);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  const weeks = Math.round(diff / WEEK);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

/** Format a unix-seconds timestamp as relative time for recent values and
 *  absolute for older ones. Switches to absolute after ~7 days. */
export function formatRelativeOrAbsolute(
  timestamp: number,
  nowSecs: number = Math.floor(Date.now() / 1000),
): string | null {
  if (!timestamp) return null;

  const diff = nowSecs - timestamp;
  if (diff < 7 * DAY) return formatRelativeTime(timestamp, nowSecs);

  const date = new Date(timestamp * 1000);
  const isThisYear = date.getFullYear() === new Date(nowSecs * 1000).getFullYear();
  return isThisYear
    ? absoluteDateFormatter.format(date)
    : absoluteDateFormatterWithYear.format(date);
}
