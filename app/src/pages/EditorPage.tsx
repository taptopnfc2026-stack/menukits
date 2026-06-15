import { useState, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useMenuContext } from '@/contexts/MenuContext';
import { getSession } from '@/lib/supabase';
import {
  ChevronLeft,
  MoreVertical,
  Star,
  Plus,
  Pencil,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Search,
  Upload,
  Download,
  Trash2,
  Tags,
  Image as ImageIcon,
  Eye,
  ListFilter,
  FolderPlus,
  Copy,
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
import { AddDishDialog } from '@/components/AddDishDialog';
import { NewSectionDialog } from '@/components/NewSectionDialog';
import { MenuPreviewDrawer } from '@/components/MenuPreviewDrawer';
import { suggestDietaryTags, suggestDishImage } from '@/lib/dish-ai';
import type { Menu, Section, Dish } from '@/types';

const ALLERGEN_KEYWORDS: Array<{ name: string; keywords: string[] }> = [
  { name: 'Gluten', keywords: ['bread', 'flour', 'wheat', 'barley', 'rye', 'pasta', 'noodle', 'dumpling', 'cake', 'pastry', 'crust', 'batter', 'breadcrumb', 'couscous'] },
  { name: 'Crustaceans', keywords: ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'scampi', 'langoustine'] },
  { name: 'Eggs', keywords: ['egg', 'mayonnaise', 'mayo', 'mousse', 'custard', 'hollandaise', 'omelet', 'omelette', 'quiche', 'meringue'] },
  { name: 'Fish', keywords: ['fish', 'salmon', 'tuna', 'cod', 'bass', 'anchovy', 'sardine', 'snapper', 'trout', 'caviar', 'roe'] },
  { name: 'Peanuts', keywords: ['peanut', 'groundnut', 'satay'] },
  { name: 'Soybeans', keywords: ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tamari', 'tempeh'] },
  { name: 'Milk', keywords: ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'lactose', 'parmesan', 'mozzarella', 'brie', 'gorgonzola', 'gruyère', 'gruyere', 'cheddar', 'feta'] },
  { name: 'Nuts', keywords: ['almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia', 'pine nut', 'praline', 'marzipan'] },
  { name: 'Celery', keywords: ['celery', 'celeriac'] },
  { name: 'Mustard', keywords: ['mustard', 'dijon'] },
  { name: 'Sesame', keywords: ['sesame', 'tahini'] },
  { name: 'Sulfites', keywords: ['sulfite', 'sulphite', 'wine', 'beer', 'vinegar', 'balsamic'] },
  { name: 'Lupin', keywords: ['lupin', 'lupine'] },
  { name: 'Molluscs', keywords: ['mollusc', 'mollusk', 'squid', 'octopus', 'snail', 'escargot', 'clam', 'oyster', 'mussel', 'scallop'] },
];

