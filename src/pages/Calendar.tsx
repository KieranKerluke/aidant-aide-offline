import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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
import { AlertTriangle, CalendarIcon, Edit, Loader2, Plus, RefreshCw, Trash2, CalendarPlus } from "lucide-react";
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
    
    // Load the API client and auth2 libraries
    const script1 = document.createElement("script");
    script1.src = "https://apis.google.com/js/api.js";
    script1.onload = () => {
      // Load the client library
      window.gapi.load("client:auth2", initClient);
    };
    script1.onerror = () => {
      setIsLoadingGoogleScript(false);
      setAuthError("Failed to load Google API script");
      toast({
        title: "Google Calendar Error",
        description: "Failed to load Google API script",
        variant: "destructive"
      });
    };
    document.body.appendChild(script1);
  };

  const initClient = () => {
    // First check if API Key is provided
    if (!GOOGLE_API_KEY) {
      setIsLoadingGoogleScript(false);
      setAuthError("API Key not configured. Please add an API Key in the Calendar.tsx file.");
      toast({
        title: "Configuration Error",
        description: "API Key not configured. Please add an API Key in the Calendar.tsx file.",
        variant: "destructive"
      });
      return;
    }
    
    // Clear any previous errors
    setAuthError(null);
    
    // Check if we already have tokens (from OAuth redirect)
    const authTokensStr = localStorage.getItem('authTokens');
    if (authTokensStr) {
      try {
        // Parse the tokens from localStorage
        const authTokens = JSON.parse(authTokensStr);
        console.log("Found stored tokens:", authTokens);
        
        // Set up gapi with access token directly instead of auth flow
        console.log("RAW TOKEN FROM STORAGE:", authTokensStr);
        console.log("PARSED TOKEN:", authTokens);
        console.log("ACCESS TOKEN AVAILABLE:", !!authTokens.access_token);
        
        // Make sure the access token exists
        if (!authTokens.access_token) {
          throw new Error("No access token found in stored tokens");
        }
        
        setIsAuthorized(true);
        setIsLoadingGoogleScript(true);
        
        // First initialize the client
        window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          // Don't include clientId or scope here to avoid auth popup
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        }).then(() => {
          console.log("Google API client initialized");
          // Explicitly load the Calendar API
          return window.gapi.client.load('calendar', 'v3');
        }).then(() => {
          console.log("Calendar API loaded, setting access token");
          // Direct token access - this is the key part!
          window.gapi.client.setToken({
            access_token: authTokens.access_token
          });
          console.log("Access token set successfully");
          
          // Test a simple API call to verify the token works
          return window.gapi.client.calendar.calendarList.list();
        }).then((response) => {
          console.log("Calendar list fetch successful:", response);
          setIsLoadingGoogleScript(false);
          toast({
            title: "Google Calendar Connected",
            description: "Successfully connected to Google Calendar API"
          });
        }).catch(error => {
          console.error("Error initializing Google API client:", error);
          setIsLoadingGoogleScript(false);
          setAuthError("Could not initialize Google Calendar API with stored tokens");
          localStorage.removeItem('authTokens');
          toast({
            title: "Session Expired",
            description: "Your Google authentication has expired. Please reconnect.",
            variant: "destructive"
          });
        });
        return;
      } catch (error) {
        console.error("Error parsing stored tokens:", error);
        localStorage.removeItem('authTokens');
      }
    }
    
    // Normal initialization flow with auth
    try {
      // We'll use a Promise.race with a timeout to avoid hanging forever if gapi has issues
      const initPromise = window.gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        scope: "https://www.googleapis.com/auth/calendar",
      });
      
      // Add a 10-second timeout as a safety measure
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Google API initialization timed out")), 10000);
      });
      
      Promise.race([initPromise, timeoutPromise])
        .then(() => {
          // Listen for sign-in state changes
          if (window.gapi.auth2 && window.gapi.auth2.getAuthInstance()) {
            window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state
            updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
          } else {
            // If auth2 isn't available for some reason, we'll use the redirect-based auth
            console.log("Auth2 not available, using redirect auth");
            setIsAuthorized(false);
          }
          setIsLoadingGoogleScript(false);
        })
        .catch(error => {
          console.error("Error initializing Google API client:", error);
          setIsLoadingGoogleScript(false);
          
          // Instead of showing error, automatically redirect to auth flow
          console.log("Initialization failed, redirecting to auth flow");
          window.location.href = buildGoogleAuthUrl();
        });
    } catch (error) {
      console.error("Critical error in Google API initialization:", error);
      setIsLoadingGoogleScript(false);
      
      // Automatically redirect to OAuth flow on any failure
      console.log("Critical initialization error, redirecting to auth flow");
      window.location.href = buildGoogleAuthUrl();
    }
  };

  const updateSigninStatus = (isSignedIn: boolean) => {
    setIsAuthorized(isSignedIn);
    if (isSignedIn) {
      toast({
        title: "Google Calendar",
      });
      window.gapi.auth2.getAuthInstance().signIn()
        .catch(error => {
          console.error("Sign-in error:", error);
          // If popup fails, fall back to redirect flow
          console.log("Falling back to redirect authentication flow");
          window.location.href = buildGoogleAuthUrl();
        });
    } else {
      window.gapi.auth2.getAuthInstance().signOut().then(() => {
        toast({
          title: "Signed Out",
          description: "Disconnected from Google Calendar",
        });
      });
    }
  }

  const fetchCalendarEvents = async () => {
    if (!isAuthorized) return;

    try {
      setIsLoadingEvents(true);
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        // @ts-ignore
        timeMax: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 50,
        orderBy: "startTime"
      });

      console.log("Calendar events:", response.result.items);
      setCalendarEvents(response.result.items || []);
      
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
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
      });
      
      const existingEvents = response.result.items;
      let syncCount = 0;
      let alreadySyncedCount = 0;
      
      for (const session of sessions) {
        const eventExists = existingEvents?.find((event: any) => 
          event.description?.includes(`Session ID: ${session.id}`)
        );
        
        if (!eventExists) {
          await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: {
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
    }
  };

  // Handler for Google Auth click
  const handleAuthClick = () => {
    if (isAuthorized && window.gapi && window.gapi.auth2) {
      window.gapi.auth2.getAuthInstance().signOut().then(() => {
        setIsAuthorized(false);
        toast({ title: "Signed Out", description: "Disconnected from Google Calendar" });
      });
    } else {
      window.location.href = buildGoogleAuthUrl();
    }
  };

  return (
    <Layout title="Calendar">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>
            Sync your sessions with Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              onClick={handleAuthClick} 
              disabled={isLoadingGoogleScript || (!GOOGLE_API_KEY && !authError)}
              variant={isAuthorized ? "outline" : "default"}
            >
              {isLoadingGoogleScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                isAuthorized ? "Sign Out from Google" : "Connect Google Calendar"
              )}
            </Button>
            
            {isAuthorized && (
              <Button 
                onClick={() => syncSessionsToGoogleCalendar(sessions || [])} 
                disabled={isLoading || !sessions || sessions.length === 0}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Sync Sessions to Google Calendar
              </Button>
            )}
          </div>
          
          {isAuthorized ? (
            <p className="text-sm text-green-600 dark:text-green-400">
              Connected to Google Calendar
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect your Google account to sync sessions
            </p>
          )}
        </CardContent>
      </Card>
      
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
                size="sm" 
                onClick={() => {
                  setEventTitle('');
                  setEventLocation('');
                  setEventDescription('');
                  setEventStartDate(new Date());
                  setEventEndDate(new Date(new Date().getTime() + 60 * 60 * 1000));
                  setShowAddEventDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
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
      
      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event in your Google Calendar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input 
                id="title" 
                value={eventTitle} 
                onChange={(e) => setEventTitle(e.target.value)} 
                placeholder="Meeting with client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input 
                id="location" 
                value={eventLocation} 
                onChange={(e) => setEventLocation(e.target.value)} 
                placeholder="Office or virtual meeting link"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea 
                id="description" 
                value={eventDescription} 
                onChange={(e) => setEventDescription(e.target.value)} 
                placeholder="Event details..."
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
            <Button variant="outline" onClick={() => setShowAddEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Create event implementation
              if (!isAuthorized) return;
              
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
              window.gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event
              }).then(response => {
                toast({
                  title: "Event Created",
                  description: "New event has been added to your calendar"
                });
                
                // Clear form and close dialog
                setShowAddEventDialog(false);
                
                // Refresh events
                fetchCalendarEvents();
              }).catch(error => {
                console.error("Error creating event:", error);
                toast({
                  title: "Error",
                  description: "Failed to create event: " + (error.message || "Unknown error"),
                  variant: "destructive"
                });
              }).finally(() => {
                setIsLoadingEvents(false);
              });
            }}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Event Dialog */}
      <Dialog open={showEditEventDialog} onOpenChange={setShowEditEventDialog}>
        <DialogContent>
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
    </Layout>
  );
}
