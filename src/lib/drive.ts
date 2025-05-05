import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { oauth2Client } from './auth';

// Initialize the Drive API with API key
const drive = google.drive({ 
  version: 'v3', 
  auth: oauth2Client,
  params: {
    key: import.meta.env.VITE_GOOGLE_API_KEY
  }
});

// Database folder name
const DB_FOLDER_NAME = 'PairAidantDB';

// File names for different collections
const COLLECTIONS = {
  patients: 'patients.json',
  sessions: 'sessions.json',
  medicalReports: 'medicalReports.json',
  familyReports: 'familyReports.json',
  tasks: 'tasks.json'
};

// Type definitions for collections
interface Patient {
  id: number;
  name: string;
  // Add other patient fields
}

interface Session {
  id: number;
  patientId: number;
  date: string;
  // Add other session fields
}

interface MedicalReport {
  id: number;
  sessionId: number;
  type: 'type1' | 'type2';
  // Add other medical report fields
}

interface FamilyReport {
  id: number;
  sessionId: number;
  type: 'type1' | 'type2';
  // Add other family report fields
}

interface Task {
  id: number;
  title: string;
  completed: boolean;
  // Add other task fields
}

// Get or create the database folder
async function getOrCreateDBFolder(): Promise<string> {
  try {
    // Search for the folder
    const response = await drive.files.list({
      q: `name='${DB_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create the folder if it doesn't exist
    const folder = await drive.files.create({
      requestBody: {
        name: DB_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    return folder.data.id!;
  } catch (error) {
    console.error('Error getting/creating DB folder:', error);
    throw error;
  }
}

// Get or create a collection file
async function getOrCreateCollectionFile(folderId: string, fileName: string): Promise<string> {
  try {
    // Search for the file
    const response = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create the file if it doesn't exist
    const file = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
      },
      fields: 'id',
    });

    // Initialize with empty array
    await drive.files.update({
      fileId: file.data.id!,
      media: {
        mimeType: 'application/json',
        body: JSON.stringify([]),
      },
    });

    return file.data.id!;
  } catch (error) {
    console.error(`Error getting/creating collection file ${fileName}:`, error);
    throw error;
  }
}

// Read a collection
async function readCollection<T>(fileId: string): Promise<T[]> {
  try {
    const response = await drive.files.get({
      fileId,
      alt: 'media',
    });
    return response.data as T[];
  } catch (error) {
    console.error('Error reading collection:', error);
    throw error;
  }
}

// Write to a collection
async function writeCollection<T>(fileId: string, data: T[]): Promise<void> {
  try {
    await drive.files.update({
      fileId,
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(data),
      },
    });
  } catch (error) {
    console.error('Error writing to collection:', error);
    throw error;
  }
}

// Initialize the database
export async function initializeDB() {
  try {
    const folderId = await getOrCreateDBFolder();
    const fileIds: Record<string, string> = {};

    // Create all collection files
    for (const [collection, fileName] of Object.entries(COLLECTIONS)) {
      fileIds[collection] = await getOrCreateCollectionFile(folderId, fileName);
    }

    return fileIds;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// CRUD operations for patients
export async function createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
  const fileIds = await initializeDB();
  const patients = await readCollection<Patient>(fileIds.patients);
  const newPatient = { ...patient, id: patients.length + 1 };
  patients.push(newPatient);
  await writeCollection(fileIds.patients, patients);
  return newPatient;
}

export async function getPatient(id: number): Promise<Patient | undefined> {
  const fileIds = await initializeDB();
  const patients = await readCollection<Patient>(fileIds.patients);
  return patients.find(p => p.id === id);
}

export async function updatePatient(patient: Patient): Promise<Patient> {
  const fileIds = await initializeDB();
  const patients = await readCollection<Patient>(fileIds.patients);
  const index = patients.findIndex(p => p.id === patient.id);
  if (index !== -1) {
    patients[index] = patient;
    await writeCollection(fileIds.patients, patients);
    return patient;
  }
  throw new Error('Patient not found');
}

export async function deletePatient(id: number): Promise<void> {
  const fileIds = await initializeDB();
  const patients = await readCollection<Patient>(fileIds.patients);
  const filteredPatients = patients.filter(p => p.id !== id);
  await writeCollection(fileIds.patients, filteredPatients);
}

// CRUD operations for sessions
export async function createSession(session: Omit<Session, 'id'>): Promise<Session> {
  const fileIds = await initializeDB();
  const sessions = await readCollection<Session>(fileIds.sessions);
  const newSession = { ...session, id: sessions.length + 1 };
  sessions.push(newSession);
  await writeCollection(fileIds.sessions, sessions);
  return newSession;
}

export async function getSession(id: number): Promise<Session | undefined> {
  const fileIds = await initializeDB();
  const sessions = await readCollection<Session>(fileIds.sessions);
  return sessions.find(s => s.id === id);
}

export async function updateSession(session: Session): Promise<Session> {
  const fileIds = await initializeDB();
  const sessions = await readCollection<Session>(fileIds.sessions);
  const index = sessions.findIndex(s => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
    await writeCollection(fileIds.sessions, sessions);
    return session;
  }
  throw new Error('Session not found');
}

export async function deleteSession(id: number): Promise<void> {
  const fileIds = await initializeDB();
  const sessions = await readCollection<Session>(fileIds.sessions);
  const filteredSessions = sessions.filter(s => s.id !== id);
  await writeCollection(fileIds.sessions, filteredSessions);
}

// CRUD operations for medical reports
export async function createMedicalReport(report: Omit<MedicalReport, 'id'>): Promise<MedicalReport> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReport>(fileIds.medicalReports);
  const newReport = { ...report, id: reports.length + 1 };
  reports.push(newReport);
  await writeCollection(fileIds.medicalReports, reports);
  return newReport;
}

export async function getMedicalReport(id: number): Promise<MedicalReport | undefined> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReport>(fileIds.medicalReports);
  return reports.find(r => r.id === id);
}

export async function updateMedicalReport(report: MedicalReport): Promise<MedicalReport> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReport>(fileIds.medicalReports);
  const index = reports.findIndex(r => r.id === report.id);
  if (index !== -1) {
    reports[index] = report;
    await writeCollection(fileIds.medicalReports, reports);
    return report;
  }
  throw new Error('Medical report not found');
}

export async function deleteMedicalReport(id: number): Promise<void> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReport>(fileIds.medicalReports);
  const filteredReports = reports.filter(r => r.id !== id);
  await writeCollection(fileIds.medicalReports, filteredReports);
}

// CRUD operations for family reports
export async function createFamilyReport(report: Omit<FamilyReport, 'id'>): Promise<FamilyReport> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReport>(fileIds.familyReports);
  const newReport = { ...report, id: reports.length + 1 };
  reports.push(newReport);
  await writeCollection(fileIds.familyReports, reports);
  return newReport;
}

export async function getFamilyReport(id: number): Promise<FamilyReport | undefined> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReport>(fileIds.familyReports);
  return reports.find(r => r.id === id);
}

export async function updateFamilyReport(report: FamilyReport): Promise<FamilyReport> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReport>(fileIds.familyReports);
  const index = reports.findIndex(r => r.id === report.id);
  if (index !== -1) {
    reports[index] = report;
    await writeCollection(fileIds.familyReports, reports);
    return report;
  }
  throw new Error('Family report not found');
}

export async function deleteFamilyReport(id: number): Promise<void> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReport>(fileIds.familyReports);
  const filteredReports = reports.filter(r => r.id !== id);
  await writeCollection(fileIds.familyReports, filteredReports);
}

// CRUD operations for tasks
export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const fileIds = await initializeDB();
  const tasks = await readCollection<Task>(fileIds.tasks);
  const newTask = { ...task, id: tasks.length + 1 };
  tasks.push(newTask);
  await writeCollection(fileIds.tasks, tasks);
  return newTask;
}

export async function getTask(id: number): Promise<Task | undefined> {
  const fileIds = await initializeDB();
  const tasks = await readCollection<Task>(fileIds.tasks);
  return tasks.find(t => t.id === id);
}

export async function updateTask(task: Task): Promise<Task> {
  const fileIds = await initializeDB();
  const tasks = await readCollection<Task>(fileIds.tasks);
  const index = tasks.findIndex(t => t.id === task.id);
  if (index !== -1) {
    tasks[index] = task;
    await writeCollection(fileIds.tasks, tasks);
    return task;
  }
  throw new Error('Task not found');
}

export async function deleteTask(id: number): Promise<void> {
  const fileIds = await initializeDB();
  const tasks = await readCollection<Task>(fileIds.tasks);
  const filteredTasks = tasks.filter(t => t.id !== id);
  await writeCollection(fileIds.tasks, filteredTasks);
} 