import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { DAY_LABELS, timeToMinutes, ROUTINE_COLORS } from '@/lib/dateUtils';

const HOUR_HEIGHT = 40;
const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

export default function RoutineWeekTable({ routines, previewRoutine, onSelectRoutine, onDeleteRoutine, selectedRoutineId }) {
  const [hoveredRoutineId, setHoveredRoutineId] = useState(null);

  const getRoutineColor = (routine, idx) => {
    if (routine.color) return routine.color;
    return ROUTINE_COLORS[idx % ROUTINE_COLORS.length];
  };

  const allItems = [
    ...routines.map((r, i) => ({ ...r, _idx: i, _isPreview: false })),
    ...(previewRoutine ? [{ ...previewRoutine, id: 'preview', _idx: routines.length, _isPreview: true }] : []),
  ];

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden h-full flex flex-col">
      {/* Day headers */}
      <div className="flex border-b border-border shrink-0">
        <div className="w-14 shrink-0" />
        {DAY_LABELS.map((day, i) => (
          <div
            key={day}
            className={cn(
              "flex-1 text-center py-3 text-sm font-medium border-l border-border",
              i === 0 ? "text-destructive/70" : i === 6 ? "text-primary/70" : "text-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {/* Hour labels */}
          <div className="w-14 shrink-0 relative">
            {HOURS.filter(h => h % 2 === 0).map(hour => (
              <div
                key={hour}
                className="absolute left-0 right-0 text-[10px] text-muted-foreground font-mono text-right pr-2 -mt-2"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAY_LABELS.map((_, dayIdx) => (
            <div key={dayIdx} className="flex-1 relative border-l border-border">
              {/* Hour lines */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-border/30"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                />
              ))}

              {/* Routine blocks */}
              {allItems
                .filter(r => r.days?.includes(dayIdx))
                .map((routine) => {
                  const startMins = timeToMinutes(routine.start_time);
                  const endMins = timeToMinutes(routine.end_time);
                  const top = ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;
                  const color = getRoutineColor(routine, routine._idx);
                  const isPreview = routine._isPreview;
                  const isHovered = hoveredRoutineId === routine.id;
                  const isSelected = selectedRoutineId === routine.id;
                  const isSameGroup = hoveredRoutineId && routine.id === hoveredRoutineId;

                  return (
                    <div
                      key={`${routine.id}-${dayIdx}`}
                      className={cn(
                        "absolute inset-x-0.5 rounded-md border px-1.5 py-0.5 cursor-pointer transition-all overflow-hidden group",
                        `bg-${color}-100 border-${color}-300`,
                        isPreview && "opacity-40",
                        !isPreview && isSameGroup && `bg-${color}-200`,
                        isSelected && "ring-2 ring-primary/50",
                      )}
                      style={{ top, height: Math.max(height - 1, 16) }}
                      onClick={() => !isPreview && onSelectRoutine(routine)}
                      onMouseEnter={() => !isPreview && setHoveredRoutineId(routine.id)}
                      onMouseLeave={() => setHoveredRoutineId(null)}
                    >
                      <span className={cn("text-[10px] font-medium leading-tight block truncate", `text-${color}-800`)}>
                        {routine.title}
                      </span>
                      {height > 24 && (
                        <span className={cn("text-[9px] block", `text-${color}-700`)}>
                          {routine.start_time}~{routine.end_time}
                        </span>
                      )}
                      {!isPreview && isHovered && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteRoutine(routine.id); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}