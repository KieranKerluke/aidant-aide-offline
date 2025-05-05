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
    value: MedicalReportType1 | MedicalReportType2;
    indexes: { 'by-session': number };
  };
  familyReports: {
    key: number;
    value: FamilyReportType1 | FamilyReportType2;
    indexes: { 'by-session': number };
  };
}

// Define our models
export interface Patient {
  id?: number;
  name: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  dateOfBirth: string; // ISO string
  age?: number;
  maritalStatus?: string;
  numberOfChildren?: string;
  cityOfResidence?: string;
  personalPhone?: string;
  illnessDuration?: string;
  treatingDoctor?: string;
  contactInfo?: string; // Keeping for backward compatibility
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

export interface MedicalReportType1 {
  id?: number;
  sessionId: number;
  date: string;
  duration: string;
  location: string;
  participantName: string;
  patientSituation: string;
  familySituation: string;
  observations: string;
  conclusion: string;
  signature: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalReportType2 {
  id?: number;
  sessionId: number;
  date: string;
  duration: string;
  location: string;
  participantName: string;
  sessionObjective: string;
  topics: {
    withPatient: string;
    withFamily: string;
  };
  generalObservations: string;
  conclusion: string;
  signature: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyReportType1 {
  id?: number;
  sessionId: number;
  date: string;
  duration: string;
  location: string;
  participantName: string;
  patientSituation: string;
  familySituation: string;
  observations: string;
  conclusion: string;
  signature: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyReportType2 {
  id?: number;
  sessionId: number;
  date: string;
  duration: string;
  location: string;
  participantName: string;
  sessionObjective: string;
  topics: {
    withPatient: string;
    withFamily: string;
  };
  generalObservations: string;
  conclusion: string;
  signature: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id?: number;
  description: string;
  dueDate: string; // ISO string
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  patientId?: number; // Optional - can be associated with a patient
  reminderAt?: string; // ISO string for reminder date/time
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

// Session CRUD operations
export async function createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
  const db = await getDB();
  const now = new Date().toISOString();
  const newSession: Session = {
    ...session,
    createdAt: now,
    updatedAt: now,
  };
  
  const id = await db.add('sessions', newSession);
  return { ...newSession, id: id as number };
}

export async function getSession(id: number): Promise<Session | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

export async function getAllSessionsByPatient(patientId: number): Promise<Session[]> {
  const db = await getDB();
  const index = db.transaction('sessions').store.index('by-patient');
  return index.getAll(patientId);
}

export async function updateSession(session: Session): Promise<Session> {
  const db = await getDB();
  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  await db.put('sessions', updatedSession);
  return updatedSession;
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

// Medical Report CRUD operations
export async function createMedicalReport(report: Omit<MedicalReportType1 | MedicalReportType2, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalReportType1 | MedicalReportType2> {
  const db = await getDB();
  const now = new Date().toISOString();
  
  if ('patientSituation' in report) {
    const newReport: MedicalReportType1 = {
      ...report as MedicalReportType1,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.add('medicalReports', newReport);
    return { ...newReport, id: id as number };
  } else {
    const newReport: MedicalReportType2 = {
      ...report as MedicalReportType2,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.add('medicalReports', newReport);
    return { ...newReport, id: id as number };
  }
}

export async function getMedicalReport(id: number): Promise<MedicalReportType1 | MedicalReportType2 | undefined> {
  const db = await getDB();
  return db.get('medicalReports', id);
}

export async function getMedicalReportBySession(sessionId: number): Promise<MedicalReportType1 | MedicalReportType2 | undefined> {
  const db = await getDB();
  const index = db.transaction('medicalReports').store.index('by-session');
  const reports = await index.getAll(sessionId);
  return reports.length > 0 ? reports[0] : undefined;
}

export async function updateMedicalReport(report: MedicalReportType1 | MedicalReportType2): Promise<MedicalReportType1 | MedicalReportType2> {
  const db = await getDB();
  const updatedReport = {
    ...report,
    updatedAt: new Date().toISOString(),
  };
  await db.put('medicalReports', updatedReport);
  return updatedReport;
}

export async function deleteMedicalReport(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('medicalReports', id);
}

// Family Report CRUD operations
export async function createFamilyReport(report: Omit<FamilyReportType1 | FamilyReportType2, 'id' | 'createdAt' | 'updatedAt'>): Promise<FamilyReportType1 | FamilyReportType2> {
  const db = await getDB();
  const now = new Date().toISOString();
  
  if ('patientSituation' in report) {
    const newReport: FamilyReportType1 = {
      ...report as FamilyReportType1,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.add('familyReports', newReport);
    return { ...newReport, id: id as number };
  } else {
    const newReport: FamilyReportType2 = {
      ...report as FamilyReportType2,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.add('familyReports', newReport);
    return { ...newReport, id: id as number };
  }
}

export async function getFamilyReport(id: number): Promise<FamilyReportType1 | FamilyReportType2 | undefined> {
  const db = await getDB();
  return db.get('familyReports', id);
}

export async function getFamilyReportBySession(sessionId: number): Promise<FamilyReportType1 | FamilyReportType2 | undefined> {
  const db = await getDB();
  const index = db.transaction('familyReports').store.index('by-session');
  const reports = await index.getAll(sessionId);
  return reports.length > 0 ? reports[0] : undefined;
}

export async function updateFamilyReport(report: FamilyReportType1 | FamilyReportType2): Promise<FamilyReportType1 | FamilyReportType2> {
  const db = await getDB();
  const updatedReport = {
    ...report,
    updatedAt: new Date().toISOString(),
  };
  await db.put('familyReports', updatedReport);
  return updatedReport;
}

export async function deleteFamilyReport(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('familyReports', id);
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
