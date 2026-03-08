import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MAX_COMPARE = 3;

interface CompareContextType {
  compareIds: string[];
  toggleCompare: (id: string) => void;
  isComparing: (id: string) => boolean;
  clearCompare: () => void;
  goToCompare: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_COMPARE) {
        toast.error(`Máximo de ${MAX_COMPARE} cafés para comparar`);
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const isComparing = useCallback((id: string) => compareIds.includes(id), [compareIds]);
  const clearCompare = useCallback(() => setCompareIds([]), []);

  const goToCompare = useCallback(() => {
    if (compareIds.length < 2) {
      toast.error("Selecione pelo menos 2 cafés para comparar");
      return;
    }
    // Navigate handled by the component using this
    window.location.href = `/comparar?ids=${compareIds.join(",")}`;
  }, [compareIds]);

  return (
    <CompareContext.Provider value={{ compareIds, toggleCompare, isComparing, clearCompare, goToCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
