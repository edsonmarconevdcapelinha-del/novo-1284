import { Link, useLocation } from "wouter";
import { ScanBarcode, Upload } from "lucide-react";
import { cn } from "../lib/utils";
import { useStatusBase } from "../queries/base";

export function StatusBar() {
  const [rota] = useLocation();
  const status = useStatusBase();

  const posicoes = status.data?.posicoes;
  const atualizado = status.data?.ultimoAbastecimento
    ? new Date(status.data.ultimoAbastecimento).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : null;

  return (
    <header className="sticky top-0 z-30 bg-navy text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex max-w-[1400px] items-stretch">
        {/* Bloco da marca, no lugar do "vd+" do portal */}
        <div className="flex flex-col justify-center bg-navy-deep px-3 py-2 sm:px-4">
          <span className="font-display text-[15px] font-extrabold uppercase leading-none tracking-tight text-white sm:text-base">
            Reposição <span className="text-sky-300">CP</span>
          </span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-white/60">
            By: Marcone
          </span>
        </div>

        <nav className="flex items-stretch">
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

        <div className="ml-auto hidden items-center gap-4 pr-4 text-right sm:flex">
          <div className="leading-tight">
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
              "size-2 rounded-full",
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
      className={cn(
        "flex min-w-[84px] flex-col items-center justify-center gap-1 px-4 py-1.5 text-[12px] font-semibold transition-colors",
        ativo ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
      )}
    >
      {icone}
      {children}
    </Link>
  );
}
