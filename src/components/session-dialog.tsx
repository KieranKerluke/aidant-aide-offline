
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setDate(session.date ? new Date(session.date) : undefined);
      setDuration(session.duration);
      setLocation(session.location);
    } else {
      setDate(new Date());
      setDuration(60);
      setLocation("");
    }
  }, [session]);

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
