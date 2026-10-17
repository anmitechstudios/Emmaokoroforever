import type { ScheduleItem, ServiceInfo } from "@/lib/db/types";

export type ArrangementDay = { date: string; events: ScheduleItem[] };

/**
 * The funeral arrangements, grouped by day and in date order. Events keep the
 * order they were entered in within a day. Older data with a single service
 * and no events still shows, as one event on the main date.
 */
export function arrangementDays(service: ServiceInfo): ArrangementDay[] {
  const events: ScheduleItem[] = service.schedule.length
    ? service.schedule.map((e) => ({ ...e, date: e.date || service.date, venue: e.venue ?? "", map_query: e.map_query ?? "" }))
    : service.date || service.venue
      ? [
          {
            id: service.id,
            date: service.date,
            time: service.time,
            title: service.title,
            venue: [service.venue, service.address].filter(Boolean).join("\n"),
            map_query: service.map_query,
            note: "",
          },
        ]
      : [];

  const days: ArrangementDay[] = [];
  for (const event of events) {
    const day = days.find((d) => d.date === event.date);
    if (day) day.events.push(event);
    else days.push({ date: event.date, events: [event] });
  }
  // Undated events (date still to be confirmed) go last.
  return days.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
}

export function directionsUrl(query: string): string | null {
  return query ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}` : null;
}
