import React, { useState, useEffect } from "react";
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
import { AlertTriangle, CalendarIcon, Edit, Loader2, Plus, RefreshCw, Trash2, CalendarPlus, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { getAllSessions } from "../lib/db";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getAuthUrl } from "../lib/auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// CalendarEvent interface is used for the component state
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

  // Check authentication on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if user is authenticated with Google
  async function checkAuth() {
    try {
      const authenticated = isAuthenticated();
      setIsAuthorized(authenticated);
      
      if (authenticated) {
        loadGoogleScript();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthorized(false);
    }
  }

  // Load the Google API script
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
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
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
    
    // Get the access token from localStorage
    const tokens = localStorage.getItem('google_tokens');
    let accessToken = null;
    
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        if (parsedTokens.access_token) {
          accessToken = parsedTokens.access_token;
          setIsAuthorized(true);
        } else {
          throw new Error("Invalid token format");
        }
      } catch (error) {
        console.error("Error parsing stored tokens");
        localStorage.removeItem('google_tokens');
      }
    }
    
    // Initialize the client with the API key
    window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      scope: "https://www.googleapis.com/auth/calendar"
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
      localStorage.removeItem('google_tokens');
      toast({
        title: "Authentication Error",
        description: "Please connect to Google Calendar",
        variant: "destructive"
      });
    });
  };

  // Handle Google Auth click
  const handleAuthClick = () => {
    if (isAuthorized) {
      // Sign out by clearing tokens
      localStorage.removeItem('google_tokens');
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
      window.location.href = getAuthUrl();
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
        localStorage.removeItem('google_tokens');
        setIsAuthorized(false);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Create a new calendar event
  const createCalendarEvent = async () => {
    if (!isAuthorized) {
      toast({
        title: "Not Authorized",
        description: "Please connect to Google Calendar first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoadingApi(true);
      
      // Format the event data
      const event = {
        summary: eventTitle,
        location: eventLocation,
        description: eventDescription,
        start: {
          dateTime: eventStartDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: eventEndDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      // Create the event
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      
      console.log("Event created successfully:", response.result);
      
      // Reset form fields
      setEventTitle('');
      setEventLocation('');
      setEventDescription('');
      setEventStartDate(new Date());
      setEventEndDate(new Date(new Date().getTime() + 60 * 60 * 1000));
      
      // Close the dialog
      setShowAddEventDialog(false);
      
      // Refresh events
      fetchCalendarEvents();
      
      // Show success message
      toast({
        title: "Event Created",
        description: "New event added to your Google Calendar"
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Update an existing calendar event
  const updateCalendarEvent = async () => {
    if (!isAuthorized || !selectedEvent) {
      return;
    }
    
    try {
      setIsLoadingApi(true);
      
      // Format the updated event data
      const updatedEvent = {
        summary: eventTitle,
        location: eventLocation,
        description: eventDescription,
        start: {
          dateTime: eventStartDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: eventEndDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      // Update the event
      await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: selectedEvent.id,
        resource: updatedEvent
      });
      
      // Close the dialog and refresh events
      setShowEditEventDialog(false);
      setSelectedEvent(null);
      fetchCalendarEvents();
      
      // Show success message
      toast({
        title: "Event Updated",
        description: "Calendar event has been updated"
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Delete a calendar event
  const deleteCalendarEvent = async () => {
    if (!isAuthorized || !selectedEvent) {
      return;
    }
    
    try {
      setIsLoadingApi(true);
      
      // Delete the event
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: selectedEvent.id
      });
      
      // Close the dialogs and refresh events
      setShowDeleteConfirm(false);
      setShowEditEventDialog(false);
      setSelectedEvent(null);
      fetchCalendarEvents();
      
      // Show success message
      toast({
        title: "Event Deleted",
        description: "Calendar event has been removed"
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Handle opening the edit dialog for an event
  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventTitle(event.summary);
    setEventLocation(event.location || '');
    setEventDescription(event.description || '');
    setEventStartDate(new Date(event.start.dateTime));
    setEventEndDate(new Date(event.end.dateTime));
    setShowEditEventDialog(true);
  };

  // Handle opening the delete confirmation dialog
  const handleDeletePrompt = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDeleteConfirm(true);
  };

  // Sync sessions to Google Calendar
  const syncSessionsToGoogleCalendar = async () => {
    if (!isAuthorized || !sessions || sessions.length === 0) {
      toast({
        title: "Sync Error",
        description: "No sessions to sync or not connected to Google Calendar"
      });
      return;
    }

    try {
      setIsLoadingApi(true);
      
      // Get existing events
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100
      });
      
      const existingEvents = response.result.items;
      let syncCount = 0;
      let alreadySyncedCount = 0;
      
      for (const session of sessions) {
        const eventExists = existingEvents?.find((event: any) => 
          event.description?.includes(`Session ID: ${session.id}`)
        );
        
        if (!eventExists) {
          // Create event for this session
          await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: {
              summary: `Session with Patient ID: ${session.patientId}`,
              description: `Session ID: ${session.id}\nLocation: ${session.location || 'Not specified'}`,
              start: {
                dateTime: new Date(session.date).toISOString(),
              },
              end: {
                dateTime: new Date(new Date(session.date).getTime() + (session.duration || 60) * 60000).toISOString(),
              },
              location: session.location || 'Not specified',
            }
          });
          syncCount++;
        } else {
          alreadySyncedCount++;
        }
      }
      
      // Refresh events after sync
      fetchCalendarEvents();
      
      toast({
        title: "Sync Completed",
        description: `Synced ${syncCount} new sessions to Google Calendar. ${alreadySyncedCount} sessions were already synced.`,
      });
    } catch (error) {
      console.error('Error syncing sessions to Google Calendar:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  return (
    <Layout title="Calendar">
      <div className="flex flex-col h-full">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4 p-2 border-b">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Calendar</h1>
            
            <Button
              onClick={handleAuthClick}
              variant={isAuthorized ? "outline" : "default"}
              size="sm"
              disabled={isLoadingGoogleScript}
            >
              {isLoadingGoogleScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : isAuthorized ? (
                <>Disconnect from Google Calendar</>
              ) : (
                <>Connect to Google Calendar</>
              )}
            </Button>
            
            {isAuthorized && sessions && sessions.length > 0 && (
              <Button
                onClick={syncSessionsToGoogleCalendar}
                variant="outline"
                size="sm"
                disabled={isLoadingApi}
              >
                {isLoadingApi ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Sync Sessions
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isAuthorized && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchCalendarEvents}
                  disabled={isLoadingEvents}
                >
                  {isLoadingEvents ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setShowAddEventDialog(true)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </>
            )}
          </div>
        </div>
        
        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {authError}
            </AlertDescription>
          </Alert>
        )}
        
        {!isAuthorized ? (
          <div className="flex items-center justify-center h-[70vh]">
            <div className="text-center p-8 border rounded-md bg-muted/20 max-w-md">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Connect to Google Calendar</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect your Google Calendar account to view and manage your events directly in this application.
              </p>
              <Button
                onClick={handleAuthClick}
                className="mt-4"
                disabled={isLoadingGoogleScript}
              >
                {isLoadingGoogleScript ? "Loading..." : "Connect Now"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>
                    Select a date to view events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Events</CardTitle>
                  <CardDescription>
                    {date ? format(date, 'PPP') : 'All upcoming events'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEvents ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : calendarEvents.length > 0 ? (
                    <div className="space-y-4">
                      {calendarEvents
                        .filter(event => {
                          if (!date) return true;
                          const eventDate = new Date(event.start.dateTime);
                          return (
                            eventDate.getDate() === date.getDate() &&
                            eventDate.getMonth() === date.getMonth() &&
                            eventDate.getFullYear() === date.getFullYear()
                          );
                        })
                        .map(event => (
                          <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{event.summary}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(event.start.dateTime), "PPP 'at' p")} - 
                                  {format(new Date(event.end.dateTime), " p")}
                                </p>
                                {event.location && (
                                  <p className="text-sm flex items-center mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeletePrompt(event)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            {event.description && (
                              <p className="text-sm mt-2">{event.description}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No events found for {date ? format(date, 'PPP') : 'the selected period'}.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Add Event Dialog */}
        <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
              <DialogDescription>
                Create a new event in your Google Calendar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createCalendarEvent(); }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">
                    Start
                  </Label>
                  <div className="col-span-3 flex space-x-2">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventStartDate ? format(eventStartDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={eventStartDate}
                            onSelect={(date) => date && setEventStartDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-24">
                      <Input
                        type="time"
                        value={format(eventStartDate, 'HH:mm')}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const newDate = new Date(eventStartDate);
                          newDate.setHours(hours, minutes);
                          setEventStartDate(newDate);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end-date" className="text-right">
                    End
                  </Label>
                  <div className="col-span-3 flex space-x-2">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventEndDate ? format(eventEndDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={eventEndDate}
                            onSelect={(date) => date && setEventEndDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-24">
                      <Input
                        type="time"
                        value={format(eventEndDate, 'HH:mm')}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const newDate = new Date(eventEndDate);
                          newDate.setHours(hours, minutes);
                          setEventEndDate(newDate);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoadingApi}>
                  {isLoadingApi ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Event Dialog */}
        <Dialog open={showEditEventDialog} onOpenChange={setShowEditEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update your calendar event details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateCalendarEvent(); }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="edit-location"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-start-date" className="text-right">
                    Start
                  </Label>
                  <div className="col-span-3 flex space-x-2">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventStartDate ? format(eventStartDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={eventStartDate}
                            onSelect={(date) => date && setEventStartDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-24">
                      <Input
                        type="time"
                        value={format(eventStartDate, 'HH:mm')}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const newDate = new Date(eventStartDate);
                          newDate.setHours(hours, minutes);
                          setEventStartDate(newDate);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-end-date" className="text-right">
                    End
                  </Label>
                  <div className="col-span-3 flex space-x-2">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventEndDate ? format(eventEndDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={eventEndDate}
                            onSelect={(date) => date && setEventEndDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-24">
                      <Input
                        type="time"
                        value={format(eventEndDate, 'HH:mm')}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const newDate = new Date(eventEndDate);
                          newDate.setHours(hours, minutes);
                          setEventEndDate(newDate);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditEventDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoadingApi}>
                  {isLoadingApi ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Event"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this event? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteCalendarEvent}
                disabled={isLoadingApi}
              >
                {isLoadingApi ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
