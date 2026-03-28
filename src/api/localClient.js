import {
  getAllTasks,
  setAllTasks,
  getAllRoutines,
  setAllRoutines,
  getAllDailyLogs,
  setAllDailyLogs,
  nextId,
} from '@/lib/localDb';

function sortByDateDesc(rows, field = 'date') {
  return [...rows].sort((a, b) => {
    const da = a[field] || '';
    const db = b[field] || '';
    return db.localeCompare(da);
  });
}

const Task = {
  list(sortKey, limit = 500) {
    let rows = getAllTasks();
    if (sortKey === '-date') {
      rows = sortByDateDesc(rows, 'date');
    }
    return rows.slice(0, limit);
  },

  async create(data) {
    const row = { id: nextId(), ...data };
    const rows = getAllTasks();
    rows.push(row);
    setAllTasks(rows);
    return row;
  },

  async update(id, data) {
    const rows = getAllTasks();
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) throw new Error(`Task not found: ${id}`);
    rows[i] = { ...rows[i], ...data };
    setAllTasks(rows);
    return rows[i];
  },

  async delete(id) {
    const rows = getAllTasks().filter((r) => r.id !== id);
    setAllTasks(rows);
  },

  async bulkCreate(items) {
    const rows = getAllTasks();
    for (const item of items) {
      rows.push({ id: nextId(), ...item });
    }
    setAllTasks(rows);
  },
};

const Routine = {
  list() {
    return getAllRoutines();
  },

  async create(data) {
    const row = { id: nextId(), ...data };
    const rows = getAllRoutines();
    rows.push(row);
    setAllRoutines(rows);
    return row;
  },

  async update(id, data) {
    const rows = getAllRoutines();
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) throw new Error(`Routine not found: ${id}`);
    rows[i] = { ...rows[i], ...data };
    setAllRoutines(rows);
    return rows[i];
  },

  async delete(id) {
    const rows = getAllRoutines().filter((r) => r.id !== id);
    setAllRoutines(rows);
  },
};

const DailyLog = {
  list(sortKey, limit = 100) {
    let rows = getAllDailyLogs();
    if (sortKey === '-date') {
      rows = sortByDateDesc(rows, 'date');
    }
    return rows.slice(0, limit);
  },

  async create(data) {
    const row = { id: nextId(), ...data };
    const rows = getAllDailyLogs();
    rows.push(row);
    setAllDailyLogs(rows);
    return row;
  },

  async update(id, data) {
    const rows = getAllDailyLogs();
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) throw new Error(`DailyLog not found: ${id}`);
    rows[i] = { ...rows[i], ...data };
    setAllDailyLogs(rows);
    return rows[i];
  },
};

/** Same shape as former Base44 client: app code uses `.entities.*` only. */
export const localClient = {
  entities: {
    Task,
    Routine,
    DailyLog,
  },
};
