import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Define the possible states for the OAuth callback process
type CallbackState = "loading" | "success" | "error";

export default function OAuthCallback() {
  const [state, setState] = useState<CallbackState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        // Handle error from OAuth provider
        if (error) {
          console.error("OAuth error:", error);
          setState("error");
          setErrorMessage(`Authentication failed: ${error}`);
          toast({
            title: "Authentication Error",
            description: `Google authentication failed: ${error}`,
            variant: "destructive",
          });
          return;
        }

        // Check if code exists
        if (!code) {
          console.error("No authorization code found in the URL");
          setState("error");
          setErrorMessage("No authorization code received from Google");
          toast({
            title: "Authentication Error",
            description: "No authorization code received from Google",
            variant: "destructive",
          });
          return;
        }

        console.log("Authorization code received:", code);

        // Send the code to the backend for token exchange
        try {
          const response = await fetch('http://localhost:3000/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
          }

          const data = await response.json();
          
          // Store tokens in localStorage
          localStorage.setItem('authTokens', JSON.stringify(data.tokens));
          
          // Update state to success
          setState("success");
          toast({
            title: "Authentication Successful",
            description: "You have successfully authenticated with Google",
          });

          // Redirect after a short delay
          setTimeout(() => {
            navigate("/calendar"); // Redirect to calendar page or another appropriate page
          }, 2000);
        } catch (error) {
          console.error("Error exchanging code for tokens:", error);
          setState("error");
          setErrorMessage(error instanceof Error ? error.message : "Failed to exchange authorization code for tokens");
          toast({
            title: "Authentication Error",
            description: error instanceof Error ? error.message : "Failed to exchange authorization code for tokens",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error processing OAuth callback:", error);
        setState("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
        toast({
          title: "Authentication Error",
          description: "Failed to process authentication response",
          variant: "destructive",
        });
      }
    };

    handleOAuthCallback();
  }, [location.search, navigate]);

  return (
    <Layout title="Google Authentication">
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {state === "loading" && "Processing Authentication"}
              {state === "success" && "Authentication Successful"}
              {state === "error" && "Authentication Failed"}
            </CardTitle>
            <CardDescription>
              {state === "loading" && "Please wait while we complete the authentication process..."}
              {state === "success" && "You have successfully authenticated with Google."}
              {state === "error" && "There was a problem authenticating with Google."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            {state === "loading" && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
            {state === "success" && <CheckCircle className="h-16 w-16 text-green-500" />}
            {state === "error" && <XCircle className="h-16 w-16 text-red-500" />}
          </CardContent>
          {state === "error" && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </CardContent>
          )}
          <CardFooter className="flex justify-center">
            {state === "success" && (
              <Button onClick={() => navigate("/calendar")}>
                Continue to Calendar
              </Button>
            )}
            {state === "error" && (
              <Button onClick={() => navigate("/")}>
                Return to Dashboard
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
