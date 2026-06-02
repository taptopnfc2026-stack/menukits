import { useState } from 'react';
import { Plus, FileText, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBlank: () => void;
  onUpload: () => void;
}

export function CreateMenuDialog({
  open,
  onOpenChange,
  onCreateBlank,
  onUpload,
}: CreateMenuDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="border-b px-6 py-4 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Create menu
          </DialogTitle>
          <p className="mt-1 text-sm text-gray-500">
            Choose how you want to create this menu.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 py-5">
          {/* Upload existing */}
          <button
            onClick={() => {
              onUpload();
              onOpenChange(false);
            }}
            className="group flex items-start gap-4 rounded-xl border-2 border-[#5544e4]/30 bg-[#5544e4]/5 p-4 text-left transition-all hover:border-[#5544e4]/60 hover:bg-[#5544e4]/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-shadow group-hover:shadow">
              <Upload className="h-5 w-5 text-[#5544e4]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Upload my existing menu</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Upload your printed menu or a PDF and turn it into a digital menu.
              </p>
            </div>
          </button>

          {/* Start from blank */}
          <button
            onClick={() => {
              onCreateBlank();
              onOpenChange(false);
            }}
            className="group flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-shadow group-hover:shadow">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Start from blank menu</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Build a new menu from scratch, starting with an empty menu.
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
