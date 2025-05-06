import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { getAllTasks, getTodaySessions, getPatient, type Session, type Task, type Patient, createTask, updateTask } from "../lib/db";
import { Calendar, CheckSquare, Plus, User } from "lucide-react";
import { Link } from "react-router-dom";
import { TasksList } from "@/components/tasks-list";
import { TaskDialog } from "@/components/task-dialog";
import { isAuthenticated, getAuthUrl } from "../lib/auth";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const [sessions, setSessions] = useState<Array<Session & { patientName: string }>>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user is authenticated with Google Drive
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setAuthenticated(authenticated);
      
      if (authenticated) {
        loadDashboardData();
      } else {
        setIsLoading(false);
        toast({
          title: "Authentication Required",
          description: "Please sign in with Google to access your data",
          variant: "destructive"
        });
      }
    };
    
    checkAuth();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get today's sessions
      const todaySessions = await getTodaySessions();
      
      // For each session, get the patient name
      const sessionsWithPatients = await Promise.all(
        todaySessions.map(async (session) => {
          const patient = await getPatient(session.patientId);
          return {
            ...session,
            patientName: patient?.name || "Unknown Patient"
          };
        })
      );

      // Get all tasks instead of just pending tasks
      const allTasks = await getAllTasks();
      
      setSessions(sessionsWithPatients);
      setTasks(allTasks);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    window.location.href = getAuthUrl();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: number | undefined) => {
    // This is just a placeholder - actual deletion would be handled in the Tasks page
    console.log("Delete task requested for ID:", taskId);
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = await createTask(taskData);
      setTasks([...tasks, newTask]);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (taskData: Task) => {
    try {
      const updatedTask = await updateTask(taskData);
      setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  if (!authenticated && !isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold">Google Drive Authentication Required</h2>
            <p className="text-muted-foreground">
              This application now uses Google Drive to store your data. Please sign in with your Google account to continue.
            </p>
          </div>
          <Button onClick={handleSignIn} size="lg">
            Sign in with Google
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="justify-start">
              <Link to="/patients/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Patient
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Open Calendar
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/tasks/new">
                <CheckSquare className="mr-2 h-4 w-4" />
                Add New Task
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Sessions</CardTitle>
            <CardDescription>Sessions scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading sessions...</p>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{session.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.date)} - {session.location}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/sessions/${session.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No sessions scheduled for today</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <CardDescription>All your tasks in one place</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading tasks...</p>
            ) : (
              <TasksList 
                tasks={tasks.slice(0, 6)} 
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                emptyMessage="No tasks available"
              />
            )}
            {tasks.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link to="/tasks">View all tasks</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Dialog for editing tasks */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={taskToEdit}
        onSave={(taskData) => {
          if (taskToEdit) {
            handleUpdateTask({ ...taskToEdit, ...taskData });
          } else {
            handleCreateTask(taskData);
          }
        }}
      />
    </Layout>
  );
}
