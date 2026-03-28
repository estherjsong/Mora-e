import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROGRESS_OPTIONS = [
  { value: 0, label: '거의 못함' },
  { value: 25, label: '' },
  { value: 50, label: '하는 중' },
  { value: 75, label: '' },
  { value: 100, label: '끝남' },
];

export default function TaskNotification({
  type, // 'start' | 'end'
  task,
  onDismiss,
  onProgressSelect,
  onReschedule,
}) {
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);

  const handleProgressSelect = (val) => {
    setSelectedProgress(val);
    if (val === 100) {
      onProgressSelect(task, val, false);
      onDismiss();
    } else {
      setShowReschedule(true);
    }
  };

  const handleRescheduleChoice = (yes) => {
    onProgressSelect(task, selectedProgress, yes);
    if (yes) {
      onReschedule(task, selectedProgress);
    }
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 w-80 bg-card rounded-2xl border border-border shadow-2xl p-5 z-50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {type === 'start' ? '시작할 시간이에요!' : '마무리할 때에요!'}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 hover:bg-muted rounded-lg">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-sm font-semibold mb-3">{task.title}</p>

      {type === 'start' && (
        <p className="text-xs text-muted-foreground">
          {task.start_time} – {task.end_time}
        </p>
      )}

      {type === 'end' && !showReschedule && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">어느정도 수행하셨나요?</p>
          <div className="flex items-center justify-between gap-0.5 mb-2">
            {PROGRESS_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.value}>
                <button
                  onClick={() => handleProgressSelect(opt.value)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center text-[10px] font-medium",
                    selectedProgress === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {opt.value}%
                </button>
                {i < PROGRESS_OPTIONS.length - 1 && (
                  <div className="h-[2px] flex-1 bg-border" />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>거의 못함</span>
            <span>하는 중</span>
            <span>끝남</span>
          </div>
        </div>
      )}

      {type === 'end' && showReschedule && (
        <div>
          <p className="text-sm mb-3">시간표를 다시 조정할까요?</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleRescheduleChoice(false)} className="flex-1">
              아니요
            </Button>
            <Button size="sm" onClick={() => handleRescheduleChoice(true)} className="flex-1">
              예
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}