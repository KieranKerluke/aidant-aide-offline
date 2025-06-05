import { useEffect, useState } from "react";
import { useNetworkStatus } from "@/utils/network-status";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff } from "lucide-react";

interface NetworkStatusProps {
  showText?: boolean;
  className?: string;
}

/**
 * Component that displays the current network status (online/offline)
 */
export function NetworkStatus({ showText = true, className = "" }: NetworkStatusProps) {
  const { isOnline, checkConnectivity } = useNetworkStatus();
  const [actualConnectivity, setActualConnectivity] = useState<boolean>(isOnline);
  
  // Periodically check actual connectivity
  useEffect(() => {
    const checkActualConnectivity = async () => {
      const isActuallyConnected = await checkConnectivity();
      setActualConnectivity(isActuallyConnected);
    };
    
    // Check immediately
    checkActualConnectivity();
    
    // Then check every 30 seconds
    const interval = setInterval(checkActualConnectivity, 30000);
    
    return () => clearInterval(interval);
  }, [checkConnectivity]);
  
  // Also check when online status changes
  useEffect(() => {
    if (isOnline) {
      checkConnectivity().then(setActualConnectivity);
    } else {
      setActualConnectivity(false);
    }
  }, [isOnline, checkConnectivity]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 ${className}`}>
            {actualConnectivity ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800 px-2 py-0.5 flex items-center gap-1">
                <Wifi className="h-3.5 w-3.5" />
                {showText && <span>Online</span>}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800 px-2 py-0.5 flex items-center gap-1">
                <WifiOff className="h-3.5 w-3.5" />
                {showText && <span>Offline</span>}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {actualConnectivity 
              ? "Application is connected to the network" 
              : "Application is in offline mode"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
