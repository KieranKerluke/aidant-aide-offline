import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { format, addDays, isSameDay, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay, eachDayOfInterval, isToday } from "date-fns";
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
  colorId?: string;
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

  const fetchCalendarEvents = async () => {
    if (!isAuthorized) {
      console.log("Not authorized to fetch events");
      return;
    }

    try {
      setIsLoadingEvents(true);
      
      // Simple approach using gapi.client.request as shown in the article
      const response = await window.gapi.client.request({
        path: `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        params: {
          timeMin: new Date().toISOString(),
          timeMax: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          showDeleted: false,
          singleEvents: true,
          maxResults: 50,
          orderBy: "startTime"
        }
      });

      console.log("Calendar events fetched successfully");
      setCalendarEvents(response.result.items || []);
      
      if (response.result.items?.length === 0) {
        toast({
          title: "No Events",
          description: "No upcoming events found in your calendar"
        });
      } else {
        toast({
          title: "Events Loaded",
          description: `Found ${response.result.items.length} upcoming events`
        });
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setAuthError("Failed to fetch calendar events");
      toast({
        title: "Error",
        description: "Failed to fetch calendar events. Please reconnect to Google Calendar.",
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
  
  // Auto-fetch events when authorized
  useEffect(() => {
    if (isAuthorized && !isLoadingGoogleScript) {
      fetchCalendarEvents();
    }
  }, [isAuthorized, isLoadingGoogleScript]);
  
  // Add event creation function using the simplified approach
  const createCalendarEvent = async (event: {
    summary: string;
    location?: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
  }) => {
    if (!isAuthorized) {
      toast({
        title: "Not Authorized",
        description: "Please connect to Google Calendar first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await window.gapi.client.request({
        path: `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        method: 'POST',
        body: JSON.stringify(event)
      });
      
      console.log("Event created successfully:", response.result);
      toast({
        title: "Event Created",
        description: "New event added to your Google Calendar"
      });
      
      // Refresh the events list
      fetchCalendarEvents();
      return response.result;
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
      return null;
    }
  };

  // Accept sessions as a parameter instead of fetching inside the function
  // Accept sessions from state, not from a hook inside the function
  const syncSessionsToGoogleCalendar = async (sessions: any[]) => {
    if (!isAuthorized || !sessions || sessions.length === 0) {
      toast({
        title: "Sync Error",
        description: "No sessions to sync or not connected to Google Calendar"
      });
      return;
    }

    try {
      // Get existing events using the simplified approach
      const response = await window.gapi.client.request({
        path: `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        params: {
          timeMin: new Date().toISOString(),
          showDeleted: false,
          singleEvents: true,
          maxResults: 100
        }
      });
      
      const existingEvents = response.result.items;
      let syncCount = 0;
      let alreadySyncedCount = 0;
      
      for (const session of sessions) {
        const eventExists = existingEvents?.find((event: any) => 
          event.description?.includes(`Session ID: ${session.id}`)
        );
        
        if (!eventExists) {
          // Create event using the simplified approach
          await window.gapi.client.request({
            path: `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
            method: 'POST',
            body: {
              summary: `Session with Patient ID: ${session.patientId}`,
              description: `Session ID: ${session.id}\nLocation: ${session.location}`,
              start: {
                dateTime: new Date(session.date).toISOString(),
              },
              end: {
                dateTime: new Date(new Date(session.date).getTime() + session.duration * 60000).toISOString(),
              },
              location: session.location,
            }
          });
          syncCount++;
        } else {
          alreadySyncedCount++;
        }
      }
      
      toast({
        title: "Sync Completed",
        description: `Synced ${syncCount} new sessions to Google Calendar. ${alreadySyncedCount} sessions were already synced.`,
      });
    } catch (error: any) {
      console.error("Error syncing to Google Calendar:", error);
      toast({
        title: "Sync Error",
        description: "Failed to sync sessions: " + (error.message || "Unknown error"),
        variant: "destructive"
      });
      // If there's an authentication error, clear the tokens and reset auth state
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('authTokens');
        setIsAuthorized(false);
      }
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
                onClick={() => syncSessionsToGoogleCalendar(sessions)}
                variant="outline"
                size="sm"
                disabled={isLoadingEvents}
              >
                {isLoadingEvents ? (
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
              {!GOOGLE_API_KEY && (
                <div className="mt-2">
                  <strong>Setup Instructions:</strong>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>Go to the Google Cloud Console: <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">https://console.cloud.google.com/</a></li>
                    <li>Create a new project or select your existing project</li>
                    <li>Enable the Google Calendar API</li>
                    <li>Create an API key with appropriate domain restrictions</li>
                    <li>Add the API key to the Calendar.tsx file</li>
                  </ol>
                </div>
              )}
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
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
      
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>
            View and manage your sessions
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
          
          {isLoading ? (
            <div className="flex justify-center mt-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Sessions on {date ? new Date(date).toLocaleDateString() : 'selected date'}</h3>
              {sessions && Array.isArray(sessions) && sessions.length > 0 ? (
                sessions
                  .filter(session => {
                    if (!date) return false;
                    const sessionDate = new Date(session.date);
                    return (
                      sessionDate.getDate() === date.getDate() &&
                      sessionDate.getMonth() === date.getMonth() &&
                      sessionDate.getFullYear() === date.getFullYear()
                    );
                  })
                  .map(session => (
                    <div key={session.id} className="p-3 border rounded-md">
                      <p><strong>Patient ID:</strong> {session.patientId}</p>
                      <p><strong>Time:</strong> {new Date(session.date).toLocaleTimeString()}</p>
                      <p><strong>Duration:</strong> {session.duration} minutes</p>
                      <p><strong>Location:</strong> {session.location}</p>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground">No sessions on this date</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar Events Card */}
      {isAuthorized && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Google Calendar</CardTitle>
              <CardDescription>
                {calendarEvents.length > 0 
                  ? `Showing ${calendarEvents.length} upcoming events`
                  : "No upcoming events found"
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchCalendarEvents}
                disabled={isLoadingEvents}
              >
                {isLoadingEvents ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Events
              </Button>
              <Button 
                onClick={() => setShowAddEventDialog(true)}
                variant="outline"
                className="ml-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {calendarEvents.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No events found. Click "New Event" to create one.</p>
                  </div>
                ) : (
                  calendarEvents.map(event => (
                    <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{event.summary}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.start.dateTime), "PPP 'at' p")} - 
                            {format(new Date(event.end.dateTime), " p")}
                          </p>
                          {event.location && (
                            <p className="text-sm mt-1">{event.location}</p>
                          )}
                          {event.description && (
                            <p className="text-sm mt-2 text-muted-foreground">{event.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              setSelectedEvent(event);
                              setEventTitle(event.summary);
                              setEventLocation(event.location || '');
                              setEventDescription(event.description || '');
                              setEventStartDate(new Date(event.start.dateTime));
                              setEventEndDate(new Date(event.end.dateTime));
                              setShowEditEventDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Basic Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="w-1/2">
                  <Label>Start</Label>
                  <Input
                    type="datetime-local"
                    value={format(eventStartDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => e.target.value && setEventStartDate(new Date(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div className="w-1/2">
                  <Label>End</Label>
                  <Input
                    type="datetime-local"
                    value={format(eventEndDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => e.target.value && setEventEndDate(new Date(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                // Simple event creation
                createCalendarEvent({
                  summary: eventTitle,
                  location: "",
                  description: "",
                  start: { dateTime: eventStartDate.toISOString() },
                  end: { dateTime: eventEndDate.toISOString() }
                });
                setShowAddEventDialog(false);
              }}
            >
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Event Dialog */}
      <Dialog open={showEditEventDialog} onOpenChange={setShowEditEventDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update details for this event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title</Label>
              <Input 
                id="edit-title" 
                value={eventTitle} 
                onChange={(e) => setEventTitle(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location (optional)</Label>
              <Input 
                id="edit-location" 
                value={eventLocation} 
                onChange={(e) => setEventLocation(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea 
                id="edit-description" 
                value={eventDescription} 
                onChange={(e) => setEventDescription(e.target.value)} 
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={eventStartDate}
                  onSelect={(date) => date && setEventStartDate(date)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={eventEndDate}
                  onSelect={(date) => date && setEventEndDate(date)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Update event implementation
              if (!isAuthorized || !selectedEvent) return;
              
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
              
              setIsLoadingEvents(true);
              // @ts-ignore
(window.gapi.client.calendar.events as any).update({
                calendarId: 'primary',
                eventId: selectedEvent.id,
                resource: event
              }).then(() => {
                toast({
                  title: "Event Updated",
                  description: "Event has been updated in your calendar"
                });
                
                // Close dialog and refresh
                setShowEditEventDialog(false);
                fetchCalendarEvents();
              }).catch(error => {
                console.error("Error updating event:", error);
                toast({
                  title: "Error",
                  description: "Failed to update event: " + (error.message || "Unknown error"),
                  variant: "destructive"
                });
              }).finally(() => {
                setIsLoadingEvents(false);
              });
            }}>
              Update Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedEvent && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">{selectedEvent.summary}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedEvent.start.dateTime), "PPP 'at' p")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              // Delete event implementation
              if (!isAuthorized || !selectedEvent) return;
              
              setIsLoadingEvents(true);
              // @ts-ignore
(window.gapi.client.calendar.events as any).delete({
                calendarId: 'primary',
                eventId: selectedEvent.id
              }).then(() => {
                toast({
                  title: "Event Deleted",
                  description: "Event has been removed from your calendar"
                });
                
                // Close dialog and refresh
                setShowDeleteConfirm(false);
                setSelectedEvent(null);
                fetchCalendarEvents();
              }).catch(error => {
                console.error("Error deleting event:", error);
                toast({
                  title: "Error",
                  description: "Failed to delete event: " + (error.message || "Unknown error"),
                  variant: "destructive"
                });
              }).finally(() => {
                setIsLoadingEvents(false);
              });
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
