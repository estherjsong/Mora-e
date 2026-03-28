import { base44 } from '@/api/base44Client';

export async function generateScheduleOptions(tasks, routines, selectedDate, existingTasks) {
  const dayOfWeek = new Date(selectedDate).getDay();
  
  const dayRoutines = routines.filter(r => r.days?.includes(dayOfWeek));

  const routineInfo = dayRoutines.map(r => 
    `${r.title}: ${r.start_time}~${r.end_time}`
  ).join('\n') || '없음';

  const taskInfo = tasks.map(t => {
    let info = t.title;
    if (t.estimated_minutes) info += ` (예상 ${t.estimated_minutes}분)`;
    if (t.start_time) info += ` (시작시간 ${t.start_time})`;
    if (t.memo) info += ` [메모: ${t.memo}]`;
    return info;
  }).join('\n');

  const previousTasksInfo = existingTasks.length > 0
    ? existingTasks.map(t => `${t.title}: ${t.estimated_minutes || '?'}분`).join('\n')
    : '';

  const prompt = `당신은 일정 관리 AI입니다. 사용자의 태스크를 하루 시간표로 배치해주세요.

날짜: ${selectedDate}
요일: ${['일','월','화','수','목','금','토'][dayOfWeek]}요일

고정 루틴 (이 시간은 비워둬야 합니다):
${routineInfo}

오늘 할 태스크:
${taskInfo}

${previousTasksInfo ? `이전 기록 참고:\n${previousTasksInfo}` : ''}

규칙:
1. 각 태스크의 예상 소요 시간을 맥락에 맞게 추정해주세요 (사용자가 입력하지 않은 경우)
2. 루틴 시간대는 반드시 피해서 배치하세요
3. 시간 배치 시 맥락을 고려하세요:
   - 빨래 같은 가사는 이른 저녁에
   - 업무/보고서는 근무시간에
   - 영화/취미는 저녁~밤에
   - 운동은 아침이나 저녁에
4. 6:00~24:00 사이에 배치하세요
5. 사용자가 시작시간을 지정한 태스크는 그 시간에 배치하세요
6. 3개의 서로 다른 시간표 옵션을 만들어주세요 (배치 순서나 시간대를 조금씩 다르게)

각 옵션의 태스크에는 반드시 start_time, end_time, estimated_minutes를 포함해주세요.
루틴도 시간표에 포함시켜주되 is_routine: true로 표시해주세요.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
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
              }
            }
          }
        }
      }
    }
  });

  return result.options || [];
}

export async function generateRescheduledOptions(tasks, completedTask, progress, routines, selectedDate) {
  const dayOfWeek = new Date(selectedDate).getDay();
  const dayRoutines = routines.filter(r => r.days?.includes(dayOfWeek));

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const taskInfo = tasks.map(t => {
    let status = '';
    if (t.id === completedTask.id) status = ` (진행률: ${progress}%)`;
    else if (t.status === 'completed') status = ' (완료)';
    return `${t.title} ${t.start_time}~${t.end_time}${status}`;
  }).join('\n');

  const prompt = `사용자가 "${completedTask.title}" 태스크를 ${progress}% 진행했습니다.
현재 시간: ${currentTime}
남은 시간을 고려하여 나머지 일정을 재조정해주세요.

현재 시간표:
${taskInfo}

루틴 (고정):
${dayRoutines.map(r => `${r.title}: ${r.start_time}~${r.end_time}`).join('\n') || '없음'}

완료된 태스크는 그대로 두고, 미완료 태스크들의 시간을 현재 시간 이후로 재배치해주세요.
3개의 옵션을 만들어주세요.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
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
                status: { type: 'string' },
              }
            }
          }
        }
      }
    }
  });

  return result.options || [];
}

export async function generateDaySummary(tasks) {
  const completed = tasks.filter(t => t.status === 'completed');
  const incomplete = tasks.filter(t => t.status !== 'completed' && !t.is_routine);

  const prompt = `오늘 하루를 요약해주세요.

완료한 일:
${completed.map(t => `- ${t.title}`).join('\n') || '없음'}

못 마친 일:
${incomplete.map(t => `- ${t.title} (진행률: ${t.progress || 0}%)`).join('\n') || '없음'}

따뜻하고 응원하는 톤으로 2-3문장으로 요약해주세요. 한국어로 작성해주세요.`;

  const result = await base44.integrations.Core.InvokeLLM({ prompt });
  return result;
}