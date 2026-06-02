import { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface ChecklistStep {
  id: string;
  label: string;
  completed: boolean;
  /** Navigation path for incomplete steps with arrow */
  actionPath?: string;
}

interface ChecklistContextValue {
  steps: ChecklistStep[];
  completedCount: number;
  totalSteps: number;
  percentage: number;
  completeStep: (stepId: string) => void;
  resetChecklist: () => void;
  isAllCompleted: boolean;
}

const DEFAULT_STEPS: ChecklistStep[] = [
  { id: 'business-name', label: 'Set your business name', completed: false },
  { id: 'create-menu', label: 'Create your first menu', completed: false },
  { id: 'restaurant-details', label: 'Add your restaurant details', completed: false, actionPath: '/app/restaurant' },
  { id: 'cover-image', label: 'Upload a cover image', completed: false },
  { id: 'menu-language', label: 'Set your menu language', completed: false },
  { id: 'qr-code', label: 'Download your QR code', completed: false, actionPath: '/app/qr-code' },
];

const STORAGE_KEY = 'menukits-checklist';

function loadFromStorage(): ChecklistStep[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(steps: ChecklistStep[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
  } catch {}
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<ChecklistStep[]>(() => loadFromStorage() || DEFAULT_STEPS);

  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) => {
      const step = prev.find((s) => s.id === stepId);
      if (!step || step.completed) return prev;
      const next = prev.map((s) =>
        s.id === stepId ? { ...s, completed: true } : s
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetChecklist = useCallback(() => {
    setSteps(DEFAULT_STEPS);
    saveToStorage(DEFAULT_STEPS);
  }, []);

  const completedCount = useMemo(() => steps.filter((s) => s.completed).length, [steps]);
  const totalSteps = steps.length;
  const percentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isAllCompleted = completedCount === totalSteps;

  return (
    <ChecklistContext.Provider value={{ steps, completedCount, totalSteps, percentage, completeStep, resetChecklist, isAllCompleted }}>
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error('useChecklist must be used within ChecklistProvider');
  return ctx;
}
