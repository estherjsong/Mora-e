import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getCalendarDays, formatMonth, formatDate, isSameDay, isSameMonth, isToday, DAY_LABELS
} from '@/lib/dateUtils';

export default function MonthCalendar({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  onSelectDate,
  taskCountsByDate,
  dailyLogs,
}) {
  const days = getCalendarDays(currentMonth);

  const getDateInfo = (day) => {
    const key = formatDate(day);
    const counts = taskCountsByDate[key] || { done: 0, total: 0 };
    const log = dailyLogs[key];
    return { counts, log };
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold tracking-tight">{formatMonth(currentMonth)}</h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={cn(
            "text-center text-xs font-medium py-1",
            i === 0 ? "text-destructive/70" : i === 6 ? "text-primary/70" : "text-muted-foreground"
          )}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day) => {
          const { counts, log } = getDateInfo(day);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex flex-col items-center justify-start p-1.5 rounded-xl transition-all duration-200 min-h-[68px]",
                !inMonth && "opacity-30",
                selected && "bg-primary/10 ring-2 ring-primary/30",
                !selected && today && "bg-accent/30",
                !selected && !today && "hover:bg-muted"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                today && !selected && "text-primary font-bold",
                selected && "text-primary font-bold",
              )}>
                {day.getDate()}
              </span>

              {inMonth && counts.total > 0 && (
                <span className={cn(
                  "text-[10px] mt-0.5 font-mono",
                  counts.done === counts.total ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {counts.done}/{counts.total}
                </span>
              )}

              {inMonth && log?.mood && (
                <span className="text-sm mt-0.5">{log.mood}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}