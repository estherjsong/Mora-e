import {
  heuristicScheduleOptions,
  heuristicRescheduleOptions,
  heuristicDaySummary,
} from '@/lib/scheduleHeuristics';

async function invokeOpenAIJson(systemPrompt, userPrompt) {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key?.trim()) return null;

  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('[scheduleAI] OpenAI error:', res.status, err);
    return null;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    console.warn('[scheduleAI] Invalid JSON from model');
    return null;
  }
}

export async function generateScheduleOptions(tasks, routines, selectedDate, existingTasks) {
  const dayOfWeek = new Date(selectedDate).getDay();

  const dayRoutines = routines.filter((r) => r.days?.includes(dayOfWeek));
  const routineInfo =
    dayRoutines.map((r) => `${r.title}: ${r.start_time}~${r.end_time}`).join('\n') || '없음';

  const taskInfo = tasks
    .map((t) => {
      let info = t.title;
      if (t.estimated_minutes) info += ` (예상 ${t.estimated_minutes}분)`;
      if (t.start_time) info += ` (시작시간 ${t.start_time})`;
      if (t.memo) info += ` [메모: ${t.memo}]`;
      return info;
    })
    .join('\n');

  const previousTasksInfo =
    existingTasks.length > 0
      ? existingTasks.map((t) => `${t.title}: ${t.estimated_minutes || '?'}분`).join('\n')
      : '';

  const userPrompt = `당신은 일정 관리 AI입니다. 사용자의 태스크를 하루 시간표로 배치해주세요.

날짜: ${selectedDate}
요일: ${['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]}요일

고정 루틴 (이 시간은 비워둬야 합니다):
${routineInfo}

오늘 할 태스크:
${taskInfo}

${previousTasksInfo ? `이전 기록 참고:\n${previousTasksInfo}` : ''}

규칙:
1. 각 태스크의 예상 소요 시간을 맥락에 맞게 추정 (사용자가 입력하지 않은 경우)
2. 루틴 시간대는 반드시 피할 것
3. 맥락 고려 (가사/업무/취미 등)
4. 6:00~24:00 사이
5. 사용자가 시작시간을 지정한 태스크는 그 시간에 배치
6. 3개의 서로 다른 시간표 옵션 (options[0], options[1], options[2])

각 태스크 항목에 start_time, end_time, estimated_minutes 포함.
루틴 항목은 is_routine: true.

반드시 이 JSON 형식만 출력:
{"options":[[{"title":"","start_time":"HH:MM","end_time":"HH:MM","estimated_minutes":0,"memo":"","is_routine":false,"is_google_calendar":false}],[],[]]}`;

  const parsed = await invokeOpenAIJson(
    'You output only valid JSON matching the user instructions. Korean context.',
    userPrompt
  );

  if (parsed?.options?.length >= 3) {
    return parsed.options;
  }

  return heuristicScheduleOptions(tasks, routines, selectedDate, existingTasks);
}

export async function generateRescheduledOptions(
  tasks,
  completedTask,
  progress,
  routines,
  selectedDate
) {
  const dayOfWeek = new Date(selectedDate).getDay();
  const dayRoutines = routines.filter((r) => r.days?.includes(dayOfWeek));

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const taskInfo = tasks
    .map((t) => {
      let status = '';
      if (t.id === completedTask.id) status = ` (진행률: ${progress}%)`;
      else if (t.status === 'completed') status = ' (완료)';
      return `${t.title} ${t.start_time}~${t.end_time}${status}`;
    })
    .join('\n');

  const userPrompt = `사용자가 "${completedTask.title}" 태스크를 ${progress}% 진행했습니다.
현재 시간: ${currentTime}
남은 시간을 고려하여 나머지 일정을 재조정해주세요.

현재 시간표:
${taskInfo}

루틴 (고정):
${dayRoutines.map((r) => `${r.title}: ${r.start_time}~${r.end_time}`).join('\n') || '없음'}

완료된 태스크는 그대로 두고, 미완료 태스크들의 시간을 현재 시간 이후로 재배치.
3개의 옵션을 options 배열에 넣어주세요.

반드시 JSON만: {"options":[[],[],[]]}`;

  const parsed = await invokeOpenAIJson(
    'You output only valid JSON. Each inner array is a full day schedule row list with start_time, end_time, estimated_minutes, title, is_routine, status.',
    userPrompt
  );

  if (parsed?.options?.length >= 3) {
    return parsed.options;
  }

  return heuristicRescheduleOptions(
    tasks,
    completedTask,
    progress,
    routines,
    selectedDate
  );
}

export async function generateDaySummary(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed');
  const incomplete = tasks.filter((t) => t.status !== 'completed' && !t.is_routine);

  const userPrompt = `오늘 하루를 요약해주세요.

완료한 일:
${completed.map((t) => `- ${t.title}`).join('\n') || '없음'}

못 마친 일:
${incomplete.map((t) => `- ${t.title} (진행률: ${t.progress || 0}%)`).join('\n') || '없음'}

따뜻하고 응원하는 톤으로 2-3문장. 한국어.

JSON 형식: {"summary":"..."}`;

  const parsed = await invokeOpenAIJson(
    'You reply with JSON {"summary": string} only.',
    userPrompt
  );

  if (typeof parsed?.summary === 'string' && parsed.summary.trim()) {
    return parsed.summary.trim();
  }

  return heuristicDaySummary(tasks);
}
