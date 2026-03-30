import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3, CheckCircle2, TrendingUp, CalendarDays, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Statistics() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // 하루 마무리(Log) 데이터 불러오기
  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['dailyLogs'],
    queryFn: () => localClient.entities.DailyLog.list('-date', 500),
  });

  const monthStr = format(currentMonth, 'yyyy-MM');
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // 이번 달 데이터 필터링
  const monthLogs = useMemo(() => {
    return dailyLogs.filter(log => log.date && log.date.startsWith(monthStr));
  }, [dailyLogs, monthStr]);

  // 1. 평균 완수율 계산
  const completionStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    monthLogs.forEach(log => {
      total += (log.total_count || 0);
      completed += (log.completed_count || 0);
    });
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [monthLogs]);

  // 2. 가장 자주 느낀 기분
  const mostFrequentMood = useMemo(() => {
    const counts = {};
    monthLogs.forEach(log => {
      if (log.mood) counts[log.mood] = (counts[log.mood] || 0) + 1;
    });
    let top = null;
    let max = 0;
    Object.entries(counts).forEach(([m, c]) => {
      if (c > max) { max = c; top = m; }
    });
    return top;
  }, [monthLogs]);

  // 3. 기분 변화 추이 (1일 ~ 말일)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const moodTrend = useMemo(() => {
    return daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = monthLogs.find(l => l.date === dateStr);
      return {
        date,
        dayNum: format(date, 'd'),
        mood: log?.mood || null
      };
    });
  }, [daysInMonth, monthLogs]);

  // 4. 요일별 주된 기분
  const weekdayMoods = useMemo(() => {
    const stats = Array.from({ length: 7 }, () => ({}));
    monthLogs.forEach(log => {
      if (!log.mood) return;
      const dayIdx = getDay(new Date(log.date));
      stats[dayIdx][log.mood] = (stats[dayIdx][log.mood] || 0) + 1;
    });
    
    return stats.map((moodCounts, idx) => {
      let topMood = null;
      let maxCount = 0;
      Object.entries(moodCounts).forEach(([mood, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topMood = mood;
        }
      });
      return { dayName: DAYS[idx], topMood, maxCount };
    });
  }, [monthLogs]);

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> 월간 통계
        </h1>
        <div className="flex items-center gap-3 bg-card p-1.5 rounded-xl border border-border shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold w-24 text-center">{format(currentMonth, 'yyyy년 M월')}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl space-y-6 pb-10">
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 평균 완수율</p>
            <div className="flex items-end gap-2 mt-3">
              <h2 className="text-4xl font-bold text-primary">{completionStats.rate}%</h2>
              <p className="text-sm text-muted-foreground mb-1">({completionStats.completed}/{completionStats.total}개)</p>
            </div>
            <div className="h-2 w-full bg-muted rounded-full mt-5 overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completionStats.rate}%` }} /></div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5"><Smile className="w-4 h-4 text-amber-500" /> 이번 달 주된 기분</p>
            <div className="flex items-center gap-4 mt-3"><span className="text-5xl drop-shadow-sm">{mostFrequentMood || '😶'}</span><p className="text-sm text-muted-foreground leading-relaxed">{mostFrequentMood ? '이번 달엔 이 기분을 가장 많이 느꼈어요!' : '아직 기록된 기분이 없어요.'}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> 기분 변화 추이</h3>
          <div className="flex gap-2.5 overflow-x-auto pb-4 pt-2 px-1" style={{ scrollbarWidth: 'thin' }}>
            {moodTrend.map((item, i) => (<div key={i} className="flex flex-col items-center gap-2.5 min-w-[36px]"><div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all", item.mood ? "bg-primary/10 border border-primary/20 shadow-sm" : "bg-muted/30 border border-border/50")}>{item.mood || <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />}</div><span className={cn("text-[11px] font-medium", item.mood ? "text-foreground" : "text-muted-foreground/50")}>{item.dayNum}</span></div>))}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> 요일별 가장 많이 느낀 기분</h3>
          <div className="grid grid-cols-7 gap-3">
            {weekdayMoods.map((day, i) => (<div key={i} className={cn("flex flex-col items-center justify-center p-4 rounded-xl border transition-colors", day.topMood ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50")}><span className={cn("text-sm font-medium mb-3", i === 0 ? "text-destructive/80" : i === 6 ? "text-primary/80" : "text-foreground")}>{day.dayName}</span><div className="text-3xl mb-2 drop-shadow-sm">{day.topMood || '😶'}</div><span className="text-[10px] text-muted-foreground font-medium">{day.maxCount > 0 ? `${day.maxCount}번` : '기록 없음'}</span></div>))}
          </div>
        </div>
      </div>
    </div>
  );
}