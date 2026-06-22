export function toKSTDateString(date?: Date): string {
  return (date ?? new Date()).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export function getKSTDayOfWeek(date?: Date): number {
  const s = toKSTDateString(date);
  return new Date(s + "T12:00:00Z").getUTCDay();
}

export function getKSTWeekRange() {
  const todayStr = toKSTDateString();
  const today = new Date(todayStr + "T12:00:00Z");
  const day = today.getUTCDay();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    mondayStr: monday.toISOString().split("T")[0],
    sundayStr: sunday.toISOString().split("T")[0],
  };
}

export function getKSTYearMonth(): { year: number; month: number } {
  const s = toKSTDateString();
  const [y, m] = s.split("-").map(Number);
  return { year: y, month: m };
}

export function getKSTWeekdayIndex(): number {
  return (getKSTDayOfWeek() + 6) % 7;
}

export function getKSTWeekDates(): string[] {
  const { mondayStr } = getKSTWeekRange();
  const monday = new Date(mondayStr + "T12:00:00Z");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().split("T")[0];
  });
}
