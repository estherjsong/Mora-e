import { timeToMinutes, minutesToTime } from '@/lib/dateUtils';

function durationMinutes(start, end) {
  const a = timeToMinutes(start);
  const b = timeToMinutes(end);
  if (b <= a) return b + 24 * 60 - a;
  return b - a;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return !(aEnd <= bStart || aStart >= bEnd);
}

export function guessMinutesFromTitle(title, existingTasks) {
  const t = (title || '').trim();
  if (!t) return 60;
  const lower = t.toLowerCase();
  const withEst = (existingTasks || []).filter((x) => x.estimated_minutes && x.title);
  for (const x of withEst) {
    if (t.includes(x.title) || x.title.includes(t.slice(0, Math.min(4, t.length)))) {
      return x.estimated_minutes;
    }
  }
  if (/영화|movie|film|헤일메리|드라마/.test(lower)) return 150;
  if (/빨래|세탁/.test(lower)) return 60;
  if (/회의|미팅|수업|강의/.test(lower)) return 60;
  if (/보고서|제출|리포트/.test(lower)) return 45;
  if (/reflection|리딩|reading|에세이|글쓰기/.test(lower)) return 50;
  if (/편집|영상|촬영/.test(lower)) return 90;
  return 60;
}

function routineBlocksForDay(routines, dayOfWeek) {
  return routines
    .filter((r) => r.days?.includes(dayOfWeek))
    .map((r) => ({
      title: r.title,
      start_time: r.start_time,
      end_time: r.end_time,
      estimated_minutes: durationMinutes(r.start_time, r.end_time),
      is_routine: true,
      memo: '',
    }));
}

function mergeBusy(routineIntervals, extra = []) {
  const all = [...routineIntervals, ...extra].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const iv of all) {
    if (!merged.length || iv.start > merged[merged.length - 1].end) {
      merged.push({ ...iv });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
    }
  }
  return merged;
}

function findSlot(durationMins, busyMerged, dayStart, dayEnd) {
  for (let t = dayStart; t + durationMins <= dayEnd; t += 15) {
    const end = t + durationMins;
    const hit = busyMerged.some((b) => overlaps(t, end, b.start, b.end));
    if (!hit) return t;
  }
  return null;
}

function placeTasks(order, routineRows, dayStart, dayEnd, startBias = 0) {
  const busy = routineRows.map((r) => ({
    start: timeToMinutes(r.start_time),
    end: timeToMinutes(r.end_time),
  }));
  let merged = mergeBusy(busy);
  const out = [...routineRows.map((r) => ({ ...r }))];

  for (const task of order) {
    const dur = Math.max(15, task.estimated_minutes || 60);
    if (task.start_time && task.end_time && !task.is_routine) {
      out.push({
        title: task.title,
        start_time: task.start_time,
        end_time: task.end_time,
        estimated_minutes: dur,
        memo: task.memo || '',
        is_routine: false,
        is_google_calendar: !!task.is_google_calendar,
        status: task.status || 'pending',
      });
      const s = timeToMinutes(task.start_time);
      const e = timeToMinutes(task.end_time);
      merged = mergeBusy(merged, [{ start: s, end: e }]);
      continue;
    }
    if (task.is_routine) continue;

    const slot = findSlot(dur, merged, dayStart + startBias, dayEnd);
    if (slot === null) continue;
    const endSlot = slot + dur;
    out.push({
      title: task.title,
      start_time: minutesToTime(slot),
      end_time: minutesToTime(endSlot),
      estimated_minutes: dur,
      memo: task.memo || '',
      is_routine: false,
      is_google_calendar: !!task.is_google_calendar,
      status: task.status || 'pending',
    });
    merged = mergeBusy(merged, [{ start: slot, end: endSlot }]);
  }

  return out;
}

export function heuristicScheduleOptions(tasks, routines, selectedDate, existingTasks) {
  const dayOfWeek = new Date(selectedDate).getDay();
  const routineRows = routineBlocksForDay(routines, dayOfWeek);
  const workTasks = (tasks || [])
    .filter((t) => !t.is_routine && !t.is_google_calendar)
    .map((t) => ({
      ...t,
      estimated_minutes:
        t.estimated_minutes || guessMinutesFromTitle(t.title, existingTasks),
    }));

  const orders = [
    workTasks,
    [...workTasks].sort((a, b) => b.estimated_minutes - a.estimated_minutes),
    [...workTasks].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko')),
  ];

  const dayStart = 6 * 60;
  const dayEnd = 24 * 60;

  return [
    placeTasks(orders[0], routineRows, dayStart, dayEnd, 0),
    placeTasks(orders[1], routineRows, dayStart, dayEnd, 30),
    placeTasks(orders[2], routineRows, dayStart, dayEnd, 45),
  ];
}

