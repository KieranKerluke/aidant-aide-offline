
import { useState, useEffect } from "react";
import { Session, createSession, updateSession } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface SessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  patientId: number;
  onSave: () => void;
}

export function SessionDialog({ isOpen, onOpenChange, session, patientId, onSave }: SessionDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [duration, setDuration] = useState<number>(60);
  const [location, setLocation] = useState<string>("");
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGapiAvailable, setIsGapiAvailable] = useState(false);

  useEffect(() => {
    // Check if Google API is available
    setIsGapiAvailable(
      window.gapi && 
      window.gapi.auth2 && 
      window.gapi.auth2.getAuthInstance() && 
      window.gapi.auth2.getAuthInstance().isSignedIn.get()
    );
    
    if (session) {
      setDate(session.date ? new Date(session.date) : undefined);
      setDuration(session.duration);
      setLocation(session.location);
    } else {
      setDate(new Date());
      setDuration(60);
      setLocation("");
      setAddToGoogleCalendar(false);
    }
  }, [session, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const sessionData = {
        patientId,
        date: date.toISOString(),
        duration,
        location,
      };
      
      // Save to local database
      if (session?.id) {
        await updateSession({
          ...sessionData,
          id: session.id,
          createdAt: session.createdAt,
          updatedAt: new Date().toISOString()
        });
        toast({ title: "Success", description: "Session updated successfully" });
      } else {
        await createSession(sessionData);
        toast({ title: "Success", description: "Session created successfully" });
      }
      
      // Add to Google Calendar if option selected and API available
      if (addToGoogleCalendar && isGapiAvailable) {
        try {
          await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: {
              summary: `Therapy Session`,
              description: `Patient ID: ${patientId}\nLocation: ${location}`,
              start: {
                dateTime: date.toISOString(),
              },
              end: {
                dateTime: new Date(date.getTime() + duration * 60000).toISOString(),
              },
              location: location,
            }
          });
          toast({
            title: "Google Calendar",
            description: "Session added to Google Calendar",
          });
        } catch (error) {
          console.error("Error adding to Google Calendar:", error);
          toast({
            title: "Google Calendar Error",
            description: "Failed to add to Google Calendar",
            variant: "destructive"
          });
        }
      }
      
      onSave();
    } catch (error) {
      console.error("Error saving session:", error);
      toast({
        title: "Error",
        description: `Failed to ${session ? 'update' : 'create'} session`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{session ? "Edit Session" : "Add New Session"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  id="date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter session location"
              required
            />
          </div>
          
          {isGapiAvailable && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="googleCalendar" 
                checked={addToGoogleCalendar} 
                onCheckedChange={(checked) => setAddToGoogleCalendar(!!checked)} 
              />
              <Label htmlFor="googleCalendar">Add to Google Calendar</Label>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
