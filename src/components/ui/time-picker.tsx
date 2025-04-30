import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function TimePicker({ date, setDate, className }: TimePickerProps) {
  // Get hours and minutes from the date
  const hours = date ? date.getHours().toString().padStart(2, "0") : "";
  const minutes = date ? date.getMinutes().toString().padStart(2, "0") : "";

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      setDate(undefined);
      return;
    }

    // Create a new date object if one doesn't exist
    const newDate = date ? new Date(date) : new Date();
    
    // Parse the time string (format: HH:MM)
    const [newHours, newMinutes] = value.split(":").map(Number);
    
    if (!isNaN(newHours) && !isNaN(newMinutes)) {
      newDate.setHours(newHours);
      newDate.setMinutes(newMinutes);
      setDate(newDate);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        type="time"
        value={hours && minutes ? `${hours}:${minutes}` : ""}
        onChange={handleTimeChange}
        className="w-full"
      />
    </div>
  );
}
