const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, "0");

export function formatLocalDate(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function formatLocalDateTime(value: Date): string {
  return `${formatLocalDate(value)}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function parseLocalDate(value: string): Date | undefined {
  const match = DATE_PATTERN.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return formatLocalDate(date) === value ? date : undefined;
}

export function parseLocalDateTime(value: string | null): Date | undefined {
  if (!value) return undefined;
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return formatLocalDateTime(date) === value ? date : undefined;
}

export function formatEditorTimestamp(timestamp: string | null): string {
  const date = parseLocalDateTime(timestamp);
  if (!date) return "待确认日期时间";
  return `${formatLocalDate(date)}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

export function formatTimeOfDay(timestamp: string | null): string | undefined {
  const date = parseLocalDateTime(timestamp);
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : undefined;
}

export function formatTimeSegment(timestamp: string | null, referenceDate: string): string {
  const segmentDate = parseLocalDateTime(timestamp);
  const reference = parseLocalDate(referenceDate);
  if (!segmentDate || !reference) return "时间待确认";

  const segmentDay = new Date(segmentDate.getFullYear(), segmentDate.getMonth(), segmentDate.getDate());
  const yesterday = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - 1);
  const time = `${pad(segmentDate.getHours())}:${pad(segmentDate.getMinutes())}`;

  if (formatLocalDate(segmentDay) === formatLocalDate(reference)) return `Today ${time}`;
  if (formatLocalDate(segmentDay) === formatLocalDate(yesterday)) return `Yesterday ${time}`;
  const monthDay = `${pad(segmentDate.getMonth() + 1)}-${pad(segmentDate.getDate())}`;
  return segmentDate.getFullYear() === reference.getFullYear()
    ? `${monthDay} ${time}`
    : `${segmentDate.getFullYear()}-${monthDay} ${time}`;
}
