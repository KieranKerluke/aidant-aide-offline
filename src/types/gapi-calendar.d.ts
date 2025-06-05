// Type definitions for Google API Client - Calendar
declare namespace gapi.client {
  namespace calendar {
    interface Event {
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

    interface EventListResponse {
      items: Event[];
    }

    interface EventsListParams {
      calendarId: string;
      timeMin?: string;
      timeMax?: string;
      showDeleted?: boolean;
      singleEvents?: boolean;
      orderBy?: string;
      maxResults?: number;
    }

    interface CalendarList {
      list(params?: any): Promise<{result: {items: any[]}}>;
    }

    interface Events {
      list(params: EventsListParams): Promise<{result: EventListResponse}>;
      insert(params: {calendarId: string; resource: Partial<Event>}): Promise<{result: Event}>;
      update(params: {calendarId: string; eventId: string; resource: Partial<Event>}): Promise<{result: Event}>;
      delete(params: {calendarId: string; eventId: string}): Promise<void>;
    }

    const events: Events;
    const calendarList: CalendarList;
  }
}
