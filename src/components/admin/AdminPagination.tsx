import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (p: number) => void;
}

const AdminPagination = ({ page, totalPages, total, onPrev, onNext, onGoTo }: Props) => {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="font-body text-xs text-muted-foreground">{total} itens · Página {page} de {totalPages}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          return (
            <span key={p} className="contents">
              {prev && p - prev > 1 && <span className="text-muted-foreground text-xs px-1">…</span>}
              <Button
                variant={p === page ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 font-body text-xs"
                onClick={() => onGoTo(p)}
              >
                {p}
              </Button>
            </span>
          );
        })}
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminPagination;
