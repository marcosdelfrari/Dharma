"use client";

import {
  createContext,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import {
  formatWhatsappDisplay,
  normalizeWhatsappDigits,
  whatsappUrlFromPhone,
} from "@/lib/whatsapp";

const STORAGE_KEY = "dharma-landing-contact-v1";

type StoredLead = {
  name: string;
  phone: string;
};

type Step = "form" | "whatsapp";

type LandingContactContextValue = {
  open: boolean;
  openContact: () => void;
  closeContact: () => void;
};

const LandingContactContext = createContext<LandingContactContextValue | null>(null);

function readStoredLead(): StoredLead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLead;
    if (!parsed?.name?.trim() || !parsed?.phone?.trim()) return null;
    return { name: parsed.name.trim(), phone: parsed.phone.trim() };
  } catch {
    return null;
  }
}

function storeLead(lead: StoredLead) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lead));
  } catch {
    // ignore quota / private mode
  }
}

export function LandingContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openContact = useCallback(() => setOpen(true), []);
  const closeContact = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openContact, closeContact }),
    [open, openContact, closeContact],
  );

  return (
    <LandingContactContext.Provider value={value}>
      {children}
      <LandingContactModal open={open} onClose={closeContact} />
    </LandingContactContext.Provider>
  );
}

export function useLandingContact() {
  const ctx = useContext(LandingContactContext);
  if (!ctx) {
    throw new Error("useLandingContact must be used within LandingContactProvider");
  }
  return ctx;
}

function LandingContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [associationPhone, setAssociationPhone] = useState("");
  const [associationName, setAssociationName] = useState("a associação");

  useEffect(() => {
    if (!open) return;
    const stored = readStoredLead();
    if (stored) {
      setName(stored.name);
      setPhone(stored.phone);
      setStep("whatsapp");
    } else {
      setStep("form");
      setName("");
      setPhone("");
    }
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.getPublicConfig("registration");
        if (cancelled) return;
        const values = res.data?.values || {};
        const tel = String(values.VITE_ASSOCIATION_PHONE ?? "").trim();
        const assoc = String(values.VITE_ASSOCIATION_NAME ?? "").trim();
        if (tel) setAssociationPhone(tel);
        if (assoc) setAssociationName(assoc);
      } catch {
        // fallback vazio — botão desabilitado se não houver número
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const whatsappUrl = useMemo(() => {
    if (!associationPhone.trim()) return null;
    const greeting = name.trim()
      ? `Olá, sou ${name.trim()}. Vim pelo site e gostaria de falar com ${associationName}.`
      : `Olá, vim pelo site e gostaria de falar com ${associationName}.`;
    return whatsappUrlFromPhone(associationPhone, greeting);
  }, [associationPhone, associationName, name]);

  const phoneLabel = useMemo(() => {
    const fromAssoc = associationPhone.replace(/\D/g, "");
    if (fromAssoc.length >= 10) {
      const local =
        fromAssoc.startsWith("55") && fromAssoc.length >= 12
          ? fromAssoc.slice(2)
          : fromAssoc;
      return formatWhatsappDisplay(local);
    }
    const digits = normalizeWhatsappDigits(phone);
    return digits ? formatWhatsappDisplay(digits) : "";
  }, [associationPhone, phone]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const digits = normalizeWhatsappDigits(phone);
    if (!trimmedName) {
      setError("Informe seu nome.");
      return;
    }
    if (!digits) {
      setError("Informe um WhatsApp válido com DDD.");
      return;
    }
    setBusy(true);
    try {
      await api.createLandingLead({ name: trimmedName, phone: digits });
      storeLead({ name: trimmedName, phone: digits });
      setStep("whatsapp");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar seu contato. Tente de novo.",
      );
    } finally {
      setBusy(false);
    }
  }

  function onWhatsappClick() {
    onClose();
    router.push("/obrigado");
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-contact-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/55 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface-elevated text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  {step === "form" ? "Contato" : "Próximo passo"}
                </p>
                <h2
                  id="landing-contact-title"
                  className="mt-2 text-lg font-semibold tracking-tight"
                >
                  {step === "form"
                    ? "Como podemos te chamar?"
                    : `Fale com ${associationName} no WhatsApp.`}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                aria-label="Fechar"
                onClick={onClose}
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              {step === "form" ? (
                <form onSubmit={onSubmit} className="space-y-5">
                  <label className="block">
                    <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                      Nome
                    </span>
                    <input
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-dharma-lime/50 focus:ring-4 focus:ring-dharma-lime/10"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                      WhatsApp com DDD
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-dharma-lime/50 focus:ring-4 focus:ring-dharma-lime/10"
                    />
                  </label>

                  {error ? (
                    <p className="rounded-lg bg-negative/10 px-4 py-3 text-[13px] text-negative">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                  >
                    {busy ? "Salvando…" : "Continuar"}
                    {!busy ? <span aria-hidden>→</span> : null}
                  </button>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Seus dados entram na fila de acolhimento. Sem spam — só retorno da equipe.
                  </p>
                </form>
              ) : (
                <div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Seu contato já está registrado. Toque abaixo para abrir a conversa no
                    WhatsApp.
                  </p>
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onWhatsappClick}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-dharma-lime px-6 py-4 text-sm font-semibold text-black transition hover:brightness-105"
                    >
                      Chamar no WhatsApp
                    </a>
                  ) : (
                    <p className="mt-4 text-[13px] text-negative">
                      WhatsApp da associação ainda não configurado. Peça suporte à equipe.
                    </p>
                  )}
                  {phoneLabel ? (
                    <p className="mt-3 text-center text-[12px] text-muted">{phoneLabel}</p>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function LandingContactButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openContact } = useLandingContact();

  return (
    <button type="button" className={className} onClick={openContact}>
      {children}
    </button>
  );
}
