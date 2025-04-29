
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Task, createTask, updateTask, deleteTask, getAllTasks } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { TaskDialog } from "@/components/task-dialog";
import { TasksList } from "@/components/tasks-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  
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
  
  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = () => {
    setCurrentTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: number | undefined) => {
    if (!taskId) return;
    
    try {
      await deleteTask(taskId);
      await loadTasks();
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

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (currentTask?.id) {
        await updateTask({ ...taskData, id: currentTask.id, createdAt: currentTask.createdAt, updatedAt: new Date().toISOString() });
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        await createTask(taskData);
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }
      
      setIsDialogOpen(false);
      await loadTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive",
      });
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <Layout title="Tasks">
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
      
      <TaskDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={currentTask}
        onSave={handleSaveTask}
      />
    </Layout>
  );
}
