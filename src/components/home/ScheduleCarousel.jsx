import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeToMinutes } from '@/lib/dateUtils';

const COLORS = [
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800' },
  { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800' },
];

export default function ScheduleCarousel({ options, onSave, onRegenerate, isRegenerating }) {
  const [current, setCurrent] = useState(0);

  const goTo = (dir) => {
    setCurrent(prev => {
      if (dir === 'next') return (prev + 1) % options.length;
      return (prev - 1 + options.length) % options.length;
    });
  };

  const schedule = options[current];
  if (!schedule) return null;

  const sortedTasks = [...schedule].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  return (
    <div className="flex flex-col h-full">
      {/* Carousel navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => goTo('prev')} className="h-8 w-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          {options.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === current ? "bg-primary w-6" : "bg-border"
              )}
            />
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={() => goTo('next')} className="h-8 w-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mb-3">
        시간표 {current + 1} / {options.length}
      </p>

      {/* Schedule preview */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
        {sortedTasks.map((task, idx) => {
          const color = COLORS[idx % COLORS.length];
          return (
            <div
              key={idx}
              className={cn("flex items-center gap-3 p-3 rounded-lg border", color.bg, color.border)}
            >
              <div className="text-xs font-mono text-muted-foreground w-24 shrink-0">
                {task.start_time} – {task.end_time}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", color.text)}>{task.title}</p>
                {task.estimated_minutes && (
                  <p className="text-[11px] text-muted-foreground">{task.estimated_minutes}분</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border mt-4">
        <Button variant="outline" onClick={onRegenerate} disabled={isRegenerating} className="flex-1">
          {isRegenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          재생성
        </Button>
        <Button onClick={() => onSave(options[current])} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          저장
        </Button>
      </div>
    </div>
  );
}