export function heuristicRescheduleOptions(
  tasks,
  completedTask,
  progress,
  routines,
  selectedDate
) {
  const dayOfWeek = new Date(selectedDate).getDay();
  const routineRows = routineBlocksForDay(routines, dayOfWeek);
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const floor = Math.max(6 * 60, nowMins);
  const dayEnd = 24 * 60;

  const fixedSlots = routineRows.map((r) => ({
    start: timeToMinutes(r.start_time),
    end: timeToMinutes(r.end_time),
  }));

  const completedFixed = [];
  for (const t of tasks || []) {
    if (t.is_routine || t.is_google_calendar) continue;
    const done =
      t.status === 'completed' ||
      (completedTask && t.id === completedTask.id && progress >= 100);
    if (!done) continue;
    const s = timeToMinutes(t.start_time);
    const e = timeToMinutes(t.end_time);
    if (e > s) {
      completedFixed.push({ start: s, end: e });
    }
  }

  const busyBase = mergeBusy([...fixedSlots, ...completedFixed]);

  const movable = [];
  for (const t of tasks || []) {
    if (t.is_routine || t.is_google_calendar) continue;
    const done =
      t.status === 'completed' ||
      (completedTask && t.id === completedTask.id && progress >= 100);
    if (done) continue;

    let est = t.estimated_minutes || guessMinutesFromTitle(t.title, []);
    if (completedTask && t.id === completedTask.id) {
      est = Math.max(15, Math.round((est * (100 - progress)) / 100));
    }

    movable.push({
      title: t.title,
      estimated_minutes: est,
      memo: t.memo || '',
      status: t.status || 'pending',
    });
  }

  const orderA = movable;
  const orderB = [...movable].sort((a, b) => b.estimated_minutes - a.estimated_minutes);
  const orderC = [...movable].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko'));

  function buildOption(order, bias) {
    let merged = mergeBusy(busyBase);
    const out = [
      ...routineRows.map((r) => ({ ...r })),
      ...(tasks || [])
        .filter(
          (t) =>
            !t.is_routine &&
            !t.is_google_calendar &&
            (t.status === 'completed' ||
              (completedTask && t.id === completedTask.id && progress >= 100))
        )
        .map((t) => ({
          title: t.title,
          start_time: t.start_time,
          end_time: t.end_time,
          estimated_minutes: t.estimated_minutes,
          memo: t.memo || '',
          is_routine: false,
          status: 'completed',
        })),
    ];

    let cursor = floor + bias;
    for (const task of order) {
      const dur = Math.max(15, task.estimated_minutes || 60);
      const slot = findSlot(dur, merged, cursor, dayEnd);
      if (slot === null) continue;
      const endSlot = slot + dur;
      out.push({
        title: task.title,
        start_time: minutesToTime(slot),
        end_time: minutesToTime(endSlot),
        estimated_minutes: dur,
        memo: task.memo || '',
        is_routine: false,
        status: task.status || 'pending',
      });
      merged = mergeBusy(merged, [{ start: slot, end: endSlot }]);
      cursor = endSlot + 10;
    }
    return out;
  }

  return [buildOption(orderA, 0), buildOption(orderB, 15), buildOption(orderC, 30)];
}

export function heuristicDaySummary(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed' && !t.is_routine);
  const incomplete = tasks.filter(
    (t) => t.status !== 'completed' && !t.is_routine && !t.is_google_calendar
  );
  const lines = [];
  lines.push('오늘 하루를 정리하면,');
  if (completed.length) {
    lines.push(`완료한 일은 ${completed.length}가지예요: ${completed.map((t) => t.title).join(', ')}.`);
  } else {
    lines.push('완료로 표시한 일은 아직 없어요.');
  }
  if (incomplete.length) {
    lines.push(`아직 남은 일은 ${incomplete.length}가지예요: ${incomplete.map((t) => t.title).join(', ')}.`);
  } else {
    lines.push('남은 할 일이 없거나 모두 처리하셨네요.');
  }
  lines.push('내일도 좋은 하루 보내세요!');
  return lines.join(' ');
}
