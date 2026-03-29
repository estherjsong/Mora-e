import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Clock, FileText, GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function TaskAddPopover({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', estimated_minutes: '', start_time: '', memo: '' });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAdd = () => {
    if (!form.title.trim()) return;
    onAdd({
      title: form.title.trim(),
      estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
      start_time: form.start_time || null,
      memo: form.memo || '',
    });
    setForm({ title: '', estimated_minutes: '', start_time: '', memo: '' });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          태스크 추가 (단축키: T)
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-3" align="start">
        <Input
          placeholder="태스크 이름 *"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block">수행 시간 (분)</label>
            <Input
              type="number"
              placeholder="60"
              value={form.estimated_minutes}
              onChange={e => setForm(p => ({ ...p, estimated_minutes: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block">시작 시간</label>
            <Input
              type="time"
              value={form.start_time}
              onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </div>
        </div>
        <Textarea
          placeholder="메모 (선택)"
          value={form.memo}
          onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
          className="h-16 resize-none"
        />
        <Button onClick={handleAdd} className="w-full" disabled={!form.title.trim()}>
          추가
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function TaskEditPopover({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task.title || '',
    estimated_minutes: task.estimated_minutes || '',
    start_time: task.start_time || '',
    memo: task.memo || '',
  });

  const handleSave = () => {
    onSave({
      ...task,
      title: form.title.trim(),
      estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
      start_time: form.start_time || null,
      memo: form.memo || '',
    });
    onClose();
  };

  return (
    <div className="p-3 space-y-3 bg-muted/50 rounded-lg border border-border mt-1">
      <Input
        placeholder="태스크 이름"
        value={form.title}
        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          }
        }}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground mb-1 block">수행 시간 (분)</label>
          <Input
            type="number"
            value={form.estimated_minutes}
            onChange={e => setForm(p => ({ ...p, estimated_minutes: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground mb-1 block">시작 시간</label>
          <Input
            type="time"
            value={form.start_time}
            onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>
      </div>
      <Textarea
        placeholder="메모"
        value={form.memo}
        onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
        className="h-16 resize-none"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>취소</Button>
        <Button size="sm" onClick={handleSave}>저장</Button>
      </div>
    </div>
  );
}

export default function TaskListView({ tasks, setTasks, onGenerate, onCancel, hasExistingSchedule }) {
  const [editingIdx, setEditingIdx] = useState(null);

  const handleAdd = (task) => {
    setTasks(prev => [...prev, { ...task, id: `temp_${Date.now()}` }]);
  };

  const handleDelete = (idx) => {
    setTasks(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const handleSave = (updated) => {
    setTasks(prev => prev.map((t, i) => i === editingIdx ? updated : t));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
        {tasks.map((task, idx) => (
          <div key={task.id || idx}>
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all",
                editingIdx === idx && "ring-2 ring-primary/30"
              )}
              onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {task.estimated_minutes && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />{task.estimated_minutes}분
                    </span>
                  )}
                  {task.start_time && (
                    <span className="text-[11px] text-muted-foreground">{task.start_time} 시작</span>
                  )}
                  {task.memo && <FileText className="w-3 h-3 text-muted-foreground" />}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(idx); }}
                className="p-1 hover:bg-destructive/10 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            {editingIdx === idx && (
              <TaskEditPopover
                task={task}
                onSave={handleSave}
                onClose={() => setEditingIdx(null)}
              />
            )}
          </div>
        ))}

        <TaskAddPopover onAdd={handleAdd} />
      </div>

      <div className="flex gap-2 pt-4 border-t border-border mt-4">
        {hasExistingSchedule ? (
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            취소
          </Button>
        ) : (
          <Button variant="ghost" disabled className="flex-1 opacity-30">
            취소
          </Button>
        )}
        <Button onClick={onGenerate} disabled={tasks.length === 0} className="flex-1">
          시간표 생성
        </Button>
      </div>
    </div>
  );
}