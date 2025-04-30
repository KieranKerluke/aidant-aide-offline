import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getAllSessions } from "@/lib/db";
import { Loader2, CalendarPlus, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, GOOGLE_REDIRECT_URI, buildGoogleAuthUrl } from "@/utils/google-auth";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoadingGoogleScript, setIsLoadingGoogleScript] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch local sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: getAllSessions,
  });

  // Check if we have tokens in localStorage
  useEffect(() => {
    const storedTokens = localStorage.getItem('authTokens');
    if (storedTokens) {
      console.log("Found stored tokens, user should be authenticated");
      // We have tokens, this means the user is authenticated
      setIsAuthorized(true);
    }
  }, []);
  
  // Load the Google API script
  useEffect(() => {
    // Clear previous errors
    setAuthError(null);
    
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
      
      // Check if we already have tokens (from OAuth redirect)
      const authTokensStr = localStorage.getItem('authTokens');
      if (authTokensStr) {
        try {
          // Parse the tokens from localStorage
          const authTokens = JSON.parse(authTokensStr);
          console.log("Found stored tokens:", authTokens);
          
          // Set up gapi with access token directly instead of auth flow
          setIsAuthorized(true);
          window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          }).then(() => {
            console.log("Google API client initialized, setting access token");
            // Direct token access - this is the key part!
            gapi.client.setToken({
              access_token: authTokens.access_token
            });
            console.log("Access token set successfully");
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
      window.gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        scope: "https://www.googleapis.com/auth/calendar",
      }).then(() => {
        // Listen for sign-in state changes
        window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        
        // Handle the initial sign-in state
        updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
        setIsLoadingGoogleScript(false);
      }).catch(error => {
        console.error("Error initializing Google API client:", error);
        setIsLoadingGoogleScript(false);
        setAuthError(error.message || "Failed to initialize Google API client");
        toast({
          title: "Google Calendar Error",
          description: "Could not initialize Google Calendar API: " + (error.message || "Unknown error"),
          variant: "destructive"
        });
      });
    };
    
    const updateSigninStatus = (isSignedIn: boolean) => {
      setIsAuthorized(isSignedIn);
      if (isSignedIn) {
        toast({
          title: "Google Calendar",
          description: "Successfully connected to Google Calendar",
        });
      }
    };
    
    loadGoogleScript();
  }, [toast]);
  
  const handleAuthClick = () => {
    if (window.gapi && window.gapi.auth2) {
      if (!isAuthorized) {
        try {
          window.gapi.auth2.getAuthInstance().signIn()
            .catch(error => {
              console.error("Sign-in error:", error);
              // If popup fails, fall back to redirect flow
              console.log("Falling back to redirect authentication flow");
              window.location.href = buildGoogleAuthUrl();
            });
        } catch (error) {
          console.error("Critical sign-in error, using redirect:", error);
          window.location.href = buildGoogleAuthUrl();
        }
      } else {
        window.gapi.auth2.getAuthInstance().signOut().then(() => {
          toast({
            title: "Signed Out",
            description: "Disconnected from Google Calendar",
          });
        });
      }
    }
  };
  
  const syncSessionsToGoogleCalendar = async () => {
    if (!isAuthorized || !sessions || sessions.length === 0) {
      toast({
        title: "Sync Error",
        description: isAuthorized 
          ? "No sessions available to sync" 
          : "Please connect to Google Calendar first",
        variant: "destructive"
      });
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
      let alreadySyncedCount = 0;
      
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
