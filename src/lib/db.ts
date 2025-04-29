
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define our database schema
interface PairAidantDB extends DBSchema {
  patients: {
    key: number;
    value: Patient;
    indexes: { 'by-name': string };
  };
  sessions: {
    key: number;
    value: Session;
    indexes: { 'by-patient': number; 'by-date': Date };
  };
  tasks: {
    key: number;
    value: Task;
    indexes: { 'by-due-date': Date; 'by-status': string; 'by-patient': number };
  };
  medicalReports: {
    key: number;
    value: MedicalReport;
    indexes: { 'by-session': number };
  };
  familyReports: {
    key: number;
    value: FamilyReport;
    indexes: { 'by-session': number };
  };
}

// Define our models
export interface Patient {
  id?: number;
  name: string;
  dateOfBirth: string; // ISO string
  contactInfo: string;
  tags: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Session {
  id?: number;
  patientId: number;
  date: string; // ISO string
  duration: number; // in minutes
  location: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface MedicalReport {
  id?: number;
  sessionId: number;
  objectives: string;
  example: string;
  topics: string;
  emotionalState: {
    beginning: string;
    end: string;
  };
  expressionAbility: string;
  interventionReactions: string;
  observedProgress: string;
  obstacles: {
    emotional: string;
    familyCommunication: string;
    externalFactors: string;
  };
  recommendations: {
    patient: string;
    family: string;
  };
  conclusion: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface FamilyReport {
  id?: number;
  sessionId: number;
  objective: string;
  topicsWithPatient: string;
  topicsWithFamily: string;
  generalObservations: string;
  conclusion: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Task {
  id?: number;
  description: string;
  dueDate: string; // ISO string
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  patientId?: number; // Optional - can be associated with a patient
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Database version
const DB_VERSION = 1;
const DB_NAME = 'pair-aidant-manager';

// DB singleton instance
let dbPromise: Promise<IDBPDatabase<PairAidantDB>> | null = null;

// Initialize the database
export function getDB(): Promise<IDBPDatabase<PairAidantDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PairAidantDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
          patientStore.createIndex('by-name', 'name');
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionStore.createIndex('by-patient', 'patientId');
          sessionStore.createIndex('by-date', 'date');
        }

        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('by-due-date', 'dueDate');
          taskStore.createIndex('by-status', 'status');
          taskStore.createIndex('by-patient', 'patientId');
        }

        if (!db.objectStoreNames.contains('medicalReports')) {
          const medicalReportStore = db.createObjectStore('medicalReports', { keyPath: 'id', autoIncrement: true });
          medicalReportStore.createIndex('by-session', 'sessionId');
        }

        if (!db.objectStoreNames.contains('familyReports')) {
          const familyReportStore = db.createObjectStore('familyReports', { keyPath: 'id', autoIncrement: true });
          familyReportStore.createIndex('by-session', 'sessionId');
        }
      }
    });
  }
  return dbPromise;
}

// Patient CRUD operations
export async function createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
  const db = await getDB();
  const now = new Date().toISOString();
  const newPatient: Patient = {
    ...patient,
    createdAt: now,
    updatedAt: now,
  };
  
  const id = await db.add('patients', newPatient);
  return { ...newPatient, id: id as number };
}

export async function getPatient(id: number): Promise<Patient | undefined> {
  const db = await getDB();
  return db.get('patients', id);
}

export async function getAllPatients(): Promise<Patient[]> {
  const db = await getDB();
  return db.getAll('patients');
}

export async function updatePatient(patient: Patient): Promise<Patient> {
  const db = await getDB();
  const updatedPatient = {
    ...patient,
    updatedAt: new Date().toISOString(),
  };
  await db.put('patients', updatedPatient);
  return updatedPatient;
}

export async function deletePatient(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('patients', id);
}

// Task CRUD operations
export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const db = await getDB();
  const now = new Date().toISOString();
  const newTask: Task = {
    ...task,
    createdAt: now,
    updatedAt: now,
  };
  
  const id = await db.add('tasks', newTask);
  return { ...newTask, id: id as number };
}

export async function getTask(id: number): Promise<Task | undefined> {
  const db = await getDB();
  return db.get('tasks', id);
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function updateTask(task: Task): Promise<Task> {
  const db = await getDB();
  const updatedTask = {
    ...task,
    updatedAt: new Date().toISOString(),
  };
  await db.put('tasks', updatedTask);
  return updatedTask;
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('tasks', id);
}

// Get today's sessions
export async function getTodaySessions(): Promise<Session[]> {
  const db = await getDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayISOStart = today.toISOString();
  const todayISOEnd = tomorrow.toISOString();
  
  const index = db.transaction('sessions').store.index('by-date');
  const sessions = await index.getAll(IDBKeyRange.bound(todayISOStart, todayISOEnd));
  
  return sessions;
}

// Get pending tasks
export async function getPendingTasks(): Promise<Task[]> {
  const db = await getDB();
  const index = db.transaction('tasks').store.index('by-status');
  return index.getAll('pending');
}

// Filter tasks by patient
export async function getTasksByPatient(patientId: number): Promise<Task[]> {
  const db = await getDB();
  const index = db.transaction('tasks').store.index('by-patient');
  return index.getAll(patientId);
}

// Get tasks by status
export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  const db = await getDB();
  const index = db.transaction('tasks').store.index('by-status');
  return index.getAll(status);
}
