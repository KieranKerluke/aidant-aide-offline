import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import EditPatient from "./pages/EditPatient";
import PatientSessions from "./pages/PatientSessions";
import SessionReports from "./pages/SessionReports";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import OAuthCallback from "./pages/OAuthCallback";
import { registerServiceWorker, requestNotificationPermission, setupServiceWorkerListener } from "./utils/notifications";
import { getAllTasks } from "./lib/db";
import { hydrateReminders } from "./utils/notifications";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Google Calendar Integration Settings:
 * 
 * 1. OAuth Client ID: 868112033329-4qcoomm0mbvjmtuq71evimfrrn3h3fpu.apps.googleusercontent.com
 * 2. Set JavaScript origins to your domain in Google Cloud Console
 * 3. Make sure the Google Calendar API is enabled in your project
 * 4. Generate an API Key in the Google Cloud Console:
 *    - Go to https://console.cloud.google.com/
 *    - Navigate to APIs & Services > Credentials
 *    - Click "Create Credentials" > "API Key"
 *    - Restrict the key to the Calendar API and your domain
 *    - Add the key to the Calendar.tsx file API_KEY constant
 * 
 * Error 401 (invalid_client) can occur if:
 * - Your domain isn't added to the authorized JavaScript origins
 * - The API Key is missing or invalid
 * - The Google Calendar API isn't enabled
 */

const App = () => {
  useEffect(() => {
    const initializeApp = async () => {
      // Register service worker
      await registerServiceWorker();
      
      // Request notification permission
      await requestNotificationPermission();
      
      // Set up service worker listener
      setupServiceWorkerListener();
      
      // Load and hydrate reminders
      try {
        const tasks = await getAllTasks();
        await hydrateReminders(tasks);
      } catch (error) {
        console.error('Error loading tasks for reminders:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="pair-aidant-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/new" element={<NewPatient />} />
              <Route path="/patients/:id" element={<EditPatient />} />
              <Route path="/patients/:id/sessions" element={<PatientSessions />} />
              <Route path="/sessions/:id/reports" element={<SessionReports />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/oauth2callback" element={<OAuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
