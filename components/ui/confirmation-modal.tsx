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

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    loading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    loading = false,
}: ConfirmationModalProps) {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-w-md rounded-xl p-6 bg-white dark:bg-gray-900 shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                            {description}
                        </DialogDescription>
                    )}
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
                            variant={variant}
                            onClick={onConfirm}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            {confirmText}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
