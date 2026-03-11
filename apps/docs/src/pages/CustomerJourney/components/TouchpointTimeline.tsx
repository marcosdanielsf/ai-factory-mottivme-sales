import {
  ArrowRight,
  AlertTriangle,
  Zap,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { useCjmTimeline } from "../../../hooks/useCjmTimeline";

interface TouchpointTimelineProps {
  contactId: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  stage_change: <ArrowRight className="w-3.5 h-3.5" />,
  sla_breached: <AlertTriangle className="w-3.5 h-3.5" />,
  touchpoint_fired: <Zap className="w-3.5 h-3.5" />,
  journey_completed: <CheckCircle className="w-3.5 h-3.5" />,
  manual_note: <MessageSquare className="w-3.5 h-3.5" />,
};

const EVENT_COLORS: Record<string, string> = {
  stage_change: "bg-blue-500 text-white",
  sla_breached: "bg-red-500 text-white",
  touchpoint_fired: "bg-amber-500 text-white",
  journey_completed: "bg-emerald-500 text-white",
  manual_note: "bg-bg-tertiary text-text-muted border border-border-default",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

function buildDescription(event: {
  event_type: string;
  from_stage_name: string | null;
  to_stage_name: string | null;
  metadata: Record<string, unknown> | null;
}): string {
  switch (event.event_type) {
    case "stage_change":
      return `${event.from_stage_name ?? "—"} → ${event.to_stage_name ?? "—"}`;
    case "sla_breached":
      return `SLA violado em "${event.from_stage_name ?? event.to_stage_name ?? "etapa"}"`;
    case "touchpoint_fired":
      return (
        (event.metadata?.touchpoint_name as string) ?? "Touchpoint disparado"
      );
    case "journey_completed":
      return "Jornada concluida";
    case "manual_note":
      return (event.metadata?.note as string) ?? "Nota registrada";
    default:
      return event.event_type;
  }
}

const SkeletonBar = ({ width }: { width: string }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-bg-tertiary animate-pulse" />
    <div className="flex-1 pt-1 space-y-1.5">
      <div className={`h-3.5 rounded bg-bg-tertiary animate-pulse ${width}`} />
      <div className="h-3 rounded bg-bg-tertiary animate-pulse w-20" />
    </div>
  </div>
);

const TouchpointTimeline = ({ contactId }: TouchpointTimelineProps) => {
  const { events, loading, error } = useCjmTimeline(contactId);

  if (loading) {
    return (
      <div className="space-y-5 py-2">
        <SkeletonBar width="w-3/4" />
        <SkeletonBar width="w-1/2" />
        <SkeletonBar width="w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-400 py-4 text-center">
        Erro ao carregar eventos
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-text-muted py-8 text-center">
        Nenhum evento registrado
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-4 bottom-4 w-px bg-border-default" />

      <div className="space-y-5">
        {events.map((event) => {
          const colorClass =
            EVENT_COLORS[event.event_type] ?? EVENT_COLORS.manual_note;
          const dotStyle =
            event.stage_color && event.event_type === "stage_change"
              ? { backgroundColor: event.stage_color }
              : undefined;

          return (
            <div key={event.id} className="flex items-start gap-3 relative">
              {/* Circle icon */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 ${dotStyle ? "" : colorClass}`}
                style={dotStyle}
              >
                {EVENT_ICONS[event.event_type] ?? (
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <p
                  className={`text-sm font-medium leading-snug ${
                    event.event_type === "sla_breached"
                      ? "text-red-400"
                      : "text-text-primary"
                  }`}
                >
                  {buildDescription(event)}
                </p>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-text-muted">
                    {formatTimestamp(event.occurred_at)}
                  </span>

                  {event.time_in_previous_stage != null && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted border border-border-default">
                      {event.time_in_previous_stage}h na etapa anterior
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TouchpointTimeline;
