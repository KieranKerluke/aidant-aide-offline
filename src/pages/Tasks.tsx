import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { type Task, createTask, updateTask, deleteTask, getAllTasks } from "../lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, LogIn, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { TaskDialog } from "@/components/task-dialog";
import { TasksList } from "@/components/tasks-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAuthenticated, getAuthUrl } from "../lib/auth";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user is authenticated with Google Drive
    const checkAuth = async () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      
      if (isAuth) {
        loadTasks();
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

  const handleSignIn = () => {
    window.location.href = getAuthUrl();
  };

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const allTasks = await getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = await createTask(taskData);
      setTasks([...tasks, newTask]);
      setIsTaskDialogOpen(false);
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
      setIsTaskDialogOpen(false);
      setTaskToEdit(null);
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

  const handleDeleteTask = async (taskId: number | undefined) => {
    if (!taskId) return;
    
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskData: Task) => {
    if (taskData.id) {
      await handleUpdateTask(taskData);
    } else {
      await handleCreateTask(taskData);
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <Layout title="Tasks">
      {authenticated ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Tasks</h2>
            <Button onClick={handleAddTask}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Task
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <p>Loading tasks...</p>
            </div>
          ) : (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="relative">
                  Pending
                  <Badge variant="secondary" className="ml-2">{pendingTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="relative">
                  In Progress
                  <Badge variant="secondary" className="ml-2">{inProgressTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="relative">
                  Completed
                  <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-4">
                <TasksList
                  tasks={pendingTasks}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  emptyMessage="No pending tasks"
                />
              </TabsContent>
              
              <TabsContent value="in-progress" className="mt-4">
                <TasksList
                  tasks={inProgressTasks}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  emptyMessage="No in-progress tasks"
                />
              </TabsContent>
              
              <TabsContent value="completed" className="mt-4">
                <TasksList
                  tasks={completedTasks}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  emptyMessage="No completed tasks"
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-screen">
          <LogIn className="h-8 w-8 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in with Google</h2>
          <Button onClick={handleSignIn}>Sign in</Button>
        </div>
      )}
      
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={taskToEdit}
        onSave={handleSaveTask}
      />
    </Layout>
  );
}
