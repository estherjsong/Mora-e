const KEYS = {
  tasks: 'mora_v1_tasks',
  routines: 'mora_v1_routines',
  dailyLogs: 'mora_v1_daily_logs',
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getAllTasks() {
  return read(KEYS.tasks);
}

export function setAllTasks(rows) {
  write(KEYS.tasks, rows);
}

export function getAllRoutines() {
  return read(KEYS.routines);
}

export function setAllRoutines(rows) {
  write(KEYS.routines, rows);
}

export function getAllDailyLogs() {
  return read(KEYS.dailyLogs);
}

export function setAllDailyLogs(rows) {
  write(KEYS.dailyLogs, rows);
}

export { nextId };
