import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { addDays } from 'date-fns';
import { formatDate } from '@/lib/dateUtils';
import MonthCalendar from '@/components/home/MonthCalendar';
import DailySchedulePanel from '@/components/home/DailySchedulePanel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [panelMode, setPanelMode] = useState('schedule');
  const [drafts, setDrafts] = useState({});
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const queryClient = useQueryClient();

  const dateStr = formatDate(selectedDate);

  // Fetch all tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => localClient.entities.Task.list('-date', 500),
  });

  // Fetch routines
  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () => localClient.entities.Routine.list(),
  });

  // Fetch daily logs
  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['dailyLogs'],
    queryFn: () => localClient.entities.DailyLog.list('-date', 100),
  });

  // Tasks for selected date
  const dayTasks = useMemo(() =>
    allTasks.filter(t => t.date === dateStr),
    [allTasks, dateStr]
  );

  // Task counts by date for calendar
  const taskCountsByDate = useMemo(() => {
    const map = {};
    allTasks.forEach(t => {
      if (!t.date) return;
      if (!map[t.date]) map[t.date] = { done: 0, total: 0 };
      if (!t.is_google_calendar && !t.is_routine) {
        map[t.date].total++;
        if (t.status === 'completed') map[t.date].done++;
      }
    });
    return map;
  }, [allTasks]);

  // Daily logs by date
  const dailyLogsByDate = useMemo(() => {
    const map = {};
    dailyLogs.forEach(l => { map[l.date] = l; });
    return map;
  }, [dailyLogs]);

  // Save schedule
  const saveScheduleMutation = useMutation({
    mutationFn: async ({ date, schedule }) => {
      // Delete existing tasks for this date
      const existing = allTasks.filter(t => t.date === date);
      for (const t of existing) {
        await localClient.entities.Task.delete(t.id);
      }
      // Create new tasks (skip routine items, they come from the Routine entity)
      const newTasks = schedule
        .filter(item => !item.is_routine)
        .map((item, idx) => ({
          title: item.title,
          date,
          estimated_minutes: item.estimated_minutes,
          start_time: item.start_time,
          end_time: item.end_time,
          memo: item.memo || '',
          status: item.status || 'pending',
          is_google_calendar: item.is_google_calendar || false,
          order: idx,
        }));
      if (newTasks.length > 0) {
        await localClient.entities.Task.bulkCreate(newTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const finishDayMutation = useMutation({
    mutationFn: async ({ date, data }) => {
      // Save or update daily log
      const existing = dailyLogs.find(l => l.date === date);
      const logData = {
        date,
        mood: data.mood,
        diary: data.diary,
        summary: data.summary,
        completed_count: data.completedCount,
        total_count: data.totalCount,
      };
      if (existing) {
        await localClient.entities.DailyLog.update(existing.id, logData);
      } else {
        await localClient.entities.DailyLog.create(logData);
      }

      // Carry over tasks to next day
      if (data.carryOverIds?.length > 0) {
        const nextDate = formatDate(addDays(new Date(date), 1));
        const carryTasks = allTasks
          .filter(t => data.carryOverIds.includes(t.id))
          .map(t => ({
            title: t.title,
            date: nextDate,
            estimated_minutes: t.estimated_minutes,
            memo: t.memo || '',
            status: 'pending',
          }));
        if (carryTasks.length > 0) {
          await localClient.entities.Task.bulkCreate(carryTasks);
        }
        // Mark original tasks as carried over
        for (const id of data.carryOverIds) {
          await localClient.entities.Task.update(id, { status: 'carried_over' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
    },
  });

  const handleSaveSchedule = (date, schedule) => {
    saveScheduleMutation.mutate({ date, schedule });
  };

  const handleUpdateTask = (id, data) => {
    updateTaskMutation.mutate({ id, data });
  };

  const handleFinishDay = (date, data) => {
    finishDayMutation.mutate({ date, data });
  };

  const handleNavigateDate = (date) => {
    if (panelMode === 'carousel') {
      setPendingDate(date);
      setShowLeaveAlert(true);
      return;
    }
    setSelectedDate(date);
  };

  const confirmLeave = () => {
    setPanelMode('schedule');
    if (pendingDate) {
      setSelectedDate(pendingDate);
    }
    setShowLeaveAlert(false);
    setPendingDate(null);
  };

  return (
    <div className="h-full flex gap-5 p-6 overflow-hidden">
      {/* Calendar */}
      <div className="w-[400px] shrink-0">
        <MonthCalendar
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          selectedDate={selectedDate}
          onSelectDate={handleNavigateDate}
          taskCountsByDate={taskCountsByDate}
          dailyLogs={dailyLogsByDate}
        />
      </div>

      {/* Daily Schedule */}
      <div className="flex-1 min-w-0">
        <DailySchedulePanel
          selectedDate={selectedDate}
          tasks={dayTasks}
          routines={routines}
          dailyLog={dailyLogsByDate[dateStr]}
          onSaveSchedule={handleSaveSchedule}
          onUpdateTask={handleUpdateTask}
          onCarryOver={(task) => {
            updateTaskMutation.mutate({ id: task.id, data: { status: 'carried_over' } });
          }}
          onFinishDay={handleFinishDay}
          allTasks={allTasks}
          onNavigateDate={handleNavigateDate}
          mode={panelMode}
          setMode={setPanelMode}
          drafts={drafts}
          setDrafts={setDrafts}
        />
      </div>

      {/* 날짜 이동 확인 커스텀 다이얼로그 */}
      <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">앗, 잠시만요! 🛑</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed mt-2">
              시간표가 아직 저장되지 않았어요. 다른 날짜로 이동하시겠습니까?<br /><br />
              (생성된 시간표 옵션은 사라지지만, 입력한 태스크 목록은 임시저장됩니다.)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl">머무르기</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmLeave}>이동하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}