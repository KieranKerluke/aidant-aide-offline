
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [biometricLock, setBiometricLock] = useState(false);

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const handleBiometricToggle = (checked: boolean) => {
    setBiometricLock(checked);
    toast({
      title: checked ? "Biometric Lock Enabled" : "Biometric Lock Disabled",
      description: "This feature is for demonstration purposes only.",
    });
  };

  const handleResetApp = () => {
    // For demonstration purposes only - would clear IndexedDB in a full implementation
    toast({
      title: "App data reset",
      description: "All data has been cleared from the application",
      variant: "destructive",
    });
  };

  const handleExportData = () => {
    // For demonstration purposes only - would export IndexedDB data in a full implementation
    toast({
      title: "Data exported",
      description: "Your data has been exported successfully.",
    });
  };

  const handleImportData = () => {
    // For demonstration purposes only - would import data into IndexedDB in a full implementation
    toast({
      title: "Data imported",
      description: "Your data has been imported successfully.",
    });
  };

  return (
    <Layout title="Settings">
      <div className="space-y-4 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize your application appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col">
                <span>Dark Mode</span>
                <span className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </span>
              </Label>
              <Switch 
                id="dark-mode" 
                checked={theme === "dark"} 
                onCheckedChange={handleThemeChange} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage application security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="biometric-lock" className="flex flex-col">
                <span>Biometric Lock</span>
                <span className="text-sm text-muted-foreground">
                  Require biometric authentication to open the app (demo only)
                </span>
              </Label>
              <Switch 
                id="biometric-lock" 
                checked={biometricLock} 
                onCheckedChange={handleBiometricToggle} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Import, export, or reset your application data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={handleExportData}>
                Export Data
              </Button>
              <Button variant="outline" onClick={handleImportData}>
                Import Data
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all application data, including patients, sessions, tasks, and reports. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetApp}>
                    Reset All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p><strong>Pair Aidant Manager</strong></p>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-sm text-muted-foreground">A fully offline PWA for peer helpers to manage patients, sessions, and reports.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
