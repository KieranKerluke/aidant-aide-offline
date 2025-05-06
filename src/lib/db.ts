/**
 * Database adapter for Google Drive
 * 
 * This file serves as a compatibility layer between the old IndexedDB implementation
 * and the new Google Drive implementation. It provides the same interface as the old
 * database functions but uses Google Drive for storage.
 */

// Import Google Drive functions
import { 
  Patient, Session, Task, MedicalReportType1, MedicalReportType2,
  FamilyReportType1, FamilyReportType2,
  createPatient, getPatient, updatePatient, deletePatient,
  createSession, getSession, updateSession, deleteSession,
  createMedicalReport, getMedicalReport, updateMedicalReport, deleteMedicalReport,
  createFamilyReport, getFamilyReport, updateFamilyReport, deleteFamilyReport,
  createTask, getTask, updateTask, deleteTask,
  getMedicalReportBySession, getFamilyReportBySession,
  initializeDB
} from './drive';

import { isAuthenticated } from './auth';
import { format, startOfDay, endOfDay } from 'date-fns';

// Re-export types
export type { 
  Patient, Session, Task, MedicalReportType1, MedicalReportType2,
  FamilyReportType1, FamilyReportType2 
};

// Initialize the database
export async function initDatabase() {
  if (!isAuthenticated()) {
    throw new Error('User is not authenticated with Google Drive');
  }
  
  return await initializeDB();
}

// Patient functions
export async function getAllPatients(): Promise<Patient[]> {
  try {
    // This will be handled by the Drive API internally
    // We're just providing the same interface as before
    const dbFolder = await initializeDB();
    return Array.isArray(dbFolder.patients) ? dbFolder.patients : [];
  } catch (error) {
    console.error('Error getting all patients:', error);
    throw error;
  }
}

export { createPatient, getPatient, updatePatient, deletePatient };

// Session functions
export async function getAllSessions(): Promise<Session[]> {
  try {
    const dbFolder = await initializeDB();
    return Array.isArray(dbFolder.sessions) ? dbFolder.sessions : [];
  } catch (error) {
    console.error('Error getting all sessions:', error);
    throw error;
  }
}

export async function getSessionsByPatient(patientId: number): Promise<Session[]> {
  try {
    const allSessions = await getAllSessions();
    return allSessions.filter(session => session.patientId === patientId);
  } catch (error) {
    console.error(`Error getting sessions for patient ${patientId}:`, error);
    throw error;
  }
}

export async function getTodaySessions(): Promise<Session[]> {
  try {
    const allSessions = await getAllSessions();
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    return allSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfToday && sessionDate <= endOfToday;
    });
  } catch (error) {
    console.error('Error getting today\'s sessions:', error);
    throw error;
  }
}

export { createSession, getSession, updateSession, deleteSession };

// Medical report functions
export async function getAllMedicalReports(): Promise<(MedicalReportType1 | MedicalReportType2)[]> {
  try {
    const dbFolder = await initializeDB();
    return Array.isArray(dbFolder.medicalReports) ? dbFolder.medicalReports : [];
  } catch (error) {
    console.error('Error getting all medical reports:', error);
    throw error;
  }
}

export { 
  createMedicalReport, getMedicalReport, updateMedicalReport, deleteMedicalReport,
  getMedicalReportBySession 
};

// Family report functions
export async function getAllFamilyReports(): Promise<(FamilyReportType1 | FamilyReportType2)[]> {
  try {
    const dbFolder = await initializeDB();
    return Array.isArray(dbFolder.familyReports) ? dbFolder.familyReports : [];
  } catch (error) {
    console.error('Error getting all family reports:', error);
    throw error;
  }
}

export { 
  createFamilyReport, getFamilyReport, updateFamilyReport, deleteFamilyReport,
  getFamilyReportBySession 
};

// Task functions
export async function getAllTasks(): Promise<Task[]> {
  try {
    const dbFolder = await initializeDB();
    return Array.isArray(dbFolder.tasks) ? dbFolder.tasks : [];
  } catch (error) {
    console.error('Error getting all tasks:', error);
    throw error;
  }
}

export async function getPendingTasks(): Promise<Task[]> {
  try {
    const allTasks = await getAllTasks();
    return allTasks.filter(task => !task.completed);
  } catch (error) {
    console.error('Error getting pending tasks:', error);
    throw error;
  }
}

export { createTask, getTask, updateTask, deleteTask };
