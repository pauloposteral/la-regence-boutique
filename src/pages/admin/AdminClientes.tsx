import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

const AdminClientes = () => {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold">Clientes</h1>
        <span className="font-body text-xs text-muted-foreground">({profiles.length})</span>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/50">
            {["Nome", "Telefone", "CPF", "Cadastro"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {profiles.map((p: any) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-body text-sm font-medium">{p.full_name || "—"}</td>
                <td className="px-4 py-3 font-body text-sm">{p.phone || "—"}</td>
                <td className="px-4 py-3 font-body text-sm">{p.cpf || "—"}</td>
                <td className="px-4 py-3 font-body text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhum cliente</p>}
      </div>
    </div>
  );
};

export default AdminClientes;
