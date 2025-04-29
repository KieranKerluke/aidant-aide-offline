
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { getPendingTasks, getTodaySessions, Patient, Session, Task } from "@/lib/db";
import { Calendar, CheckSquare, Plus, User } from "lucide-react";
import { Link } from "react-router-dom";
import { getPatient } from "@/lib/db";

export default function Dashboard() {
  const [sessions, setSessions] = useState<Array<Session & { patientName: string }>>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

        // Get pending tasks
        const pendingTasks = await getPendingTasks();
        
        setSessions(sessionsWithPatients);
        setTasks(pendingTasks);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Tasks</CardTitle>
            <CardDescription>Tasks that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading tasks...</p>
            ) : tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{task.description}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        <span className={`ml-2 inline-block h-2 w-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}></span>
                        <span>{task.priority} priority</span>
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.length > 5 && (
                  <Button variant="link" asChild className="w-full mt-2">
                    <Link to="/tasks">View all tasks</Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No pending tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
