import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Patient, createPatient, updatePatient } from "@/lib/db";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PatientFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  isEdit?: boolean;
  onSave?: (patient: Patient) => void;
}

export function PatientForm({ isOpen, onOpenChange, patient, isEdit = false, onSave }: PatientFormProps) {
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [maritalStatus, setMaritalStatus] = useState<string>("");
  const [numberOfChildren, setNumberOfChildren] = useState<string>("");
  const [cityOfResidence, setCityOfResidence] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [illnessDuration, setIllnessDuration] = useState("");
  const [treatingDoctor, setTreatingDoctor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load patient data if in edit mode
  useEffect(() => {
    if (isOpen) {
      if (patient) {
        setName(patient.name || "");
        setFatherName(patient.fatherName || "");
        setFatherPhone(patient.fatherPhone || "");
        setMotherName(patient.motherName || "");
        setMotherPhone(patient.motherPhone || "");
        setDateOfBirth(formatDateForInput(patient.dateOfBirth));
        setMaritalStatus(patient.maritalStatus || "");
        setNumberOfChildren(patient.numberOfChildren || "");
        setCityOfResidence(patient.cityOfResidence || "");
        setPersonalPhone(patient.personalPhone || "");
        setIllnessDuration(patient.illnessDuration || "");
        setTreatingDoctor(patient.treatingDoctor || "");
        setTags(patient.tags || []);
      } else {
        resetForm();
      }
    }
  }, [patient, isOpen]);

  // Calculate age based on date of birth
  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [dateOfBirth]);

  const resetForm = () => {
    setName("");
    setFatherName("");
    setFatherPhone("");
    setMotherName("");
    setMotherPhone("");
    setDateOfBirth("");
    setAge(null);
    setMaritalStatus("");
    setNumberOfChildren("");
    setCityOfResidence("");
    setPersonalPhone("");
    setIllnessDuration("");
    setTreatingDoctor("");
    setTags([]);
    setNewTag("");
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  const handleMaritalStatusChange = (value: string) => {
    setMaritalStatus(value);
    if (value === "célibataire") {
      setNumberOfChildren("");
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dateOfBirth) {
      toast({
        title: "Error",
        description: "Date of birth is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure dateOfBirth is in ISO format
      const formattedDateOfBirth = new Date(dateOfBirth).toISOString();
      
      const patientData: Patient = {
        id: isEdit && patient ? patient.id : undefined,
        name,
        fatherName,
        fatherPhone,
        motherName,
        motherPhone,
        dateOfBirth: formattedDateOfBirth,
        maritalStatus,
        numberOfChildren,
        cityOfResidence,
        personalPhone,
        illnessDuration,
        treatingDoctor,
        tags: tags || [],
        createdAt: isEdit && patient && patient.createdAt ? patient.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (isEdit && patient && patient.id) {
        await updatePatient(patientData);
        toast({ title: "Success", description: "Patient updated successfully" });
      } else {
        // Remove id, createdAt, and updatedAt before creating a new patient
        const { id, createdAt, updatedAt, ...newPatientData } = patientData;
        const newPatient = await createPatient(newPatientData);
        toast({ title: "Success", description: "Patient created successfully" });
        patientData.id = newPatient.id; // Ensure the ID is set from the newly created patient
      }
      
      if (onSave) {
        onSave(patientData);
      }
      
      // Close the dialog after a short delay to allow the toast to show
      setTimeout(() => {
        onOpenChange(false);
      }, 300);
    } catch (error) {
      console.error("Error saving patient:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} patient`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Patient" : "Add New Patient"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter patient's full name"
                required
              />
            </div>
            
            {/* Father's Information */}
            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name</Label>
              <Input
                id="fatherName"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father's name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fatherPhone">Father's Phone</Label>
              <Input
                id="fatherPhone"
                value={fatherPhone}
                onChange={(e) => setFatherPhone(e.target.value)}
                placeholder="Father's phone number"
              />
            </div>
            
            {/* Mother's Information */}
            <div className="space-y-2">
              <Label htmlFor="motherName">Mother's Name</Label>
              <Input
                id="motherName"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Mother's name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="motherPhone">Mother's Phone</Label>
              <Input
                id="motherPhone"
                value={motherPhone}
                onChange={(e) => setMotherPhone(e.target.value)}
                placeholder="Mother's phone number"
              />
            </div>
            
            {/* Date of Birth and Age */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="text"
                  value={age !== null ? age.toString() : ""}
                  readOnly
                  disabled
                />
              </div>
            </div>
            
            {/* Marital Status */}
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select value={maritalStatus} onValueChange={handleMaritalStatusChange}>
                <SelectTrigger id="maritalStatus">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="célibataire">Single</SelectItem>
                  <SelectItem value="marié(e)">Married</SelectItem>
                  <SelectItem value="divorcé(e)">Divorced</SelectItem>
                  <SelectItem value="veuf(ve)">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Conditional field for number of children */}
            {(maritalStatus === "marié(e)" || maritalStatus === "divorcé(e)" || maritalStatus === "veuf(ve)") && (
              <div className="space-y-2">
                <Label htmlFor="numberOfChildren">
                  {maritalStatus === "marié(e)" && "Number of Children"}
                  {maritalStatus === "divorcé(e)" && "Number of Children"}
                  {maritalStatus === "veuf(ve)" && "Number of Children"}
                </Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  min="0"
                  value={numberOfChildren}
                  onChange={(e) => setNumberOfChildren(e.target.value)}
                  placeholder="Number of children"
                />
              </div>
            )}
            
            {/* Personal Details */}
            <div className="space-y-2">
              <Label htmlFor="cityOfResidence">City of Residence</Label>
              <Input
                id="cityOfResidence"
                value={cityOfResidence}
                onChange={(e) => setCityOfResidence(e.target.value)}
                placeholder="City of residence"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="personalPhone">Personal Phone</Label>
              <Input
                id="personalPhone"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                placeholder="Personal phone number"
              />
            </div>
            
            {/* Illness Information */}
            <div className="space-y-2">
              <Label htmlFor="illnessDuration">Illness Duration</Label>
              <Input
                id="illnessDuration"
                value={illnessDuration}
                onChange={(e) => setIllnessDuration(e.target.value)}
                placeholder="Duration of illness"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="treatingDoctor">Treating Doctor (Status)</Label>
              <Input
                id="treatingDoctor"
                value={treatingDoctor}
                onChange={(e) => setTreatingDoctor(e.target.value)}
                placeholder="Name and status of treating doctor"
              />
            </div>
            
            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tags (press Enter)"
                  onKeyDown={handleKeyDown}
                />
                <Button type="button" onClick={handleAddTag}>Add</Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove tag</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update Patient" : "Create Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
