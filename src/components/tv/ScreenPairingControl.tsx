import { useState } from "react";
import { formatMiB, parsePairingCode, type ScreenCredential } from "@/lib/tvScreenStatus";
import type { PairingState } from "@/hooks/useTVScreenHeartbeat";
import type { OfflineStatus } from "@/lib/tvOfflineStore";

/** Operator-only pairing and offline summary inside the hidden /video controls. */
export default function ScreenPairingControl({ pairing, onPair, onUnpair, offline, offlineMode, onRetryOffline }: {
  pairing: PairingState; onPair(credential: ScreenCredential): void; onUnpair(): void;
  offline: OfflineStatus; offlineMode: boolean; onRetryOffline(): void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const snapshotAge = offline.savedAt ? Math.max(0, Math.round((Date.now() - offline.savedAt) / 60_000)) : null;
  return <div className="space-y-2 text-xs text-white/75" aria-label="Pareamento e modo offline">
    <p>
      {pairing.credential
        ? pairing.rejected ? "Pareamento recusado (revogado ou substituído). Peça um novo código." : `Tela pareada${pairing.lastSentAt ? ` · último status enviado às ${new Date(pairing.lastSentAt).toLocaleTimeString("pt-BR")}` : " · aguardando primeiro envio"}`
        : "Tela não pareada: a reprodução funciona normalmente, sem status no painel."}
      {pairing.persistence === "memory" && " · Este navegador não permite guardar o pareamento; ele vale só até recarregar."}
    </p>
    <p>
      {!offline.available ? "Modo offline indisponível neste navegador (a reprodução online continua)."
        : `Offline: ${offline.cachedCount} de ${offline.eligibleCount} vídeos próprios guardados · ${formatMiB(offline.cachedBytes)}${snapshotAge !== null ? ` · programação salva há ${snapshotAge} min` : ""}${offlineMode ? " · exibindo programa local" : ""}`}
      {offline.available && <button type="button" className="ml-2 underline decoration-gold/60 underline-offset-4" onClick={onRetryOffline}>Tentar guardar novamente</button>}
    </p>
    {pairing.credential
      ? <button type="button" className="rounded-full border border-white/25 px-4 py-2" onClick={onUnpair}>Desparear este navegador</button>
      : open
        ? <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
            event.preventDefault();
            const credential = parsePairingCode(code);
            if (!credential) { setInvalid(true); return; }
            setCode(""); setInvalid(false); setOpen(false); onPair(credential);
          }}>
            <label className="min-w-0 flex-1 space-y-1"><span className="block">Código de pareamento</span>
              <input value={code} onChange={event => { setCode(event.target.value); setInvalid(false); }} autoComplete="off" spellCheck={false}
                aria-invalid={invalid} className="w-full rounded-lg border border-white/25 bg-brown-deep px-3 py-2 text-base text-white" /></label>
            <button type="submit" className="rounded-full bg-gold px-4 py-2 text-white">Parear</button>
            <button type="button" className="rounded-full border border-white/25 px-4 py-2" onClick={() => { setOpen(false); setCode(""); }}>Cancelar</button>
            {invalid && <p role="alert" className="w-full">Código inválido. Copie o código completo mostrado em /video/enviar.</p>}
          </form>
        : <button type="button" className="rounded-full border border-white/25 px-4 py-2" onClick={() => setOpen(true)}>Parear esta tela</button>}
  </div>;
}
