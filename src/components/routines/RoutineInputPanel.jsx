import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DAY_LABELS, ROUTINE_COLORS } from '@/lib/dateUtils';

export default function RoutineInputPanel({ onAdd, onUpdate, editingRoutine, onCancelEdit, onPreviewChange }) {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (editingRoutine) {
      setTitle(editingRoutine.title || '');
      setDays(editingRoutine.days || []);
      setStartTime(editingRoutine.start_time || '');
      setEndTime(editingRoutine.end_time || '');
    }
  }, [editingRoutine]);

  // Emit preview
  useEffect(() => {
    if (title && days.length > 0 && startTime && endTime) {
      onPreviewChange({
        title,
        days,
        start_time: startTime,
        end_time: endTime,
        color: ROUTINE_COLORS[0],
      });
    } else {
      onPreviewChange(null);
    }
  }, [title, days, startTime, endTime]);

  const toggleDay = (dayIdx) => {
    setDays(prev =>
      prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx].sort()
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || days.length === 0 || !startTime || !endTime) return;

    const data = {
      title: title.trim(),
      days,
      start_time: startTime,
      end_time: endTime,
      color: ROUTINE_COLORS[Math.floor(Math.random() * ROUTINE_COLORS.length)],
    };

    if (editingRoutine) {
      onUpdate(editingRoutine.id, data);
    } else {
      onAdd(data);
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDays([]);
    setStartTime('');
    setEndTime('');
    if (editingRoutine) onCancelEdit();
  };

  const isValid = title.trim() && days.length > 0 && startTime && endTime;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-5">
        {editingRoutine ? '루틴 수정' : '루틴 추가'}
      </h3>

      <div className="space-y-4 flex-1">
        {/* Title */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">루틴 이름</label>
          <Input
            placeholder="예: 회사, QT, 수업"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Days */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">반복 요일</label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((day, idx) => (
              <button
                key={idx}
                onClick={() => toggleDay(idx)}
                className={cn(
                  "w-9 h-9 rounded-lg text-xs font-medium transition-all",
                  days.includes(idx)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1.5 block">시작 시간</label>
            <Input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1.5 block">종료 시간</label>
            <Input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        {editingRoutine && (
          <Button variant="ghost" onClick={resetForm} className="flex-1">
            취소
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
          {editingRoutine ? '저장' : '추가'}
        </Button>
      </div>
    </div>
  );
}