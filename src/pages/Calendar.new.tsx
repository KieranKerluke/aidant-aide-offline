import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CalendarIcon, Edit, Loader2, Plus, RefreshCw, Trash2, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster as CustomToaster } from "@/components/ui/toaster";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { getAllSessions } from "@/lib/db";
import { useNavigate } from "react-router-dom";
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, GOOGLE_REDIRECT_URI, buildGoogleAuthUrl } from "@/utils/google-auth";

// Define interface for Google Calendar events
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  htmlLink?: string;
}

export default function Calendar() {
  // UI State
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoadingGoogleScript, setIsLoadingGoogleScript] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Auth and API state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  
  // Calendar events state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState<Date>(new Date());
  const [eventEndDate, setEventEndDate] = useState<Date>(new Date(new Date().getTime() + 60 * 60 * 1000));
  
  // Dialog state
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { toast } = useToast();

  // Fetch local sessions data
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: getAllSessions,
  });

  // Load the Google API script
  useEffect(() => {
    // Clear previous errors
    setAuthError(null);
    loadGoogleScript();
  }, []);

  const loadGoogleScript = () => {
    setIsLoadingGoogleScript(true);
    
    // Check if script is already loaded
    if (window.gapi) {
      initClient();
      return;
    }
    
    // Load the API client library
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Load the client library
      window.gapi.load("client", initClient);
    };
    script.onerror = () => {
      setIsLoadingGoogleScript(false);
      setAuthError("Failed to load Google API script");
      toast({
        title: "Google Calendar Error",
        description: "Failed to load Google API script",
        variant: "destructive"
      });
    };
    document.body.appendChild(script);
  };

  const initClient = () => {
    // First check if API Key is provided
    if (!GOOGLE_API_KEY) {
      setIsLoadingGoogleScript(false);
      setAuthError("API Key not configured. Please add an API Key in the environment variables.");
      toast({
        title: "Configuration Error",
        description: "API Key not configured. Please add an API Key in the environment variables.",
        variant: "destructive"
      });
      return;
    }
    
    // Clear any previous errors
    setAuthError(null);
    
    // Check if we already have tokens (from OAuth redirect)
    const authTokensStr = localStorage.getItem('authTokens');
    let accessToken = null;
    
    if (authTokensStr) {
      try {
        // Parse the tokens from localStorage
        const authTokens = JSON.parse(authTokensStr);
        console.log("Found stored tokens");
        
        // Make sure the access token exists
        if (authTokens.access_token) {
          accessToken = authTokens.access_token;
          setIsAuthorized(true);
        } else {
          throw new Error("No access token found in stored tokens");
        }
      } catch (error) {
        console.error("Error parsing stored tokens:", error);
        localStorage.removeItem('authTokens');
      }
    }
    
    // Initialize the client with the API key
    window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
    }).then(() => {
      console.log("Google API client initialized");
      
      // If we have an access token, set it directly
      if (accessToken) {
        window.gapi.client.setToken({
          access_token: accessToken
        });
        console.log("Access token set successfully");
        
        // Test a simple API call to verify the token works
        return window.gapi.client.calendar.calendarList.list();
      } else {
        // No token available, we need to authenticate
        setIsAuthorized(false);
        setIsLoadingGoogleScript(false);
        return null;
      }
    }).then((response) => {
      if (response) {
        console.log("Calendar list fetch successful");
        setIsLoadingGoogleScript(false);
        toast({
          title: "Google Calendar Connected",
          description: "Successfully connected to Google Calendar API"
        });
        // Fetch events after successful connection
        fetchCalendarEvents();
      }
    }).catch(error => {
      console.error("Error initializing Google API client:", error);
      setIsLoadingGoogleScript(false);
      setIsAuthorized(false);
      setAuthError("Could not initialize Google Calendar API");
      localStorage.removeItem('authTokens');
      toast({
        title: "Authentication Error",
        description: "Please connect to Google Calendar",
        variant: "destructive"
      });
    });
  };

  // Handle Google Auth click - simplified approach
  const handleAuthClick = () => {
    if (isAuthorized) {
      // Sign out by clearing tokens
      localStorage.removeItem('authTokens');
      setIsAuthorized(false);
      // Clear token in gapi if it's loaded
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(null);
      }
      toast({ 
        title: "Signed Out", 
        description: "Disconnected from Google Calendar" 
      });
    } else {
      // Redirect to Google OAuth flow
      window.location.href = buildGoogleAuthUrl();
    }
  };

  // Fetch calendar events from Google Calendar
  const fetchCalendarEvents = async () => {
    if (!isAuthorized) return;

    try {
      setIsLoadingEvents(true);
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        timeMax: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 50,
        orderBy: "startTime"
      });

      console.log("Calendar events:", response.result.items);
      // Add type casting to ensure the API response matches our CalendarEvent interface
      setCalendarEvents((response.result.items || []) as CalendarEvent[]);
      
      if (response.result.items?.length === 0) {
        toast({
          title: "No Events",
          description: "No upcoming events found in your calendar"
        });
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setAuthError("Failed to fetch calendar events");
      toast({
        title: "Error",
        description: "Failed to fetch calendar events",
        variant: "destructive"
      });

      // If there's an authentication error, clear the tokens and reset auth state
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('authTokens');
        setIsAuthorized(false);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // The rest of the component with UI rendering would go here
  // This is just a placeholder for the functional part of the component
  return (
    <Layout title="Calendar">
      <div className="flex flex-col h-full">
        {/* Component UI will be implemented here */}
      </div>
    </Layout>
  );
}
