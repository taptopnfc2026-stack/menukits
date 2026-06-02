import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useMenuContext } from '@/contexts/MenuContext';
import {
  ChevronLeft,
  GripVertical,
  MoreVertical,
  Star,
  Plus,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddDishDialog } from '@/components/AddDishDialog';
import { NewSectionDialog } from '@/components/NewSectionDialog';
import { MenuPreviewDrawer } from '@/components/MenuPreviewDrawer';
import type { Menu, Section, Dish } from '@/types';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { completeStep } = useChecklist();
  const { getMenuById, updateMenu } = useMenuContext();
  const foundMenu = getMenuById(id!);
  const [menu, setMenu] = useState<Menu>(
    () => foundMenu || { id: '0', title: 'New Menu', sections: [], isVisible: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  );

  // Sync changes to both local state and global context (persistence)
  const saveMenu = useCallback((updater: Menu | ((prev: Menu) => Menu)) => {
    setMenu((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next.id && next.id !== '0') {
        try { updateMenu(next.id, () => next); } catch {}
      }
      return next;
    });
  }, [updateMenu]);

  const [addDishOpen, setAddDishOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(menu.title);
  const [previewOpen, setPreviewOpen] = useState(false);

  const toggleSection = (sectionId: string) => {
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      ),
    }));
  };

  const toggleDishVisibility = (sectionId: string, dishId: string) => {
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              dishes: s.dishes.map((d) =>
                d.id === dishId ? { ...d, isVisible: !d.isVisible } : d
              ),
            }
          : s
      ),
    }));
  };

  const handleAddDish = (dish: Omit<Dish, 'id'>) => {
    if (!activeSectionId) return;
    const newDish: Dish = {
      ...dish,
      id: `d${Date.now()}`,
    };
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === activeSectionId
          ? { ...s, dishes: [...s.dishes, newDish] }
          : s
      ),
    }));
  };

  const handleCreateSection = (name: string) => {
    const newSection: Section = {
      id: `s${Date.now()}`,
      name,
      dishes: [],
      isExpanded: true,
    };
    saveMenu((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const openAddDishForSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setEditingDish(null);
    setAddDishOpen(true);
  };

  // --- Dish-level actions ---
  const handleEditDish = (sectionId: string, dish: Dish) => {
    setActiveSectionId(sectionId);
    setEditingDish(dish);
    setAddDishOpen(true);
  };

  const handleUpdateDish = (dishData: Omit<Dish, 'id'>) => {
    if (!activeSectionId) return;

    if (editingDish) {
      // Update existing dish
      saveMenu((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === activeSectionId
            ? { ...s, dishes: s.dishes.map((d) => d.id === editingDish.id ? { ...d, ...dishData } : d) }
            : s
        ),
      }));
      setEditingDish(null);
    } else {
      // Create new dish
      const newDish: Dish = { ...dishData, id: `d${Date.now()}` };
      saveMenu((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === activeSectionId ? { ...s, dishes: [...s.dishes, newDish] } : s
        ),
      }));
    }
  };

  const handleDuplicateDish = (sectionId: string, dish: Dish) => {
    const dup: Dish = {
      ...dish,
      id: `d${Date.now()}`,
      name: `${dish.name} (copy)`,
    };
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const idx = s.dishes.findIndex((d) => d.id === dish.id);
        const nextDishes = [...s.dishes];
        nextDishes.splice(idx + 1, 0, dup);
        return { ...s, dishes: nextDishes };
      }),
    }));
  };

  const handleToggleBestSeller = (sectionId: string, dishId: string) => {
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, dishes: s.dishes.map((d) => d.id === dishId ? { ...d, isBestSeller: !d.isBestSeller } : d) }
          : s
      ),
    }));
  };

  const handleDeleteDish = (sectionId: string, dishId: string) => {
    if (!confirm('Delete this dish?')) return;
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, dishes: s.dishes.filter((d) => d.id !== dishId) }
          : s
      ),
    }));
  };

  const handleRenameSection = (sectionId: string) => {
    // Simple prompt-based rename for now
    const section = menu.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const newName = prompt('Enter section name:', section.name);
    if (newName && newName.trim()) {
      saveMenu((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, name: newName.trim() } : s
        ),
      }));
    }
  };

  const handleDuplicateSection = (sectionId: string) => {
    const section = menu.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const dup: Section = {
      ...section,
      id: `s${Date.now()}`,
      name: `${section.name} (copy)`,
      dishes: section.dishes.map((d) => ({ ...d, id: `d${Date.now()}_${d.id}` })),
    };
    const idx = menu.sections.findIndex((s) => s.id === sectionId);
    const nextSections = [...menu.sections];
    nextSections.splice(idx + 1, 0, dup);
    saveMenu((prev) => ({ ...prev, sections: nextSections }));
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!confirm('Delete this section?')) return;
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  const handleSaveTitle = () => {
    if (!titleValue.trim()) return;
    saveMenu((prev) => ({ ...prev, title: titleValue.trim() }));
    completeStep('business-name');
    setEditingTitle(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header - matches reference: back arrow + title with edit + View menu */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                onBlur={handleSaveTitle}
                autoFocus
                className="h-9 w-64 text-lg font-semibold"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">{menu.title}</h1>
              <button
                onClick={() => {
                  setTitleValue(menu.title);
                  setEditingTitle(true);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={() => setPreviewOpen(true)}
        >
          View menu
        </Button>
      </div>

      {/* Sections & Dishes */}
      <div className="space-y-4">
        {menu.sections.map((section) => (
          <div
            key={section.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            {/* Section header - collapsible */}
            <Collapsible open={section.isExpanded} onOpenChange={() => toggleSection(section.id)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180">
                    {/* Chevron down/up indicator */}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                  <span className="font-semibold text-gray-900">{section.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => handleRenameSection(section.id)}
                      className="gap-2"
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateSection(section.id)}
                      className="gap-2"
                    >
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteSection(section.id)}
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="divide-y divide-gray-100">
                  {section.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="flex items-start gap-4 px-5 py-3.5 pl-[52px] hover:bg-gray-50/50"
                    >
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{dish.name}</span>
                          {dish.isBestSeller && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              Best seller
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">{dish.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-semibold text-gray-900 tabular-nums">{dish.price}</span>
                        <Switch
                          checked={dish.isVisible}
                          onCheckedChange={() => toggleDishVisibility(section.id, dish.id)}
                          className="data-[state=checked]:bg-[#5544e4]"
                        />
                        <span className="hidden sm:inline w-[40px] text-sm text-gray-600">{dish.isVisible ? 'Show' : 'Hide'}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleEditDish(section.id, dish)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateDish(section.id, dish)}>
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBestSeller(section.id, dish.id)}>
                              {dish.isBestSeller ? 'Remove best seller' : 'Mark as best seller'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteDish(section.id, dish.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new dish button inside section */}
                <button
                  onClick={() => openAddDishForSection(section.id)}
                  className="flex w-full items-center justify-center gap-2 px-5 py-3 pl-[52px] text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  <Plus className="h-4 w-4" />
                  Add new dish
                </button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}

        {/* Add new section button */}
        <button
          onClick={() => setNewSectionOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        >
          <Plus className="h-4 w-4" />
          Add new section
        </button>
      </div>

      {/* Dialogs */}
      <NewSectionDialog
        open={newSectionOpen}
        onOpenChange={setNewSectionOpen}
        onSave={handleCreateSection}
      />

      <AddDishDialog
        open={addDishOpen}
        onOpenChange={(v) => { setAddDishOpen(v); if (!v) setEditingDish(null); }}
        onSave={handleUpdateDish}
        editingDish={editingDish}
      />

      {/* Menu Preview Drawer */}
      <MenuPreviewDrawer
        menus={[menu]}
        restaurantName="xiaochuan"
        initialMenuId={menu.id}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
