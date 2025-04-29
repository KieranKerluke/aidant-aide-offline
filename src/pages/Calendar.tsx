
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getAllSessions } from "@/lib/db";
import { Loader2, CalendarPlus } from "lucide-react";

// Replace with your Google Calendar API Client ID
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const API_KEY = "YOUR_API_KEY";
const SCOPES = "https://www.googleapis.com/auth/calendar";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoadingGoogleScript, setIsLoadingGoogleScript] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  // Fetch local sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: getAllSessions,
  });

  // Load the Google API script
  useEffect(() => {
    const loadGoogleScript = () => {
      setIsLoadingGoogleScript(true);
      
      // Load the API client and auth2 libraries
      const script1 = document.createElement("script");
      script1.src = "https://apis.google.com/js/api.js";
      script1.onload = () => {
        // Load the client library
        window.gapi.load("client:auth2", initClient);
      };
      document.body.appendChild(script1);
    };
    
    const initClient = () => {
      window.gapi.client.init({
        apiKey: API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        scope: SCOPES,
      }).then(() => {
        // Listen for sign-in state changes
        window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        
        // Handle the initial sign-in state
        updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
        setIsLoadingGoogleScript(false);
      }).catch(error => {
        console.error("Error initializing Google API client:", error);
        setIsLoadingGoogleScript(false);
        toast({
          title: "Google Calendar Error",
          description: "Could not initialize Google Calendar API",
          variant: "destructive"
        });
      });
    };
    
    const updateSigninStatus = (isSignedIn: boolean) => {
      setIsAuthorized(isSignedIn);
    };
    
    loadGoogleScript();
  }, [toast]);
  
  const handleAuthClick = () => {
    if (window.gapi && window.gapi.auth2) {
      if (!isAuthorized) {
        window.gapi.auth2.getAuthInstance().signIn();
      } else {
        window.gapi.auth2.getAuthInstance().signOut();
      }
    }
  };
  
  const syncSessionsToGoogleCalendar = async () => {
    if (!isAuthorized || !sessions || sessions.length === 0) {
      return;
    }
    
    try {
      // Get all calendar events from the primary calendar
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
      });
      
      const existingEvents = response.result.items;
      let syncCount = 0;
      
      // For each session, check if it exists in Google Calendar and add/update if needed
      for (const session of sessions) {
        // Check if this session is already in Google Calendar
        const eventExists = existingEvents?.find((event) => 
          event.description?.includes(`Session ID: ${session.id}`)
        );
        
        if (!eventExists) {
          // Create a new event
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
        }
      }
      
      toast({
        title: "Sync Completed",
        description: `Synced ${syncCount} sessions to Google Calendar`,
      });
    } catch (error) {
      console.error("Error syncing to Google Calendar:", error);
      toast({
        title: "Sync Error",
        description: "Failed to sync sessions to Google Calendar",
        variant: "destructive"
      });
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
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              onClick={handleAuthClick} 
              disabled={isLoadingGoogleScript}
              variant={isAuthorized ? "outline" : "default"}
            >
              {isLoadingGoogleScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                isAuthorized ? "Sign Out" : "Connect Google Calendar"
              )}
            </Button>
            
            {isAuthorized && (
              <Button 
                onClick={syncSessionsToGoogleCalendar} 
                disabled={isLoading || sessions?.length === 0}
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
              {sessions && sessions.length > 0 ? (
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
    </Layout>
  );
}
