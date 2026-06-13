import { useState } from 'react';
import { Languages, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export function NewSectionDialog({ open, onOpenChange, onSave }: NewSectionDialogProps) {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-gray-900">New section</DialogTitle>
            <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs text-gray-500 hover:text-gray-700">
              <Languages className="h-3.5 w-3.5" />
              Translations
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              className="h-10"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="min-w-[130px] bg-[#FFD400] font-bold text-[#151526] hover:bg-[#F2B900]"
            >
              Create section
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
