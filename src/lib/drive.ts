// Import enhanced process polyfill before any Google SDK imports
import '../process-polyfill-fix';

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
export interface Patient {
  id?: number;
  name: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  dateOfBirth: string;
  maritalStatus?: string;
  numberOfChildren?: string;
  cityOfResidence?: string;
  personalPhone?: string;
  illnessDuration?: string;
  treatingDoctor?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  id: number;
  patientId: number;
  date: string;
  location?: string;
  duration?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalReportType1 {
  id: number;
  sessionId: number;
  type: 'type1';
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
  id: number;
  sessionId: number;
  type: 'type2';
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
  id: number;
  sessionId: number;
  type: 'type1';
  date: string;
  duration: string;
  location: string;
  participantName: string;
  familySituation: string;
  observations: string;
  conclusion: string;
  signature: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyReportType2 {
  id: number;
  sessionId: number;
  type: 'type2';
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
  title: string;
  completed?: boolean;
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  description?: string;
  patientId?: number;
  location?: string;
  reminderAt?: string;
  createdAt?: string;
  updatedAt?: string;
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

    // Handle empty or invalid response
    if (!response.data) {
      return [];
    }

    // Parse the response data
    let data: T[];
    try {
      data = typeof response.data === 'string' 
        ? JSON.parse(response.data) 
        : response.data as T[];
    } catch (parseError) {
      console.error('Error parsing collection data:', parseError);
      return [];
    }

    // Ensure we have an array
    if (!Array.isArray(data)) {
      console.warn('Collection data is not an array, returning empty array');
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error reading collection:', error);
    // Return empty array instead of throwing for better error handling
    return [];
  }
}

// Write to a collection
async function writeCollection<T>(fileId: string, data: T[]): Promise<void> {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

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
    // Check if we're authenticated
    if (!oauth2Client.credentials.access_token) {
      throw new Error('Not authenticated with Google Drive');
    }

    const folderId = await getOrCreateDBFolder();
    const fileIds: Record<string, string> = {};

    // Create all collection files
    for (const [collection, fileName] of Object.entries(COLLECTIONS)) {
      try {
        fileIds[collection] = await getOrCreateCollectionFile(folderId, fileName);
      } catch (error) {
        console.error(`Error initializing collection ${collection}:`, error);
        // Continue with other collections even if one fails
        fileIds[collection] = '';
      }
    }

    // Verify all collections were created
    const failedCollections = Object.entries(fileIds)
      .filter(([_, id]) => !id)
      .map(([collection]) => collection);

    if (failedCollections.length > 0) {
      console.error('Failed to initialize collections:', failedCollections);
      throw new Error(`Failed to initialize collections: ${failedCollections.join(', ')}`);
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
export async function createMedicalReport(report: Omit<MedicalReportType1 | MedicalReportType2, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalReportType1 | MedicalReportType2> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReportType1 | MedicalReportType2>(fileIds.medicalReports);
  
  // Validate required fields based on report type
  if (report.type === 'type1') {
    const type1Report = report as Omit<MedicalReportType1, 'id' | 'createdAt' | 'updatedAt'>;
    if (!type1Report.patientSituation || !type1Report.familySituation || !type1Report.observations) {
      throw new Error('Missing required fields for MedicalReportType1');
    }
  } else if (report.type === 'type2') {
    const type2Report = report as Omit<MedicalReportType2, 'id' | 'createdAt' | 'updatedAt'>;
    if (!type2Report.sessionObjective || !type2Report.topics || !type2Report.generalObservations) {
      throw new Error('Missing required fields for MedicalReportType2');
    }
  }
  
  const newReport = {
    ...report,
    id: reports.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as MedicalReportType1 | MedicalReportType2;

  reports.push(newReport);
  await writeCollection(fileIds.medicalReports, reports);
  return newReport;
}

export async function getMedicalReport(id: number): Promise<MedicalReportType1 | MedicalReportType2 | undefined> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReportType1 | MedicalReportType2>(fileIds.medicalReports);
  return reports.find(r => r.id === id);
}

export async function updateMedicalReport(report: MedicalReportType1 | MedicalReportType2): Promise<MedicalReportType1 | MedicalReportType2> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReportType1 | MedicalReportType2>(fileIds.medicalReports);
  const index = reports.findIndex(r => r.id === report.id);
  if (index !== -1) {
    reports[index] = {
      ...report,
      updatedAt: new Date().toISOString()
    };
    await writeCollection(fileIds.medicalReports, reports);
    return reports[index];
  }
  throw new Error('Medical report not found');
}

export async function deleteMedicalReport(id: number): Promise<void> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReportType1 | MedicalReportType2>(fileIds.medicalReports);
  const filteredReports = reports.filter(r => r.id !== id);
  await writeCollection(fileIds.medicalReports, filteredReports);
}

// CRUD operations for family reports
export async function createFamilyReport(report: Omit<FamilyReportType1 | FamilyReportType2, 'id' | 'createdAt' | 'updatedAt'>): Promise<FamilyReportType1 | FamilyReportType2> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReportType1 | FamilyReportType2>(fileIds.familyReports);
  
  // Validate required fields based on report type
  if (report.type === 'type1') {
    const type1Report = report as Omit<FamilyReportType1, 'id' | 'createdAt' | 'updatedAt'>;
    if (!type1Report.familySituation || !type1Report.observations) {
      throw new Error('Missing required fields for FamilyReportType1');
    }
  } else if (report.type === 'type2') {
    const type2Report = report as Omit<FamilyReportType2, 'id' | 'createdAt' | 'updatedAt'>;
    if (!type2Report.sessionObjective || !type2Report.topics || !type2Report.generalObservations) {
      throw new Error('Missing required fields for FamilyReportType2');
    }
  }
  
  const newReport = {
    ...report,
    id: reports.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as FamilyReportType1 | FamilyReportType2;

  reports.push(newReport);
  await writeCollection(fileIds.familyReports, reports);
  return newReport;
}

export async function getFamilyReport(id: number): Promise<FamilyReportType1 | FamilyReportType2 | undefined> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReportType1 | FamilyReportType2>(fileIds.familyReports);
  return reports.find(r => r.id === id);
}

export async function updateFamilyReport(report: FamilyReportType1 | FamilyReportType2): Promise<FamilyReportType1 | FamilyReportType2> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReportType1 | FamilyReportType2>(fileIds.familyReports);
  const index = reports.findIndex(r => r.id === report.id);
  if (index !== -1) {
    reports[index] = {
      ...report,
      updatedAt: new Date().toISOString()
    };
    await writeCollection(fileIds.familyReports, reports);
    return reports[index];
  }
  throw new Error('Family report not found');
}

export async function deleteFamilyReport(id: number): Promise<void> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReportType1 | FamilyReportType2>(fileIds.familyReports);
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

export async function getMedicalReportBySession(sessionId: number): Promise<MedicalReportType1 | MedicalReportType2 | undefined> {
  const fileIds = await initializeDB();
  const reports = await readCollection<MedicalReportType1 | MedicalReportType2>(fileIds.medicalReports);
  return reports.find(r => r.sessionId === sessionId);
}

export async function getFamilyReportBySession(sessionId: number): Promise<FamilyReportType1 | FamilyReportType2 | undefined> {
  const fileIds = await initializeDB();
  const reports = await readCollection<FamilyReportType1 | FamilyReportType2>(fileIds.familyReports);
  return reports.find(r => r.sessionId === sessionId);
} 