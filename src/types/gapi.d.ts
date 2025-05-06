// Type definitions for Google API
declare namespace gapi.client {
  namespace calendar {
    namespace events {
      function list(params: {
        calendarId: string;
        timeMin: string;
        showDeleted: boolean;
        singleEvents: boolean;
        maxResults: number;
      }): Promise<{
        result: {
          items: Array<{
            id: string;
            summary: string;
            description: string;
            start: {
              dateTime: string;
              timeZone?: string;
            };
            end: {
              dateTime: string;
              timeZone?: string;
            };
            location?: string;
          }>;
        };
      }>;
      
      function insert(params: {
        calendarId: string;
        resource: {
          summary: string;
          description: string;
          start: {
            dateTime: string;
            timeZone?: string;
          };
          end: {
            dateTime: string;
            timeZone?: string;
          };
          location?: string;
        };
      }): Promise<any>;
    }
  }
}

interface Window {
  gapi: {
    load(
      apiName: string,
      callback: () => void
    ): void;
    client: {
      init(params: {
        apiKey: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }): Promise<void>;
      setToken(token: { access_token: string } | null): void;
      calendar: typeof gapi.client.calendar;
    };
    auth2: {
      getAuthInstance(): {
        isSignedIn: {
          get(): boolean;
          listen(callback: (isSignedIn: boolean) => void): void;
        };
        signIn(): Promise<any>;
        signOut(): Promise<any>;
      };
    };
  };
}
