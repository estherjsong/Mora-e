import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, ArrowRight, CalendarDays } from 'lucide-react';
import { timeToMinutes, isToday as checkIsToday } from '@/lib/dateUtils';

const HOUR_HEIGHT = 56;
const START_HOUR = 6;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const TASK_COLORS = [
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800' },
  { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' },
];

export default function ScheduleTimeline({
  tasks,
  selectedDate,
  onCarryOver,
  isPast,
}) {
  const containerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const todaySelected = checkIsToday(selectedDate);

  useEffect(() => {
    if (!todaySelected) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [todaySelected]);

  useEffect(() => {
    if (containerRef.current && todaySelected) {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const scrollTo = ((mins - START_HOUR * 60) / 60) * HOUR_HEIGHT - 100;
      containerRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [todaySelected]);

  const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentLineTop = ((currentMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  const sortedTasks = [...tasks].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  return (
    <div ref={containerRef} className="relative overflow-y-auto flex-1 pr-2" style={{ scrollbarWidth: 'thin' }}>
      <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
        {/* Hour lines */}
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 flex items-start"
            style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
          >
            <span className="text-[11px] text-muted-foreground font-mono w-12 shrink-0 -mt-2 text-right pr-3">
              {String(hour).padStart(2, '0')}:00
            </span>
            <div className="flex-1 border-t border-border/50" />
          </div>
        ))}

        {/* Tasks */}
        {sortedTasks.map((task, idx) => {
          const startMins = timeToMinutes(task.start_time);
          const endMins = timeToMinutes(task.end_time);
          const top = ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
          const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 28);
          const color = task.is_routine
            ? { bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground' }
            : task.is_google_calendar
            ? { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' }
            : TASK_COLORS[idx % TASK_COLORS.length];
          const isCompleted = task.status === 'completed';
          const isIncomplete = isPast && task.status !== 'completed';
          const isCarriedOver = task.status === 'carried_over';

          return (
            <div
              key={task.id || idx}
              className={cn(
                "absolute left-14 right-2 rounded-lg border px-3 py-1.5 transition-all overflow-hidden",
                color.bg, color.border,
                isIncomplete && !isCarriedOver && "opacity-40 grayscale",
              )}
              style={{ top, height: Math.max(height - 2, 26) }}
            >
              <div className="flex items-center gap-2">
                {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                <span className={cn("text-xs font-medium truncate", color.text, isCompleted && "line-through opacity-70")}>
                  {task.title}
                </span>
                {task.is_google_calendar && (
                  <CalendarDays className="w-3 h-3 text-sky-600 shrink-0 ml-auto" />
                )}
                {isCarriedOver && onCarryOver && (
                  <button
                    onClick={() => onCarryOver(task)}
                    className="ml-auto p-0.5 hover:bg-white/50 rounded"
                    title="다음날 시간표로 이동"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              {height > 36 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {task.start_time} – {task.end_time}
                </span>
              )}
              {height > 52 && task.progress != null && task.progress < 100 && (
                <div className="mt-1 h-1 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/40 rounded-full" style={{ width: `${task.progress}%` }} />
                </div>
              )}
            </div>
          );
        })}

        {/* Current time line */}
        {todaySelected && currentMins >= START_HOUR * 60 && currentMins <= END_HOUR * 60 && (
          <div
            className="absolute left-12 right-0 flex items-center z-10 pointer-events-none"
            style={{ top: currentLineTop }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0 -ml-1" />
            <div className="flex-1 h-[2px] bg-destructive" />
          </div>
        )}
      </div>
    </div>
  );
}