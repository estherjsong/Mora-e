import {
  heuristicScheduleOptions,
  heuristicRescheduleOptions,
  heuristicDaySummary,
} from '@/lib/scheduleHeuristics';

/* =========================
   🧠 Gemini 호출 (structured output)
========================= */
async function invokeGeminiJson(systemPrompt, userPrompt, schema) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key?.trim()) return null;

  const model = 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        response_mime_type: 'application/json',
        response_schema: schema,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('[Gemini error]', res.status, err);
    return null;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('[Invalid JSON]', e, text);
    return null;
  }
}

/* =========================
   📦 Schema 정의
========================= */
const scheduleSchema = {
  type: 'object',
  properties: {
    options: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            start_time: { type: 'string' },
            end_time: { type: 'string' },
            estimated_minutes: { type: 'number' },
            memo: { type: 'string' },
            is_routine: { type: 'boolean' },
            is_google_calendar: { type: 'boolean' },
          },
          required: ['title', 'start_time', 'end_time'],
        },
      },
    },
  },
  required: ['options'],
};

const rescheduleSchema = {
  type: 'object',
  properties: {
    options: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            start_time: { type: 'string' },
            end_time: { type: 'string' },
            estimated_minutes: { type: 'number' },
            is_routine: { type: 'boolean' },
            status: { type: 'string' },
          },
          required: ['title', 'start_time', 'end_time'],
        },
      },
    },
  },
  required: ['options'],
};

const summarySchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
  },
  required: ['summary'],
};

/* =========================
   🛠️ 시간 처리 유틸
========================= */
function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function toTime(m) {
  const h = String(Math.floor(m / 60)).padStart(2, '0');
  const min = String(m % 60).padStart(2, '0');
  return `${h}:${min}`;
}

/* =========================
   🚨 겹침 제거 + 정렬 + 보정
========================= */
function normalizeSchedule(option) {
  if (!Array.isArray(option)) return [];

  // 1. 정렬
  const sorted = [...option].sort(
    (a, b) => toMinutes(a.start_time) - toMinutes(b.start_time)
  );

  const result = [];
  let currentEnd = 360; // 06:00

  for (const task of sorted) {
    let start = Math.max(toMinutes(task.start_time), currentEnd);
    let end = toMinutes(task.end_time);

    // duration 없으면 계산
    if (!task.estimated_minutes) {
      task.estimated_minutes = Math.max(end - start, 30);
    }

    // end 보정
    end = start + task.estimated_minutes;

    // 하루 범위 제한
    if (start < 360) start = 360;
    if (end > 1440) end = 1440;

    if (end <= start) continue;

    result.push({
      ...task,
      start_time: toTime(start),
      end_time: toTime(end),
    });

    currentEnd = end;
  }

  return result;
}

/* =========================
   📅 일정 생성
========================= */
export async function generateScheduleOptions(
  tasks,
  routines,
  selectedDate,
  existingTasks
) {
  const dayOfWeek = new Date(selectedDate).getDay();

  const dayRoutines = routines.filter((r) =>
    r.days?.includes(dayOfWeek)
  );

  const routineInfo =
    dayRoutines.map((r) => `${r.title}: ${r.start_time}~${r.end_time}`).join('\n') || '없음';

  const taskInfo = tasks
    .map((t) => {
      let info = t.title;
      if (t.estimated_minutes) info += ` (${t.estimated_minutes}분)`;
      if (t.start_time) info += ` (시작 ${t.start_time})`;
      return info;
    })
    .join('\n');

  const userPrompt = `
하루 일정 생성.

[루틴]
${routineInfo}

[태스크]
${taskInfo}

규칙:
- 시간 겹치면 안됨
- 06:00~24:00
- 루틴 피하기
- 3개의 옵션 생성
`;

  const parsed = await invokeGeminiJson(
    'Return strict JSON.',
    userPrompt,
    scheduleSchema
  );

  if (parsed?.options?.length >= 3) {
    return parsed.options.map(normalizeSchedule);
  }

  return heuristicScheduleOptions(tasks, routines, selectedDate, existingTasks);
}

/* =========================
   🔁 재스케줄링
========================= */
export async function generateRescheduledOptions(
  tasks,
  completedTask,
  progress,
  routines,
  selectedDate
) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const taskInfo = tasks
    .map((t) => `${t.title} ${t.start_time}~${t.end_time}`)
    .join('\n');

  const userPrompt = `
현재시간: ${currentTime}

${taskInfo}

남은 일정 재배치.
겹치지 않게.
3개 옵션 생성.
`;

  const parsed = await invokeGeminiJson(
    'Reschedule tasks.',
    userPrompt,
    rescheduleSchema
  );

  if (parsed?.options?.length >= 3) {
    return parsed.options.map(normalizeSchedule);
  }

  return heuristicRescheduleOptions(
    tasks,
    completedTask,
    progress,
    routines,
    selectedDate
  );
}

/* =========================
   📝 하루 요약
========================= */
export async function generateDaySummary(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed');

  const userPrompt = `
완료:
${completed.map((t) => t.title).join('\n') || '없음'}

짧은 요약 작성
`;

  const parsed = await invokeGeminiJson(
    'Return JSON summary.',
    userPrompt,
    summarySchema
  );

  if (parsed?.summary) return parsed.summary;

  return heuristicDaySummary(tasks);
}