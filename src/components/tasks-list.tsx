
import { Task, getPatient } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Edit, Trash2, Link } from "lucide-react";
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

interface TasksListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number | undefined) => void;
  emptyMessage: string;
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

  if (tasks.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <Card key={task.id} className="flex flex-col">
          <CardContent className="pt-6 flex-grow">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <p className="font-medium line-clamp-2">{task.description}</p>
                <Badge className={cn("ml-2", getPriorityColor(task.priority))}>
                  {task.priority}
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <CalendarIcon className="mr-1 h-4 w-4" />
                <span>
                  Due: {task.dueDate ? format(new Date(task.dueDate), "PPP") : "Not set"}
                </span>
              </div>
              
              {task.patientId && patientNames[task.patientId] && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Link className="mr-1 h-4 w-4" />
                  <span>Patient: {patientNames[task.patientId]}</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2">
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
      ))}
    </div>
  );
}

import { cn } from "@/lib/utils";
