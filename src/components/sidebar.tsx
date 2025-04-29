
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, User, Calendar, CheckSquare, Settings } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const items = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Patients", href: "/patients", icon: User },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className={cn("pb-12 hidden md:block", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "transparent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
