import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { addDays } from 'date-fns';
import { formatDate } from '@/lib/dateUtils';
import MonthCalendar from '@/components/home/MonthCalendar';
import DailySchedulePanel from '@/components/home/DailySchedulePanel';

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    setSelectedDate(date);
  };

  return (
    <div className="h-full flex gap-5 p-6 overflow-hidden">
      {/* Calendar */}
      <div className="w-[400px] shrink-0">
        <MonthCalendar
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
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
        />
      </div>
    </div>
  );
}