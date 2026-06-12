import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GripVertical,
  MoreVertical,
  Plus,
  Pencil,
  Copy,
  ArrowUp,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateMenuDialog } from '@/components/CreateMenuDialog';
import { UploadMenuDialog } from '@/components/UploadMenuDialog';
import { MenuPreviewDrawer } from '@/components/MenuPreviewDrawer';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useMenuContext } from '@/contexts/MenuContext';
import type { Menu } from '@/types';

export default function MenusPage() {
  const navigate = useNavigate();
  const { completeStep } = useChecklist();
  const { menus, setMenus } = useMenuContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Auto-complete: create menu step if user already has menus
  useEffect(() => {
    if (menus.length > 0) completeStep('create-menu');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renamingMenuId, setRenamingMenuId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const toggleMenuVisibility = (menuId: string) => {
    setMenus((prev) =>
      prev.map((m) =>
        m.id === menuId ? { ...m, isVisible: !m.isVisible } : m
      )
    );
  };

  const handleCreateBlank = () => {
    completeStep('create-menu');
    const newMenu: Menu = {
      id: Date.now().toString(),
      title: 'New Menu',
      sections: [],
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMenus((prev) => [newMenu, ...prev]);
  };

  const handleUploadGenerate = (generatedMenu: Menu) => {
    completeStep('create-menu');
    setMenus((prev) => [generatedMenu, ...prev]);
  };

  const handleDuplicate = (menu: Menu) => {
    const dup: Menu = {
      ...menu,
      id: Date.now().toString(),
      title: `${menu.title} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMenus((prev) => [...prev, dup]);
  };

  const handleDelete = (menuId: string) => {
    setMenus((prev) => prev.filter((m) => m.id !== menuId));
  };

  const handleMoveUp = (menuId: string) => {
    setMenus((prev) => {
      const idx = prev.findIndex((m) => m.id === menuId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const openRename = (menu: Menu) => {
    setRenamingMenuId(menu.id);
    setRenameValue(menu.title);
    setRenameOpen(true);
  };

  const confirmRename = () => {
    if (!renamingMenuId || !renameValue.trim()) return;
    setMenus((prev) =>
      prev.map((m) =>
        m.id === renamingMenuId ? { ...m, title: renameValue.trim() } : m
      )
    );
    setRenameOpen(false);
    setRenamingMenuId(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">My menus</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            onClick={() => setPreviewOpen(true)}
          >
            View menu
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 bg-[#5544e4] hover:bg-[#4433cc]"
          >
            <Plus className="h-4 w-4" />
            Add menu
          </Button>
        </div>
      </div>

      {/* Menu list or empty state */}
      {menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 px-4">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5544e4]/10">
            <FileText className="h-8 w-8 text-[#5544e4]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No menus yet</h2>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            Create your first menu to get started. You can start from scratch or upload an existing menu.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setCreateOpen(true)}
              className="gap-1.5 bg-[#5544e4] hover:bg-[#4433cc]"
            >
              <Plus className="h-4 w-4" />
              Create menu
            </Button>
            <Button
              variant="outline"
              onClick={() => setUploadOpen(true)}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Upload & generate
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => (
          <div
            key={menu.id}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            {/* Drag handle */}
            <GripVertical className="h-5 w-5 shrink-0 text-gray-300" />

            {/* Info - clickable to navigate */}
            <Link to={`/app/editor/${menu.id}`} className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">{menu.title}</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {menu.sections.length} section{menu.sections.length !== 1 ? 's' : ''} ·{' '}
                {menu.sections.reduce((acc, s) => acc + s.dishes.length, 0)} dish
                {menu.sections.reduce((acc, s) => acc + s.dishes.length, 0) !== 1 ? 'es' : ''}
              </p>
            </Link>

            {/* Toggle + Actions */}
            <div
              className="flex shrink-0 items-center gap-2"
              onClick={(e) => e.preventDefault()}
            >
              <Switch
                checked={menu.isVisible}
                onCheckedChange={() => toggleMenuVisibility(menu.id)}
                className="data-[state=checked]:bg-[#5544e4]"
              />
              <span className="text-sm text-gray-600 w-[40px]">{menu.isVisible ? 'Show' : 'Hide'}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => navigate(`/app/editor/${menu.id}`)} className="gap-2">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRename(menu)} className="gap-2">
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(menu)} className="gap-2">
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMoveUp(menu.id)}
                    className="gap-2"
                  >
                    <ArrowUp className="h-3.5 w-3.5" /> Move up
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(menu.id)}
                    className="gap-2 text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
        )}

      {/* Create menu dialog */}
      <CreateMenuDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateBlank={handleCreateBlank}
        onUpload={() => setUploadOpen(true)}
      />

      {/* Upload menu dialog */}
      <UploadMenuDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onGenerate={handleUploadGenerate}
      />

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-base font-semibold">Rename menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Menu name"
                onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                autoFocus
                className="h-10"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmRename}
                disabled={!renameValue.trim()}
                className="bg-[#5544e4] hover:bg-[#4433cc]"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Preview Drawer */}
      <MenuPreviewDrawer
        menus={menus}
        restaurantName="My Restaurant"
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
