"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

export const DELETE_MODAL_VERSION = "DeleteModal_v3__ONCONFIRM_WORKING";

interface DeleteModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: T) => void | Promise<void>;
  data?: T | null;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteModal<T = any>({
  isOpen,
  onClose,
  onConfirm,
  data = null,
  message = "Are you sure you want to delete this item?",
  confirmText = "Delete",
  cancelText = "Cancel",
}: DeleteModalProps<T>) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    console.log("delete - data", data);

    if (!data) return;

    try {
      setLoading(true);

      console.log("BEFORE calling onConfirm");
      await onConfirm(data);
      console.log("AFTER calling onConfirm");

      onClose(); // ✅ close after successful confirm
    } catch (e) {
      console.error("DeleteModal onConfirm error:", e);
      // keep modal open if error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md rounded-xl p-6 bg-white dark:bg-gray-900 shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Trash className="w-6 h-6 text-red-600" />
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Confirmation
            </DialogTitle>
          </div>

          {/* ✅ Fix the shadcn warning */}
          <DialogDescription className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg"
            >
              {cancelText}
            </Button>

            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {loading ? "Deleting..." : confirmText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
