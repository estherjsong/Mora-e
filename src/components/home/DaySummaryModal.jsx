import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOOD_OPTIONS } from '@/lib/dateUtils';

export default function DaySummaryModal({
  open,
  onClose,
  completedTasks,
  incompleteTasks,
  summary,
  onConfirm,
}) {
  const [carryOverIds, setCarryOverIds] = useState(incompleteTasks.map(t => t.id));
  const [mood, setMood] = useState('');
  const [diary, setDiary] = useState('');

  const toggleCarryOver = (id) => {
    setCarryOverIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      carryOverIds,
      mood,
      diary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">하루 마무리 ✨</DialogTitle>
        </DialogHeader>

        {summary && (
          <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed">
            {summary}
          </div>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              완료한 일 ({completedTasks.length})
            </h4>
            <div className="space-y-1.5">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm text-foreground/80 pl-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incomplete tasks */}
        {incompleteTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-amber-500" />
              내일로 가져갈 일을 선택하세요
            </h4>
            <div className="space-y-2">
              {incompleteTasks.map(task => (
                <label key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={carryOverIds.includes(task.id)}
                    onCheckedChange={() => toggleCarryOver(task.id)}
                  />
                  <span className="text-sm">{task.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Mood */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">오늘의 기분</h4>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map(opt => (
              <button
                key={opt.emoji}
                onClick={() => setMood(mood === opt.emoji ? '' : opt.emoji)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all",
                  mood === opt.emoji
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diary */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">오늘의 일기</h4>
          <Textarea
            placeholder="오늘 하루는 어땠나요? (선택)"
            value={diary}
            onChange={e => setDiary(e.target.value)}
            className="resize-none h-20"
          />
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">
            하루 마무리 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}