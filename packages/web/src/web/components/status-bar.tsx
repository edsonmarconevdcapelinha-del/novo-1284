import { Link, useLocation } from "wouter";
import { Repeat2, ScanBarcode, Upload } from "lucide-react";
import { cn } from "../lib/utils";
import { useStatusBase } from "../queries/base";
import { useLoja } from "./loja-provider";
import { Logo } from "./logo";

export function StatusBar() {
  const [rota] = useLocation();
  const status = useStatusBase();
  const { loja, nome, trocar } = useLoja();

  const posicoes = status.data?.posicoes;
  const atualizado = status.data?.ultimoAbastecimento
    ? new Date(status.data.ultimoAbastecimento).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : null;

  return (
    <header className="sticky top-0 z-30 w-full overflow-hidden bg-navy text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex w-full min-w-0 max-w-[1400px] items-stretch">
        {/* Bloco da marca, no lugar do "vd+" do portal */}
        <div className="flex shrink-0 items-center gap-2 bg-navy-deep px-2 py-2 sm:gap-2.5 sm:px-4">
          <Logo className="h-7 w-auto text-white sm:h-8" />
          <div className="flex flex-col justify-center">
            <span className="font-display text-[14px] font-extrabold uppercase leading-none tracking-tight text-white sm:text-base">
              Reposição <span className="text-sky-300">CP</span>
            </span>
            <span className="mt-0.5 text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-white/55">
              By: Marcone
            </span>
          </div>
        </div>

        {/* No celular as abas ficam só com o ícone, para tudo caber numa linha */}
        <nav className="flex min-w-0 items-stretch">
          <Aba to="/" ativo={rota === "/"} icone={<ScanBarcode className="size-5" />}>
            Bipar
          </Aba>
          <Aba
            to="/abastecer"
            ativo={rota.startsWith("/abastecer")}
            icone={<Upload className="size-5" />}
          >
            Abastecer
          </Aba>
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 pr-1.5 text-right sm:gap-4 sm:pr-4">
          {/* Loja atual — o repositor precisa ver de cara em qual base está bipando */}
          <button
            type="button"
            onClick={trocar}
            title="Trocar de loja"
            className="flex min-w-0 items-center gap-1 border border-white/20 bg-white/10 px-1.5 py-1.5 text-left transition-colors hover:bg-white/20 sm:gap-2 sm:px-2.5"
          >
            <span className="min-w-0 leading-tight">
              <span className="block font-mono text-[10px] font-semibold tracking-wide text-white/60">
                {loja}
              </span>
              <span className="block truncate text-[12px] font-semibold uppercase leading-none text-white sm:text-[13px]">
                {nome}
              </span>
            </span>
            <Repeat2 className="size-4 shrink-0 text-white/70" />
          </button>

          <div className="hidden leading-tight sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
              base de endereços
            </p>
            <p className="text-[13px] font-semibold text-white">
              {status.isLoading
                ? "carregando…"
                : status.isError
                  ? "indisponível"
                  : `${posicoes?.toLocaleString("pt-BR")} posições${atualizado ? ` · ${atualizado}` : ""}`}
            </p>
          </div>
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              status.isLoading
                ? "bg-white/50 blink"
                : status.isError
                  ? "bg-red-400"
                  : "bg-emerald-400",
            )}
          />
        </div>
      </div>
    </header>
  );
}

function Aba({
  to,
  ativo,
  icone,
  children,
}: {
  to: string;
  ativo: boolean;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      title={typeof children === "string" ? children : undefined}
      className={cn(
        "flex min-w-0 shrink-0 flex-col items-center justify-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold transition-colors sm:min-w-[84px] sm:px-4",
        ativo ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
      )}
    >
      {icone}
      {/* O nome da aba só aparece no PC; no celular o ícone basta */}
      <span className="hidden sm:block">{children}</span>
    </Link>
  );
}
