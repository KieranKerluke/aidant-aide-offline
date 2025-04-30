import { Task, getPatient } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Edit, 
  Trash2, 
  Link, 
  Clock, 
  Repeat, 
  Tag, 
  CalendarCheck, 
  CalendarDays
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface TasksListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number | undefined) => void;
  emptyMessage: string;
}

// Task type definition
type TaskType = "event" | "todo";

// Interface for parsed event data
interface EventData {
  title: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  reminderDelay?: number;
  repetitionFrequency?: string;
  customRepetitionFrequency?: string;
  notes?: string;
  image?: string | null;
}

// Interface for parsed todo metadata
interface TodoMetadata {
  category?: string;
  repetitionFrequency?: string;
  customRepetitionFrequency?: string;
  notes?: string;
  image?: string | null;
}

export function TasksList({ tasks, onEdit, onDelete, emptyMessage }: TasksListProps) {
  const [patientNames, setPatientNames] = useState<Record<number, string>>({});
  
  useEffect(() => {
    // Fetch patient names for associated tasks
    const fetchPatientNames = async () => {
      const patientIds = tasks
        .filter((task) => task.patientId !== undefined)
        .map((task) => task.patientId as number);
      
      const uniqueIds = [...new Set(patientIds)];
      const names: Record<number, string> = {};
      
      for (const id of uniqueIds) {
        try {
          const patient = await getPatient(id);
          if (patient) {
            names[id] = patient.name;
          }
        } catch (error) {
          console.error(`Error fetching patient with id ${id}:`, error);
        }
      }
      
      setPatientNames(names);
    };
    
    fetchPatientNames();
  }, [tasks]);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  const getTaskTypeColor = (type: TaskType) => {
    return type === "event" 
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
  };

  const getRepetitionText = (frequency: string, customFrequency?: string) => {
    switch (frequency) {
      case "none":
        return "None";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "custom":
        return customFrequency || "Custom";
      default:
        return frequency;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "HH:mm");
    } catch (e) {
      return "Invalid format";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return `${format(date, "PPP")} at ${format(date, "HH:mm")}`;
    } catch (e) {
      return "Invalid format";
    }
  };

  // Parse task data to determine if it's an event or todo
  const parseTaskData = (task: Task): { type: TaskType; data: any } => {
    const isEvent = task.description.startsWith("[EVENT]");
    
    if (isEvent) {
      try {
        const eventData: EventData = JSON.parse(task.description.replace("[EVENT]", "").trim());
        return { 
          type: "event", 
          data: eventData 
        };
      } catch (e) {
        console.error("Error parsing event data:", e);
        return { 
          type: "event", 
          data: { title: task.description.replace("[EVENT]", "").trim() } 
        };
      }
    } else {
      // Regular todo task
      let title = task.description;
      let metadata: TodoMetadata = {};
      
      try {
        if (task.description.includes("{")) {
          const metaStart = task.description.indexOf("{");
          metadata = JSON.parse(task.description.substring(metaStart));
          title = task.description.substring(0, metaStart).trim();
        }
      } catch (e) {
        console.error("Error parsing todo metadata:", e);
      }
      
      return { 
        type: "todo", 
        data: { 
          title, 
          ...metadata 
        } 
      };
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => {
        const { type, data } = parseTaskData(task);
        const title = type === "event" ? data.title : data.title;
        
        return (
          <Card key={task.id} className="flex flex-col overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <Badge className={cn(getTaskTypeColor(type))}>
                  {type === "event" ? "Event" : "To-Do"}
                </Badge>
                <Badge className={cn(getPriorityColor(task.priority))}>
                  {task.priority === "high" ? "High" : task.priority === "medium" ? "Medium" : "Low"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-2 pb-4 flex-grow">
              <div className="flex flex-col gap-3">
                <h3 className="font-medium text-base line-clamp-2">{title}</h3>
                
                {type === "event" ? (
                  <>
                    {/* Event specific fields */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>
                        Start: {formatTime(data.startDateTime)} | End: {formatTime(data.endDateTime)}
                      </span>
                    </div>
                    
                    {data.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span>Location: {data.location}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Todo specific fields */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>
                        Deadline: {task.dueDate ? formatDateTime(task.dueDate) : "Not set"}
                      </span>
                    </div>
                    
                    {data.category && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Tag className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span>Category: {data.category}</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Common fields */}
                {data.repetitionFrequency && data.repetitionFrequency !== "none" && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Repeat className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Repeats: {getRepetitionText(data.repetitionFrequency, data.customRepetitionFrequency)}</span>
                  </div>
                )}
                
                {task.patientId && patientNames[task.patientId] && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Link className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Patient: {patientNames[task.patientId]}</span>
                  </div>
                )}
                
                {task.status && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarCheck className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Status: {
                      task.status === "pending" ? "Pending" : 
                      task.status === "in-progress" ? "In Progress" : 
                      "Completed"
                    }</span>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(task.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
