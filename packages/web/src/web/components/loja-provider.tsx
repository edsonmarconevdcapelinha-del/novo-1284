import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import {
  esquecerLoja,
  gravarLoja,
  lerLoja,
  LOJAS,
  nomeLoja,
  type CodigoLoja,
} from "../lib/loja";
import { Logo } from "./logo";

type Ctx = {
  loja: CodigoLoja;
  nome: string;
  escolher: (codigo: CodigoLoja) => void;
  trocar: () => void;
};

const LojaContext = createContext<Ctx | null>(null);

/** Loja escolhida no aparelho. Sem loja, mostra o seletor em tela cheia. */
export function LojaProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [loja, setLoja] = useState<CodigoLoja | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setLoja(lerLoja());
    setPronto(true);
  }, []);

  const escolher = useCallback(
    (codigo: CodigoLoja) => {
      gravarLoja(codigo);
      setLoja(codigo);
      qc.clear();
    },
    [qc],
  );

  const trocar = useCallback(() => {
    esquecerLoja();
    setLoja(null);
    qc.clear();
  }, [qc]);

  const valor = useMemo<Ctx | null>(
    () => (loja ? { loja, nome: nomeLoja(loja), escolher, trocar } : null),
    [loja, escolher, trocar],
  );

  if (!pronto) return <div className="min-h-dvh bg-background" />;
  if (!valor) return <SeletorDeLoja onEscolher={escolher} />;

  return <LojaContext.Provider value={valor}>{children}</LojaContext.Provider>;
}

export function useLoja() {
  const ctx = useContext(LojaContext);
  if (!ctx) throw new Error("useLoja precisa estar dentro do LojaProvider");
  return ctx;
}

function SeletorDeLoja({ onEscolher }: { onEscolher: (codigo: CodigoLoja) => void }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-[1400px] items-stretch">
          <div className="flex items-center gap-2.5 bg-navy-deep px-3 py-2 sm:px-4">
            <Logo className="h-7 w-auto text-white sm:h-8" />
            <div className="flex flex-col justify-center">
              <span className="font-display text-[15px] font-extrabold uppercase leading-none tracking-tight text-white sm:text-base">
                Reposição <span className="text-sky-300">CP</span>
              </span>
              <span className="mt-0.5 text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-white/55">
                By: Marcone
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 pb-16 pt-8">
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
          Qual loja você está operando?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Cada loja tem a própria linha de separação. A escolha fica salva neste aparelho — você
          pode trocar depois pelo cabeçalho.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {LOJAS.map((l) => (
            <button
              key={l.codigo}
              type="button"
              onClick={() => onEscolher(l.codigo)}
              className="group flex flex-col items-start gap-3 border border-border bg-card px-5 py-6 text-left transition-colors hover:border-primary hover:bg-accent active:bg-accent"
            >
              <span className="flex size-11 items-center justify-center bg-accent text-primary group-hover:bg-white">
                <Store className="size-6" />
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-wide text-muted-foreground">
                {l.codigo}
              </span>
              <span className="font-display text-2xl font-bold leading-none text-navy">
                {l.nome}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
