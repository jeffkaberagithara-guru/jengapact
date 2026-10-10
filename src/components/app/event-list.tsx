import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EventWithActor } from "@/modules/projects/queries";

interface EventListProps {
  events: EventWithActor[];
  emptyMessage?: string;
}

export function EventList({
  events,
  emptyMessage = "No recorded events yet.",
}: EventListProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="flex flex-col">
      {events.map(({ event, actorName }, index) => (
        <li
          key={event.id}
          className={cn(
            "flex gap-3 py-3",
            index !== events.length - 1 && "border-b border-border",
          )}
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm">{event.summary}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{actorName ?? "System"}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={event.createdAt.toISOString()}>
                {formatDateTime(event.createdAt)}
              </time>
              {event.resultingState ? (
                <StatusBadge status={event.resultingState} />
              ) : null}
              <span className="tabular text-muted-foreground/80">
                {event.eventType}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
