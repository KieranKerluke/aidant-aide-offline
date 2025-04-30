import { useState, useEffect } from "react";
import { Task, Patient, getAllPatients } from "@/lib/db";
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
import { Calendar as CalendarIcon, Clock, MapPin, BellRing, Repeat, FileImage, ListTodo, Calendar as CalendarFull } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { TimePicker } from "./ui/time-picker";
import { scheduleNotification, ReminderPayload } from "@/utils/notifications";

interface TaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

type TaskType = "event" | "todo";
type Priority = "low" | "medium" | "high";
type Status = "pending" | "in-progress" | "completed";
type RepetitionFrequency = "none" | "daily" | "weekly" | "custom";

// Extended Task interface to support both event and todo types
interface ExtendedTaskData {
  type?: TaskType;
  title?: string;
  description: string;
  dueDate: string; // ISO string
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  reminderDelay?: number;
  reminderDateTime?: string;
  repetitionFrequency?: RepetitionFrequency;
  customRepetitionFrequency?: string;
  notes?: string;
  image?: string | null;
  priority: Priority;
  status: Status;
  category?: string;
  patientId?: number;
}

export function TaskDialog({ isOpen, onOpenChange, task, onSave }: TaskDialogProps) {
  // Common state
  const [taskType, setTaskType] = useState<TaskType>("todo");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [repetitionFrequency, setRepetitionFrequency] = useState<RepetitionFrequency>("none");
  const [customRepetitionFrequency, setCustomRepetitionFrequency] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<Status>("pending");

  // Event specific state
  const [eventTitle, setEventTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState<Date | undefined>(new Date());
  const [reminderDelay, setReminderDelay] = useState<number>(15);

  // Todo specific state
  const [todoTitle, setTodoTitle] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const allPatients = await getAllPatients();
        setPatients(allPatients);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    if (task) {
      // Extract task type from description or other fields
      const isEvent = task.description.startsWith("[EVENT]");
      setTaskType(isEvent ? "event" : "todo");
      
      if (isEvent) {
        // Parse event data from description
        try {
          const eventData = JSON.parse(task.description.replace("[EVENT]", "").trim());
          setEventTitle(eventData.title || "");
          setLocation(eventData.location || "");
          
          if (eventData.startDateTime) {
            const startDT = new Date(eventData.startDateTime);
            setStartDate(startDT);
            setStartTime(startDT);
          }
          
          if (eventData.endDateTime) {
            const endDT = new Date(eventData.endDateTime);
            setEndDate(endDT);
            setEndTime(endDT);
          }
          
          setReminderDelay(eventData.reminderDelay || 15);
          setRepetitionFrequency(eventData.repetitionFrequency || "none");
          if (eventData.repetitionFrequency === "custom" && eventData.customRepetitionFrequency) {
            setCustomRepetitionFrequency(eventData.customRepetitionFrequency);
          }
          setNotes(eventData.notes || "");
          
          if (eventData.image) {
            setImagePreview(eventData.image);
          }
        } catch (e) {
          console.error("Error parsing event data:", e);
          setEventTitle(task.description.replace("[EVENT]", "").trim());
        }
      } else {
        // Regular todo task
        setTodoTitle(task.description);
        if (task.dueDate) {
          const dueDateTime = new Date(task.dueDate);
          setDeadline(dueDateTime);
          setDeadlineTime(dueDateTime);
        }
        setPriority(task.priority);
        setStatus(task.status);
        
        // Try to extract additional data if available
        try {
          if (task.description.includes("{")) {
            const metaStart = task.description.indexOf("{");
            const metaData = JSON.parse(task.description.substring(metaStart));
            setCategory(metaData.category || "");
            setRepetitionFrequency(metaData.repetitionFrequency || "none");
            if (metaData.repetitionFrequency === "custom" && metaData.customRepetitionFrequency) {
              setCustomRepetitionFrequency(metaData.customRepetitionFrequency);
            }
            setNotes(metaData.notes || "");
            
            if (metaData.image) {
              setImagePreview(metaData.image);
            }
            
            // Update title without the metadata
            setTodoTitle(task.description.substring(0, metaStart).trim());
          }
        } catch (e) {
          console.error("Error parsing todo metadata:", e);
        }
      }
      
      setPatientId(task.patientId);
    } else {
      // Reset all fields for a new task
      resetForm();
    }
  }, [task]);

  const resetForm = () => {
    // Reset common fields
    setTaskType("todo");
    setNotes("");
    setImage(null);
    setImagePreview(null);
    setRepetitionFrequency("none");
    setCustomRepetitionFrequency("");
    setPatientId(undefined);
    setStatus("pending");

    // Reset event fields
    setEventTitle("");
    setLocation("");
    setStartDate(undefined);
    setStartTime(new Date());
    setEndDate(undefined);
    setEndTime(new Date());
    setReminderDelay(15);

    // Reset todo fields
    setTodoTitle("");
    setDeadline(undefined);
    setDeadlineTime(new Date());
    setPriority("medium");
    setCategory("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to combine date and time
  const combineDateTime = (date: Date, time: Date): Date => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes()
    );
  };

  // Helper function to calculate reminder time based on due date and delay
  const calculateReminderTime = (dueDate: Date, delayMinutes: number): Date => {
    return addMinutes(dueDate, -delayMinutes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
    
    if (taskType === "event") {
      // Validate required fields for event
      if (!eventTitle || !startDate || !startTime) {
        console.error("Missing required fields for event");
        return;
      }
      
      // Create start and end date/time
      const startDateTime = startDate && startTime ? new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startTime.getHours(),
        startTime.getMinutes()
      ) : undefined;
      
      const endDateTime = endDate && endTime ? new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endTime.getHours(),
        endTime.getMinutes()
      ) : undefined;
      
      // Calculate reminder time based on start time and delay
      const reminderTime = startDateTime ? calculateReminderTime(startDateTime, reminderDelay) : undefined;
      
      // Create event data
      const eventData = {
        title: eventTitle,
        location,
        startDateTime: startDateTime?.toISOString(),
        endDateTime: endDateTime?.toISOString(),
        reminderDelay,
        repetitionFrequency,
        customRepetitionFrequency: repetitionFrequency === "custom" ? customRepetitionFrequency : undefined,
        notes,
        image: imagePreview
      };
      
      // Create task data with event data in description
      taskData = {
        description: `[EVENT]${JSON.stringify(eventData)}`,
        dueDate: startDateTime?.toISOString() || new Date().toISOString(),
        priority,
        status,
        patientId,
        reminderAt: reminderTime?.toISOString()
      };
    } else {
      // Validate required fields for todo
      if (!todoTitle || !deadline || !deadlineTime) {
        console.error("Missing required fields for todo");
        return;
      }
      
      // Create deadline date/time
      const deadlineDateTime = deadline && deadlineTime ? new Date(
        deadline.getFullYear(),
        deadline.getMonth(),
        deadline.getDate(),
        deadlineTime.getHours(),
        deadlineTime.getMinutes()
      ) : undefined;
      
      // Calculate reminder time based on deadline and delay
      const reminderTime = deadlineDateTime ? calculateReminderTime(deadlineDateTime, reminderDelay) : undefined;
      
      // Create metadata for todo
      const todoMetadata = {
        category,
        repetitionFrequency,
        customRepetitionFrequency: repetitionFrequency === "custom" ? customRepetitionFrequency : undefined,
        notes,
        image: imagePreview
      };
      
      // Create task data with todo metadata in description
      const metadataStr = Object.values(todoMetadata).some(v => v) ? JSON.stringify(todoMetadata) : '';
      taskData = {
        description: `${todoTitle}${metadataStr ? ' ' + metadataStr : ''}`,
        dueDate: deadlineDateTime?.toISOString() || new Date().toISOString(),
        priority,
        status,
        patientId,
        reminderAt: reminderTime?.toISOString()
      };
    }
    
    // Save the task
    onSave(taskData);
    
    // Schedule notification if reminder is set
    if (taskData.reminderAt) {
      try {
        // Create a temporary ID for the reminder if this is a new task
        const tempId = task?.id || Date.now();
        
        // Create reminder payload
        const reminder: ReminderPayload = {
          id: tempId,
          title: `Reminder: ${taskType === "event" ? eventTitle : todoTitle}`,
          body: `Due: ${format(new Date(taskData.dueDate), 'PPP')} at ${format(new Date(taskData.dueDate), 'HH:mm')}`,
          timestamp: new Date(taskData.reminderAt).getTime(),
          url: `/tasks?id=${tempId}`,
          taskId: task?.id,
          tag: `task-${tempId}`
        };
        
        // Schedule the notification
        await scheduleNotification(reminder);
        console.log(`Scheduled notification for task at ${taskData.reminderAt}`);
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }
    
    // Reset form and close dialog
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                taskType === "event" ? "border-primary bg-primary/10" : "border-border"
              )}
              onClick={() => setTaskType("event")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <CalendarFull className="h-8 w-8 mb-2" />
                <span className="font-medium">Event</span>
              </CardContent>
            </Card>
            
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                taskType === "todo" ? "border-primary bg-primary/10" : "border-border"
              )}
              onClick={() => setTaskType("todo")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <ListTodo className="h-8 w-8 mb-2" />
                <span className="font-medium">To-Do</span>
              </CardContent>
            </Card>
          </div>
          
          {/* Event Form */}
          {taskType === "event" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventTitle">Event Title</Label>
                <Input
                  id="eventTitle"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  placeholder="Enter event title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex">
                  <MapPin className="mr-2 h-4 w-4 mt-3 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                        id="startDate"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Choose a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <div className="flex">
                    <Clock className="mr-2 h-4 w-4 mt-3 text-muted-foreground" />
                    <TimePicker 
                      date={startTime} 
                      setDate={setStartTime} 
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                        id="endDate"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Choose a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="flex">
                    <Clock className="mr-2 h-4 w-4 mt-3 text-muted-foreground" />
                    <TimePicker 
                      date={endTime} 
                      setDate={setEndTime} 
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminderDelay">Reminder Delay (minutes)</Label>
                  <div className="flex">
                    <BellRing className="mr-2 h-4 w-4 mt-3 text-muted-foreground" />
                    <Input
                      id="reminderDelay"
                      type="number"
                      min="0"
                      value={reminderDelay}
                      onChange={(e) => setReminderDelay(parseInt(e.target.value) || 0)}
                      placeholder="15"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                    <SelectTrigger className="w-full" id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Status)}>
                  <SelectTrigger className="w-full" id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {/* Todo Form */}
          {taskType === "todo" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="todoTitle">Task Title</Label>
                <Input
                  id="todoTitle"
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  required
                  placeholder="Enter task title"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-muted-foreground"
                        )}
                        id="deadline"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : <span>Choose a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadlineTime">Deadline Time</Label>
                  <div className="flex">
                    <Clock className="mr-2 h-4 w-4 mt-3 text-muted-foreground" />
                    <TimePicker 
                      date={deadlineTime} 
                      setDate={setDeadlineTime} 
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                    <SelectTrigger className="w-full" id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Enter category"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="todoRepetition">Repeat Frequency</Label>
                  <div className="flex">
                    <Repeat className="mr-2 h-4 w-4 mt-3 text-muted-foreground" />
                    <Select 
                      value={repetitionFrequency} 
                      onValueChange={(value) => setRepetitionFrequency(value as RepetitionFrequency)}
                    >
                      <SelectTrigger className="w-full" id="todoRepetition">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as Status)}>
                    <SelectTrigger className="w-full" id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {repetitionFrequency === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="todoCustomRepetition">Custom Frequency</Label>
                  <Input
                    id="todoCustomRepetition"
                    value={customRepetitionFrequency}
                    onChange={(e) => setCustomRepetitionFrequency(e.target.value)}
                    placeholder="E.g. Every 3rd Monday"
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Common Fields for Both Forms */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter additional notes"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Image (optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                <FileImage className="h-6 w-6 text-muted-foreground" />
              </div>
              
              {imagePreview && (
                <div className="mt-2 relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-[200px] rounded-md object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patient">Associated Patient (Optional)</Label>
              <Select 
                value={patientId?.toString() || "none"} 
                onValueChange={(value) => setPatientId(value === "none" ? undefined : parseInt(value))}
              >
                <SelectTrigger className="w-full" id="patient">
                  <SelectValue placeholder="Select a patient (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id?.toString() || ""}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{task ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
