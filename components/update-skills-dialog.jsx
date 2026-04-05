"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateUserSkills, getUserSkills } from "@/actions/user";
import { toast } from "sonner";
import { Settings, Loader2 } from "lucide-react";

export function UpdateSkillsDialog() {
  const [open, setOpen] = useState(false);
  const [skillsStr, setSkillsStr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (open) {
       const fetchSkills = async () => {
          setIsFetching(true);
          try {
             const currentSkills = await getUserSkills();
             setSkillsStr(currentSkills.join(", "));
          } catch(err) {
             console.error("Failed to fetch skills:", err);
          } finally {
             setIsFetching(false);
          }
       };
       fetchSkills();
    }
  }, [open]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const skillsArray = skillsStr.split(",").map((s) => s.trim()).filter((s) => s !== "");
      await updateUserSkills(skillsArray);
      toast.success("Skills updated successfully!");
      setOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to update skills");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:block">Add/Update Skills</span>
         </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add/Update Your Skills</DialogTitle>
          <DialogDescription>
            Enter your skills as a comma-separated list. We use these to generate highly tailored Mock Interviews and Interview Prep questions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
           {isFetching ? (
             <div className="flex items-center justify-center p-4">
               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
             </div>
           ) : (
             <div className="flex flex-col gap-2">
               <textarea
                 className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                 placeholder="e.g. React, Node.js, Python, Project Management"
                 value={skillsStr}
                 onChange={(e) => setSkillsStr(e.target.value)}
               />
               <p className="text-xs text-muted-foreground">Separate each skill with a comma.</p>
             </div>
           )}
           <Button onClick={handleSave} disabled={isLoading || isFetching} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Skills"
              )}
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
