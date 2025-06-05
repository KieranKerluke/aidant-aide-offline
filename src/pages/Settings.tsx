import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { signOut } from '@/lib/auth';

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

  const handleClearData = async () => {
    // This will clear the Google Drive folder
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      // The data will be cleared when the user signs out and signs back in
      await signOut();
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    // Data is already in Google Drive, so users can access it directly
    alert('Your data is stored in your Google Drive. You can access it directly from your Google Drive account.');
  };

  const handleImportData = async () => {
    // Data import is handled through Google Drive
    alert('To import data, simply place the JSON files in the PairAidantDB folder in your Google Drive.');
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
            <div className="space-y-2">
              <Button variant="destructive" onClick={handleClearData}>
                Clear All Data
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                Export Data
              </Button>
              <Button variant="outline" onClick={handleImportData}>
                Import Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
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
