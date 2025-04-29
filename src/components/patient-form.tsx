
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Patient, createPatient, updatePatient } from "@/lib/db";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface PatientFormProps {
  patient?: Patient;
  isEdit?: boolean;
}

export function PatientForm({ patient, isEdit = false }: PatientFormProps) {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load patient data if in edit mode
  useEffect(() => {
    if (patient) {
      setName(patient.name);
      setDateOfBirth(formatDateForInput(patient.dateOfBirth));
      setContactInfo(patient.contactInfo);
      setTags(patient.tags);
    }
  }, [patient]);

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !dateOfBirth || !contactInfo) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (isEdit && patient) {
        await updatePatient({
          ...patient,
          name,
          dateOfBirth: new Date(dateOfBirth).toISOString(),
          contactInfo,
          tags
        });
        toast({ title: "Success", description: "Patient updated successfully" });
      } else {
        await createPatient({
          name,
          dateOfBirth: new Date(dateOfBirth).toISOString(),
          contactInfo,
          tags
        });
        toast({ title: "Success", description: "Patient created successfully" });
      }
      
      navigate("/patients");
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
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
              <Label htmlFor="contactInfo">Contact Information *</Label>
              <Textarea
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Phone number, email, address, etc."
                required
              />
            </div>
            
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
            
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/patients")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEdit ? "Update Patient" : "Create Patient"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
