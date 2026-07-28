"use client";

import * as React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClearAllDialogProps {
  onConfirm: () => Promise<void> | void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
}

export function ClearAllDialog({
  onConfirm,
  trigger,
  title = "Clear All Data",
  description = "Are you sure you want to clear all data? This action cannot be undone.",
}: ClearAllDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      setOpen(false);
      toast.success("Data has been cleared", {
        description: "All records have been successfully removed.",
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear data", {
        description: "An error occurred while trying to clear the data.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="destructive"
            className="gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-none shadow-2xl bg-white/95 dark:bg-[#121828] backdrop-blur-xl">
        <DialogHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 mb-2">
            <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <DialogTitle className="text-xl font-semibold text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground/90">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* <div className="bg-muted/50 rounded-lg p-4 my-2 border border-muted/60 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Note:</span> 
            This will permanently delete all associated records.
          </p>
        </div> */}

        <DialogFooter className="sm:justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto min-w-[100px] border-muted-foreground/20 hover:bg-muted/50"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto min-w-[100px] shadow-md hover:shadow-lg transition-all"
          >
            {loading ? "Clearing..." : "Yes, Clear All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