function detectLikelyAllergensForDish(dish: Dish): string[] {
  const text = `${dish.name || ''} ${dish.description || ''}`.toLowerCase();
  const detected = ALLERGEN_KEYWORDS
    .filter((item) => item.keywords.some((keyword) => text.includes(keyword)))
    .map((item) => item.name);
  return Array.from(new Set([...(dish.allergens || []), ...detected]));
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { completeStep } = useChecklist();
  const { getMenuById, updateMenu, setMenus } = useMenuContext();
  const foundMenu = getMenuById(id!);
  const [menu, setMenu] = useState<Menu>(
    () => foundMenu || { id: '0', title: 'New Menu', sections: [], isVisible: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  );

  // Save status: idle → saving → saved/error (auto-reset to idle)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

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

  // ─── Manual Save Button Handler ──────────────────
  const handleManualSave = useCallback(async () => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      const session = await getSession();
      if (!session?.access_token) {
        throw new Error('Please log in to save');
      }

      const payload = { ...menu, updatedAt: new Date().toISOString() };

      // Determine if this is a new (local-only) menu by checking ID format
      const isLocalId = /^\d{10,}$/.test(menu.id);
      let res: Response;

      if (!isLocalId) {
        // Existing menu — try PUT update
        res = await fetch(`/api/menus?id=${encodeURIComponent(menu.id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          // PUT succeeded — done!
          updateMenu(menu.id, () => payload);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          return;
        }

        // Only fallback to POST when menu doesn't exist (404)
        // For other errors (405, 403, etc.) report failure to user
        if (res.status !== 404) {
          const errText = await res.text().catch(() => '');
          console.error(`[Save] PUT failed (${res.status}): ${errText}`);
          throw new Error(`Update failed (${res.status}): ${errText || 'Server error'}`);
        }
        console.log(`[Save] Menu not found in DB, creating new...`);
      }

      // New menu (local timestamp ID) or 404 case — create via POST
      res = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res!.ok) {
        const errText = await res!.text().catch(() => '');
        throw new Error(errText || `Server error (${res!.status})`);
      }

      const result = await res!.json();

      // If the server assigned a new ID, update both local state and context
      if (result?.id && result.id !== menu.id) {
        console.log('[Save] New menu ID:', menu.id, '→', result.id);
        setMenu((prev) => ({ ...prev, id: result.id }));
        setMenus((prev) =>
          prev.map((m) => (m.id === menu.id ? { ...m, id: result.id } : m))
        );
      }

      // Sync into context so auto-save stays in sync
      updateMenu(menu.id, () => payload);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e: any) {
      console.error('[Save] Failed:', e);
      setSaveStatus('error');
      setSaveError(e?.message || 'Save failed — check console');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [menu, setMenus, updateMenu]);

  const [addDishOpen, setAddDishOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(menu.title);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [imageGenerateStatus, setImageGenerateStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [dietaryGenerateStatus, setDietaryGenerateStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const importInputRef = useRef<HTMLInputElement>(null);

  const dishRows = useMemo(() => {
    return menu.sections.flatMap((section) =>
      section.dishes.map((dish) => ({
        sectionId: section.id,
        sectionName: section.name,
        dish,
      }))
    );
  }, [menu.sections]);

  const categoryOptions = useMemo(
    () => menu.sections.map((section) => section.name).filter(Boolean),
    [menu.sections]
  );

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    dishRows.forEach(({ dish }) => {
      if (dish.tag) tags.add(dish.tag);
      dish.dietaryTags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [dishRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return dishRows.filter(({ sectionName, dish }) => {
      const matchesQuery =
        !normalizedQuery ||
        dish.name.toLowerCase().includes(normalizedQuery) ||
        dish.description.toLowerCase().includes(normalizedQuery) ||
        sectionName.toLowerCase().includes(normalizedQuery);
      const matchesCategory = categoryFilter === 'all' || sectionName === categoryFilter;
      const matchesTag =
        tagFilter === 'all' ||
        dish.tag === tagFilter ||
        dish.dietaryTags?.includes(tagFilter) ||
        dish.allergens?.includes(tagFilter);
      return matchesQuery && matchesCategory && matchesTag;
    });
  }, [categoryFilter, dishRows, query, tagFilter]);

  const selectedVisibleCount = filteredRows.filter(({ dish }) => selectedDishIds.includes(dish.id)).length;
  const allVisibleSelected = filteredRows.length > 0 && selectedVisibleCount === filteredRows.length;

  const updateDishField = <K extends keyof Dish>(
    sectionId: string,
    dishId: string,
    field: K,
    value: Dish[K]
  ) => {
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              dishes: section.dishes.map((dish) =>
                dish.id === dishId ? { ...dish, [field]: value } : dish
              ),
            }
          : section
      ),
    }));
  };

  const toggleRowSelection = (dishId: string) => {
    setSelectedDishIds((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = filteredRows.map(({ dish }) => dish.id);
    setSelectedDishIds((prev) => {
      if (allVisibleSelected) return prev.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const handleBulkDelete = () => {
    if (selectedDishIds.length === 0) return;
    if (!confirm(`Delete ${selectedDishIds.length} selected dishes?`)) return;
    saveMenu((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => ({
        ...section,
        dishes: section.dishes.filter((dish) => !selectedDishIds.includes(dish.id)),
      })),
    }));
    setSelectedDishIds([]);
  };

  const openSmartAddDish = () => {
    const firstSection = menu.sections[0];
    if (firstSection) {
      openAddDishForSection(firstSection.id);
      return;
    }

    const newSectionId = `s${Date.now()}`;
    const newSection: Section = {
      id: newSectionId,
      name: 'Main Menu',
      dishes: [],
      isExpanded: true,
    };
    saveMenu((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
    setActiveSectionId(newSectionId);
    setEditingDish(null);
    setAddDishOpen(true);
  };

  const handleExportMenu = () => {
    const blob = new Blob([JSON.stringify(menu, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${menu.title.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'menu'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportMenuFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const imported = JSON.parse(await file.text()) as Partial<Menu>;
      if (!Array.isArray(imported.sections)) {
        throw new Error('Imported file does not include menu sections.');
      }

      saveMenu((prev) => ({
        ...prev,
        title: imported.title || prev.title,
        sections: imported.sections as Section[],
        isVisible: imported.isVisible ?? prev.isVisible,
        updatedAt: new Date().toISOString(),
      }));
      setSelectedDishIds([]);
    } catch (error: any) {
      alert(error?.message || 'Could not import this menu file.');
    }
  };

  const handleAutoGenerateImages = () => {
    if (dishRows.length === 0 || imageGenerateStatus === 'generating') return;
    setImageGenerateStatus('generating');
    saveMenu((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      sections: prev.sections.map((section) => ({
        ...section,
        dishes: section.dishes.map((dish) => ({
          ...dish,
          image: suggestDishImage(dish),
        })),
      })),
    }));

    window.setTimeout(() => {
      setImageGenerateStatus('done');
      window.setTimeout(() => setImageGenerateStatus('idle'), 1800);
    }, 350);
  };

  const handleAutoGenerateDietaryTags = () => {
    if (dishRows.length === 0 || dietaryGenerateStatus === 'generating') return;
    setDietaryGenerateStatus('generating');
    saveMenu((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      sections: prev.sections.map((section) => ({
        ...section,
        dishes: section.dishes.map((dish) => ({
          ...dish,
          dietaryTags: suggestDietaryTags(dish),
        })),
      })),
    }));

    window.setTimeout(() => {
      setDietaryGenerateStatus('done');
      window.setTimeout(() => setDietaryGenerateStatus('idle'), 1800);
    }, 350);
  };

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
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/app">
              <Button variant="ghost" size="icon" className="mt-1 shrink-0 rounded-xl">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              {editingTitle ? (
                <Input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  onBlur={handleSaveTitle}
                  autoFocus
                  className="h-11 max-w-sm text-xl font-bold"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-950">
                    All Dishes ({dishRows.length})
                  </h1>
                  <button
                    onClick={() => {
                      setTitleValue(menu.title);
                      setEditingTitle(true);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Rename menu"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="mt-1 text-sm font-medium text-slate-500">
                Manage dishes from <span className="text-slate-800">{menu.title}</span> in one clean workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportMenuFile}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={() => importInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handleExportMenu}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-4 w-4" />
              View menu
            </Button>
            {saveStatus === 'saved' ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
                <Check className="h-4 w-4" />
                Saved
              </span>
            ) : saveStatus === 'error' ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-50 px-3 text-sm font-bold text-red-700" title={saveError}>
                <AlertCircle className="h-4 w-4" />
                Save failed
              </span>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="gap-2 rounded-xl bg-[#FFD400] font-bold text-[#151526] shadow-lg shadow-[#ffd400]/25 hover:bg-[#F2B900]"
                onClick={handleManualSave}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            )}
            <Button
              size="sm"
              className="gap-2 rounded-xl bg-[#FFD400] font-bold text-[#151526] shadow-lg shadow-[#ffd400]/25 hover:bg-[#F2B900]"
              onClick={openSmartAddDish}
            >
              <Plus className="h-4 w-4" />
              Add Dish
            </Button>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="h-4 w-4 rounded border-slate-300 accent-[#151526]"
                />
                Select all
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#F2B900] focus:ring-2 focus:ring-[#FFD400]/25"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setNewSectionOpen(true)}>
                <FolderPlus className="h-4 w-4" />
                Add category
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                disabled={selectedDishIds.length === 0}
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete {selectedDishIds.length > 0 ? `(${selectedDishIds.length})` : ''}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_auto] xl:w-[560px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dishes..."
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#F2B900] focus:ring-2 focus:ring-[#FFD400]/25"
              >
                <option value="all">All Tags</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl">
                <ListFilter className="h-4 w-4" />
                View
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-slate-300 accent-[#151526]"
                    />
                  </th>
                  <th className="w-28 px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span>Image</span>
                      <button
                        type="button"
                        onClick={handleAutoGenerateImages}
                        disabled={dishRows.length === 0 || imageGenerateStatus === 'generating'}
                        aria-label="AI generate dish images"
                        title="AI generate matching dish images for all dishes."
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#f1d36a] bg-[#fff8d8] text-[#8a6500] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFD400] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {imageGenerateStatus === 'generating' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : imageGenerateStatus === 'done' ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="w-44 px-3 py-4">Name</th>
                  <th className="w-64 px-3 py-4">Description</th>
                  <th className="w-28 px-3 py-4">Price</th>
                  <th className="w-48 px-3 py-4">Categories</th>
                  <th className="w-52 px-3 py-4">Allergens</th>
                  <th className="w-56 px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span>Dietary Tags</span>
                      <button
                        type="button"
                        onClick={handleAutoGenerateDietaryTags}
                        disabled={dishRows.length === 0 || dietaryGenerateStatus === 'generating'}
                        aria-label="AI generate dietary tags"
                        title="AI suggest dietary tags from dish names and descriptions. Reference only; please review manually."
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#f1d36a] bg-[#fff8d8] text-[#8a6500] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFD400] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {dietaryGenerateStatus === 'generating' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : dietaryGenerateStatus === 'done' ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="w-36 px-3 py-4">Visible</th>
                  <th className="w-32 px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(({ sectionId, sectionName, dish }) => (
                  <tr key={`${sectionId}-${dish.id}`} className="group align-middle transition hover:bg-[#fff8d8]/50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDishIds.includes(dish.id)}
                        onChange={() => toggleRowSelection(dish.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-[#151526]"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {dish.image ? (
                          <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-[#fffdf7] text-slate-400">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Input
                        value={dish.name}
                        onChange={(e) => updateDishField(sectionId, dish.id, 'name', e.target.value)}
                        className="h-11 rounded-xl font-semibold text-slate-900"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <textarea
                        value={dish.description}
                        onChange={(e) => updateDishField(sectionId, dish.id, 'description', e.target.value)}
                        className="min-h-[54px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-[#F2B900] focus:ring-2 focus:ring-[#FFD400]/25"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <Input
                        type="number"
                        value={dish.price}
                        onChange={(e) => updateDishField(sectionId, dish.id, 'price', Number(e.target.value))}
                        className="h-10 rounded-xl font-semibold tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                          <Tags className="h-3 w-3" />
                          {sectionName}
                        </span>
                        {dish.tag && (
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                            {dish.tag}
                          </span>
                        )}
                        {dish.isBestSeller && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            Best
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {dish.allergens?.length ? dish.allergens.slice(0, 3).map((allergen) => (
                          <span key={allergen} className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                            {allergen}
                          </span>
                        )) : (
                          <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-400">None</span>
                        )}
                        {(dish.allergens?.length || 0) > 3 && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">+{dish.allergens.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex max-w-[260px] flex-wrap gap-1.5">
                          {dish.dietaryTags?.length ? dish.dietaryTags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                              {tag}
                            </span>
                          )) : (
                            <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-400">None</span>
                          )}
                          {(dish.dietaryTags?.length || 0) > 3 && (
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">+{dish.dietaryTags.length - 3}</span>
                          )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dish.isVisible}
                          onCheckedChange={() => toggleDishVisibility(sectionId, dish.id)}
                          className="data-[state=checked]:bg-[#151526]"
                        />
                        <span className="text-sm font-semibold text-slate-600">{dish.isVisible ? 'Show' : 'Hide'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-xl px-3 font-bold text-[#8a6500] hover:bg-[#fff8d8]"
                          onClick={() => handleEditDish(sectionId, dish)}
                        >
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleDuplicateDish(sectionId, dish)} className="gap-2">
                              <Copy className="h-4 w-4" />
                              Duplicate dish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBestSeller(sectionId, dish.id)} className="gap-2">
                              <Star className="h-4 w-4" />
                              {dish.isBestSeller ? 'Remove best seller' : 'Mark as best seller'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRenameSection(sectionId)}>
                              Rename category
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateSection(sectionId)}>
                              Duplicate category
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteSection(sectionId)} className="text-red-600 focus:text-red-600">
                              Delete category
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteDish(sectionId, dish.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete dish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">No dishes found</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Try changing the search or filters, or add a new dish to this menu.
              </p>
              <Button className="mt-5 gap-2 rounded-xl bg-[#FFD400] font-bold text-[#151526] hover:bg-[#F2B900]" onClick={openSmartAddDish}>
                <Plus className="h-4 w-4" />
                Add Dish
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredRows.length === 0 ? 0 : 1} to {filteredRows.length} of {dishRows.length} dishes
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled>Previous</Button>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#151526] text-sm font-bold text-[#FFD400]">1</span>
              <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled>Next</Button>
            </div>
          </div>
        </div>
      </div>

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
        restaurantName="My Restaurant"
        initialMenuId={menu.id}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
