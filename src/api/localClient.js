import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as limitFn,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Task = {
  async list(sortKey, limit = 500) {
    let q = collection(db, 'tasks');
    if (sortKey === '-date') {
      q = query(q, orderBy('date', 'desc'), limitFn(limit));
    } else {
      q = query(q, limitFn(limit));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async create(data) {
    const docRef = doc(collection(db, 'tasks'));
    const row = { id: docRef.id, ...data };
    await setDoc(docRef, row);
    return row;
  },

  async update(id, data) {
    const docRef = doc(db, 'tasks', id);
    await updateDoc(docRef, data);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id, ...snap.data() } : { id, ...data };
  },

  async delete(id) {
    const docRef = doc(db, 'tasks', id);
    await deleteDoc(docRef);
  },

  async bulkCreate(items) {
    const batch = writeBatch(db);
    for (const item of items) {
      const docRef = doc(collection(db, 'tasks'));
      batch.set(docRef, { id: docRef.id, ...item });
    }
    await batch.commit();
  },
};

const Routine = {
  async list() {
    const snapshot = await getDocs(collection(db, 'routines'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async create(data) {
    const docRef = doc(collection(db, 'routines'));
    const row = { id: docRef.id, ...data };
    await setDoc(docRef, row);
    return row;
  },

  async update(id, data) {
    const docRef = doc(db, 'routines', id);
    await updateDoc(docRef, data);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id, ...snap.data() } : { id, ...data };
  },

  async delete(id) {
    const docRef = doc(db, 'routines', id);
    await deleteDoc(docRef);
  },
};

const DailyLog = {
  async list(sortKey, limit = 100) {
    let q = collection(db, 'dailyLogs');
    if (sortKey === '-date') {
      q = query(q, orderBy('date', 'desc'), limitFn(limit));
    } else {
      q = query(q, limitFn(limit));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async create(data) {
    const docRef = doc(collection(db, 'dailyLogs'));
    const row = { id: docRef.id, ...data };
    await setDoc(docRef, row);
    return row;
  },

  async update(id, data) {
    const docRef = doc(db, 'dailyLogs', id);
    await updateDoc(docRef, data);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id, ...snap.data() } : { id, ...data };
  },
};

export const localClient = {
  entities: {
    Task,
    Routine,
    DailyLog,
  },
};
