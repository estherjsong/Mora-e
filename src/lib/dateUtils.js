import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, isToday, isBefore, isAfter, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatDate = (date) => format(date, 'yyyy-MM-dd');
export const formatDisplayDate = (date) => format(date, 'M월 d일 (EEE)', { locale: ko });
export const formatMonth = (date) => format(date, 'yyyy년 M월', { locale: ko });

export const getCalendarDays = (currentMonth) => {
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = [];
  let day = start;
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
};

export const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

export const isFutureOrToday = (date) => !isPastDate(date);

export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export const DAY_LABELS_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export const MOOD_OPTIONS = [
  { emoji: '😊', label: '좋았어' },
  { emoji: '😌', label: '평온했어' },
  { emoji: '😤', label: '힘들었어' },
  { emoji: '😢', label: '슬펐어' },
  { emoji: '🔥', label: '열정적' },
  { emoji: '😴', label: '피곤했어' },
];

export const ROUTINE_COLORS = [
  'indigo', 'purple', 'emerald', 'amber', 'rose', 'sky', 'teal', 'pink'
];

export { isSameDay, isSameMonth, isToday, isBefore, isAfter, parseISO, format };