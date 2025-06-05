import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Patient = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type Session = {
  id: string;
  user_id: string;
  patient_id: string;
  date: string;
  duration: number;
  location?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type Document = {
  id: string;
  user_id: string;
  patient_id: string;
  title: string;
  content?: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export type Appointment = {
  id: string;
  user_id: string;
  patient_id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Google Calendar token types
export type GoogleToken = {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Patient functions
export async function createPatient(patient: Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select()
    .single()

  if (error) {
    console.error('Failed to create patient:', error)
    return null
  }

  return data
}

export async function getPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Failed to fetch patients:', error)
    return null
  }

  return data
}

export async function updatePatient(id: string, updates: Partial<Patient>) {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update patient:', error)
    return null
  }

  return data
}

export async function deletePatient(id: string) {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete patient:', error)
    return false
  }

  return true
}

// Session functions
export async function createSession(session: Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('sessions')
    .insert([session])
    .select()
    .single()

  if (error) {
    console.error('Failed to create session:', error)
    return null
  }

  return data
}

export async function getSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, patients(*)')
    .order('date', { ascending: true })

  if (error) {
    console.error('Failed to fetch sessions:', error)
    return null
  }

  return data
}

export async function updateSession(id: string, updates: Partial<Session>) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update session:', error)
    return null
  }

  return data
}

export async function deleteSession(id: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete session:', error)
    return false
  }

  return true
}

// Document functions
export async function createDocument(document: Omit<Document, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('documents')
    .insert([document])
    .select()
    .single()

  if (error) {
    console.error('Failed to create document:', error)
    return null
  }

  return data
}

export async function getDocuments(patientId?: string) {
  let query = supabase
    .from('documents')
    .select('*, patients(*)')
    .order('created_at', { ascending: false })

  if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch documents:', error)
    return null
  }

  return data
}

export async function updateDocument(id: string, updates: Partial<Document>) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update document:', error)
    return null
  }

  return data
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete document:', error)
    return false
  }

  return true
}

// Appointment functions
export async function createAppointment(appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointment])
    .select()
    .single()

  if (error) {
    console.error('Failed to create appointment:', error)
    return null
  }

  return data
}

export async function getAppointments(patientId?: string) {
  let query = supabase
    .from('appointments')
    .select('*, patients(*)')
    .order('date', { ascending: true })

  if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch appointments:', error)
    return null
  }

  return data
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update appointment:', error)
    return null
  }

  return data
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete appointment:', error)
    return false
  }

  return true
}

// Google Calendar token functions
export async function storeGoogleToken(token: {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
}) {
  const { data, error } = await supabase
    .from('google_tokens')
    .upsert([token], { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('Failed to store Google token:', error)
    return null
  }

  return data
}

export async function getGoogleToken() {
  const { data, error } = await supabase
    .from('google_tokens')
    .select('*')
    .single()

  if (error) {
    console.error('Failed to fetch Google token:', error)
    return null
  }

  return data
}

export async function deleteGoogleToken() {
  const { error } = await supabase
    .from('google_tokens')
    .delete()
    .neq('id', '') // Delete all tokens for the current user

  if (error) {
    console.error('Failed to delete Google token:', error)
    return false
  }

  return true
} 