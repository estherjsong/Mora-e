import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Edit3, Moon, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayDate, isPastDate, isToday as checkIsToday, formatDate } from '@/lib/dateUtils';
import ScheduleTimeline from './ScheduleTimeline';
import TaskListView from './TaskListView';
import ScheduleCarousel from './ScheduleCarousel';
import PastDayLog from './PastDayLog';
import TaskNotification from './TaskNotification';
import DaySummaryModal from './DaySummaryModal';
import { generateScheduleOptions, generateRescheduledOptions, generateDaySummary } from '@/lib/scheduleAI';
import { AnimatePresence } from 'framer-motion';

export default function DailySchedulePanel({
  selectedDate,
  tasks,
  routines,
  dailyLog,
  onSaveSchedule,
  onUpdateTask,
  onCarryOver,
  onFinishDay,
  allTasks,
  onNavigateDate,
}) {
  const [mode, setMode] = useState('schedule'); // 'schedule' | 'edit' | 'carousel'
  const [editTasks, setEditTasks] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  const dateStr = formatDate(selectedDate);
  const isPast = isPastDate(selectedDate);
  const isToday = checkIsToday(selectedDate);
  const hasSchedule = tasks.length > 0 && tasks.some(t => t.start_time && t.end_time);

  // Merge routines into the task list for timeline display
  const dayOfWeek = selectedDate.getDay();
  const dayRoutines = routines.filter(r => r.days?.includes(dayOfWeek));
  const timelineTasks = [
    ...tasks,
    ...dayRoutines.map(r => ({
      id: `routine_${r.id}`,
      title: r.title,
      start_time: r.start_time,
      end_time: r.end_time,
      is_routine: true,
      status: 'pending',
    })),
  ];

  // Reset mode when date changes
  useEffect(() => {
    if (isPast || hasSchedule) {
      setMode('schedule');
    } else {
      setMode('edit');
      setEditTasks(tasks.length > 0 ? tasks.map(t => ({ ...t })) : []);
    }
  }, [dateStr]);

  // Today notification timer
  useEffect(() => {
    if (!isToday || !hasSchedule) return;

    const check = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      for (const task of tasks) {
        if (task.is_google_calendar || task.status === 'completed') continue;
        const [sh, sm] = (task.start_time || '').split(':').map(Number);
        const [eh, em] = (task.end_time || '').split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;

        if (Math.abs(nowMins - startMins) <= 1 && !notification) {
          setNotification({ type: 'start', task });
          return;
        }
        if (Math.abs(nowMins - endMins) <= 1 && !notification) {
          setNotification({ type: 'end', task });
          return;
        }
      }
    };

    check();
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, [isToday, hasSchedule, tasks, notification]);

  const handleSwitchToEdit = () => {
    setEditTasks(tasks.map(t => ({
      ...t,
      // Strip schedule info for re-editing
    })));
    setMode('edit');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const options = await generateScheduleOptions(
      editTasks,
      routines,
      dateStr,
      allTasks
    );
    setScheduleOptions(options);
    setMode('carousel');
    setIsGenerating(false);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    const options = await generateScheduleOptions(
      editTasks,
      routines,
      dateStr,
      allTasks
    );
    setScheduleOptions(options);
    setIsGenerating(false);
  };

  const handleSave = (chosenSchedule) => {
    onSaveSchedule(dateStr, chosenSchedule);
    setMode('schedule');
  };

  const handleCancelEdit = () => {
    setMode('schedule');
  };

  const handleProgressSelect = (task, progress, reschedule) => {
    onUpdateTask(task.id, { progress, status: progress === 100 ? 'completed' : 'in_progress' });
  };

  const handleReschedule = async (task, progress) => {
    setIsGenerating(true);
    const options = await generateRescheduledOptions(tasks, task, progress, routines, dateStr);
    setScheduleOptions(options);
    setMode('carousel');
    setIsGenerating(false);
  };

  const handleFinishDay = async () => {
    setSummaryText('요약을 생성하고 있어요...');
    setShowSummary(true);
    const summary = await generateDaySummary(tasks);
    setSummaryText(summary);
  };

  const handleConfirmFinish = ({ carryOverIds, mood, diary }) => {
    onFinishDay(dateStr, {
      carryOverIds,
      mood,
      diary,
      summary: summaryText,
      completedCount: tasks.filter(t => t.status === 'completed').length,
      totalCount: tasks.filter(t => !t.is_google_calendar).length,
    });
    setShowSummary(false);
  };

  const handleCarryOverNav = (task) => {
    if (onNavigateDate) {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      onNavigateDate(next);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed' && !t.is_google_calendar);
  const incompleteTasks = tasks.filter(t => t.status !== 'completed' && !t.is_google_calendar && !t.is_routine);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{formatDisplayDate(selectedDate)}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isToday ? '오늘' : isPast ? '지난 날' : '다가오는 날'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isToday && hasSchedule && mode === 'schedule' && (
            <Button variant="outline" size="sm" onClick={handleFinishDay}>
              <Moon className="w-3.5 h-3.5 mr-1.5" />
              하루 마무리
            </Button>
          )}
          {!isPast && hasSchedule && mode === 'schedule' && (
            <Button variant="outline" size="sm" onClick={handleSwitchToEdit}>
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              시간표 수정
            </Button>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isGenerating && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">AI가 시간표를 만들고 있어요...</p>
          </div>
        </div>
      )}

      {/* Schedule timeline view */}
      {!isGenerating && mode === 'schedule' && hasSchedule && (
        <>
          <ScheduleTimeline
            tasks={timelineTasks}
            selectedDate={selectedDate}
            isPast={isPast}
            onCarryOver={isPast ? handleCarryOverNav : undefined}
          />
          {isPast && <PastDayLog log={dailyLog} />}
        </>
      )}

      {/* Empty state for future dates */}
      {!isGenerating && mode === 'schedule' && !hasSchedule && !isPast && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">아직 시간표가 없어요</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleSwitchToEdit}>
              시간표 만들기
            </Button>
          </div>
        </div>
      )}

      {/* Past with no schedule */}
      {!isGenerating && mode === 'schedule' && !hasSchedule && isPast && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">이 날의 시간표가 없어요</p>
            {dailyLog && <PastDayLog log={dailyLog} />}
          </div>
        </div>
      )}

      {/* Edit mode */}
      {!isGenerating && mode === 'edit' && (
        <TaskListView
          tasks={editTasks}
          setTasks={setEditTasks}
          onGenerate={handleGenerate}
          onCancel={handleCancelEdit}
          hasExistingSchedule={hasSchedule}
        />
      )}

      {/* Carousel mode */}
      {!isGenerating && mode === 'carousel' && (
        <ScheduleCarousel
          options={scheduleOptions}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
          isRegenerating={isGenerating}
        />
      )}

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <TaskNotification
            type={notification.type}
            task={notification.task}
            onDismiss={() => setNotification(null)}
            onProgressSelect={handleProgressSelect}
            onReschedule={handleReschedule}
          />
        )}
      </AnimatePresence>

      {/* Day Summary Modal */}
      <DaySummaryModal
        open={showSummary}
        onClose={() => setShowSummary(false)}
        completedTasks={completedTasks}
        incompleteTasks={incompleteTasks}
        summary={summaryText}
        onConfirm={handleConfirmFinish}
      />
    </div>
  );
}