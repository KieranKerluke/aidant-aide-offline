
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, Calendar, CheckSquare, Settings, Home } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-center">Pair Aidant Manager</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-6">
          <Link 
            to="/" 
            onClick={handleLinkClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/patients" 
            onClick={handleLinkClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <User size={18} />
            <span>Patients</span>
          </Link>
          <Link 
            to="/calendar" 
            onClick={handleLinkClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <Calendar size={18} />
            <span>Calendar</span>
          </Link>
          <Link 
            to="/tasks" 
            onClick={handleLinkClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <CheckSquare size={18} />
            <span>Tasks</span>
          </Link>
          <Link 
            to="/settings" 
            onClick={handleLinkClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
        <div className="absolute bottom-4 left-4">
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
