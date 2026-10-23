export const MANILA_TIME_ZONE = 'Asia/Manila';
const DAY_MS = 86_400_000;

export type ReportPeriod = 'day' | 'week' | 'month';
export interface SalesRange {
  startDate: string;
  endDate: string;
  start: Date;
  endExclusive: Date;
  period: ReportPeriod;
}
export type RangeResult = { range: SalesRange; error?: never } | { range?: never; error: string };

export function manilaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function defaultSalesDates(now = new Date()) {
  const endDate = manilaDate(now);
  return { startDate: shiftDate(endDate, -29), endDate };
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseSalesRange(params: Record<string, string | string[] | undefined>, now = new Date()): RangeResult {
  const defaults = defaultSalesDates(now);
  const startDate = params.start ?? defaults.startDate;
  const endDate = params.end ?? defaults.endDate;
  const period = params.period ?? 'day';
  if (!validDate(startDate) || !validDate(endDate)) return { error: 'Enter valid start and end dates (YYYY-MM-DD).' };
  if (startDate > endDate) return { error: 'The start date must be on or before the end date.' };
  if (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`) > 730 * DAY_MS) {
    return { error: 'Choose a date range of at most two years (731 days).' };
  }
  if (period !== 'day' && period !== 'week' && period !== 'month') return { error: 'Choose day, week or month as the period.' };
  return { range: {
    startDate, endDate, period,
    start: new Date(`${startDate}T00:00:00+08:00`),
    endExclusive: new Date(Date.parse(`${endDate}T00:00:00+08:00`) + DAY_MS),
  } };
}

export function periodStart(date: string, period: ReportPeriod) {
  if (period === 'month') return `${date.slice(0, 7)}-01`;
  if (period === 'week') {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    return shiftDate(date, -((day + 6) % 7));
  }
  return date;
}

export function periodDates(range: SalesRange) {
  const result: string[] = [];
  const cursor = new Date(`${periodStart(range.startDate, range.period)}T00:00:00Z`);
  const end = Date.parse(`${range.endDate}T00:00:00Z`);
  while (cursor.getTime() <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    if (range.period === 'month') {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    } else cursor.setUTCDate(cursor.getUTCDate() + (range.period === 'week' ? 7 : 1));
  }
  return result;
}

export function salesRangeParams(range: SalesRange) {
  return new URLSearchParams({ start: range.startDate, end: range.endDate, period: range.period });
}

export function displaySalesDate(date: string) {
  return new Intl.DateTimeFormat('en-PH', { timeZone: MANILA_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00+08:00`));
}
