import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Delete, MapPin, ScanBarcode, Trash2, Users, XCircle } from "lucide-react";
import { StatusBar } from "../components/status-bar";
import { cn } from "../lib/utils";
import { useBipar } from "../queries/consulta";
import { gravarHistorico, lerHistorico, limparHistorico, type ItemHistorico } from "../lib/historico";

type Resultado = Awaited<ReturnType<ReturnType<typeof useBipar>["mutateAsync"]>>;

export default function BiparPage() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [flash, setFlash] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bipar = useBipar();

  useEffect(() => setHistorico(lerHistorico()), []);

  const focar = useCallback(() => inputRef.current?.focus(), []);
  useEffect(() => {
    focar();
  }, [focar]);

  const enviar = useCallback(
    async (valor: string) => {
      const limpo = valor.trim();
      if (!limpo) return;
      setErro(null);
      try {
        const r = await bipar.mutateAsync({ codigo: limpo });
        setResultado(r);
        setFlash((n) => n + 1);
        const item: ItemHistorico = {
          entrada: limpo,
          sku: r.sku,
          descricao: r.descricao,
          endereco: r.posicoes[0]?.endereco ?? null,
          status: r.status,
          em: Date.now(),
        };
        setHistorico((atual) => {
          const proximo = [item, ...atual];
          gravarHistorico(proximo);
          return proximo.slice(0, 25);
        });
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(r.status === "ok" ? 40 : [60, 50, 60]);
        }
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha na consulta. Verifique a conexão.");
      } finally {
        setCodigo("");
        focar();
      }
    },
    [bipar, focar],
  );

  const ok = resultado?.status === "ok";

  return (
    <div className="min-h-dvh bg-background" onClick={focar}>
      <StatusBar />

      <main className="mx-auto max-w-[1400px] px-3 pb-24 pt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-4">
        <div className="min-w-0 space-y-3">
          {/* Campo de bipagem */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviar(codigo);
            }}
            className="painel"
          >
            <div className="painel-titulo border-b border-border">
              <ScanBarcode className={cn("size-[18px]", bipar.isPending && "blink")} />
              Leitura do produto
              <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {bipar.isPending ? "consultando…" : "pronto"}
              </span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <input
                ref={inputRef}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                placeholder="Bipe o EAN"
                aria-label="Código EAN ou código do material"
                className="w-full border border-border bg-secondary px-3 py-2.5 font-mono text-2xl font-semibold tracking-wide text-navy outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-primary focus:bg-white sm:text-3xl"
              />
              {codigo && (
                <button
                  type="button"
                  onClick={() => {
                    setCodigo("");
                    focar();
                  }}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-navy"
                  aria-label="Limpar"
                >
                  <Delete className="size-5" />
                </button>
              )}
            </div>
            <p className="border-t border-border bg-secondary px-4 py-1.5 text-[11px] text-muted-foreground">
              Coletor ou digitação · Enter consulta
            </p>
          </form>

          {erro && (
            <p className="border-l-4 border-destructive bg-red-50 px-4 py-3 text-sm text-destructive">
              {erro}
            </p>
          )}

          {/* Resultado */}
          <div key={flash} className={cn(flash > 0 && (ok ? "flash-ok" : "flash-bad"))}>
            {resultado == null ? (
              <Vazio />
            ) : resultado.status === "ok" ? (
              <ResultadoOk resultado={resultado} />
            ) : (
              <ResultadoFalha resultado={resultado} />
            )}
          </div>

          {/* Teclado numérico para quando não há coletor */}
          <TecladoNumerico
            onDigito={(d) => setCodigo((v) => v + d)}
            onApagar={() => setCodigo((v) => v.slice(0, -1))}
            onEnviar={() => void enviar(codigo)}
            ocupado={bipar.isPending}
          />
        </div>

        {/* Histórico */}
        <aside className="mt-3 lg:mt-0">
          <div className="painel">
            <div className="painel-titulo border-b border-border">
              <Trash2 className="size-[18px] opacity-0" aria-hidden />
              <span className="-ml-7">Últimas bipagens</span>
              {historico.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    limparHistorico();
                    setHistorico([]);
                    focar();
                  }}
                  className="ml-auto flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                  limpar
                </button>
              )}
            </div>
            {historico.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma leitura ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {historico.map((h, i) => (
                  <li key={`${h.em}-${i}`} className="flex items-baseline gap-3 px-4 py-2.5">
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        h.status === "ok"
                          ? "bg-signal"
                          : h.status === "sem_endereco"
                            ? "bg-warning"
                            : "bg-destructive",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold text-navy">
                        {h.endereco ?? (h.status === "sem_endereco" ? "Sem endereço" : "Não existe")}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {h.sku ? `${h.sku} · ` : ""}
                        {h.descricao ?? h.entrada}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {new Date(h.em).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Vazio() {
  return (
    <div className="painel flex min-h-[34dvh] flex-col items-center justify-center px-6 text-center">
      <ScanBarcode className="size-10 text-border" />
      <p className="mt-4 font-display text-base font-semibold text-navy">Aguardando leitura</p>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Bipe o código de barras do produto. O endereço da linha de separação aparece aqui.
      </p>
    </div>
  );
}

function ResultadoOk({ resultado }: { resultado: Resultado }) {
  const principal = resultado.posicoes[0];
  const extras = resultado.posicoes.slice(1);
  if (!principal) return null;

  return (
    <div className="painel rise">
      <div className="painel-titulo border-b border-border">
        <MapPin className="size-[18px]" />
        Endereço na linha de separação
        <span className="ml-auto font-mono text-[12px] font-semibold text-muted-foreground">
          SKU {resultado.sku}
        </span>
      </div>

      <div className="px-4 py-6 sm:py-7">
        <p
          className="numero-grande uppercase"
          style={{ fontSize: "clamp(2.6rem, 11vw, 5rem)" }}
        >
          {principal.endereco}
        </p>
        <div className="mt-5 grid grid-cols-3 divide-x divide-border border border-border bg-secondary sm:max-w-md">
          <Campo rotulo="rua/estação" valor={principal.nomeEstacao} />
          <Campo rotulo="linha" valor={principal.linha ?? "—"} />
          <Campo rotulo="coluna" valor={principal.coluna ?? "—"} />
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="label">descrição</p>
        <p className="mt-0.5 text-base font-semibold leading-snug text-foreground sm:text-lg">
          {resultado.descricao ?? "Material sem descrição no cadastro"}
        </p>
      </div>

      {principal.divideCom.length > 0 && (
        <div className="border-t border-border border-l-4 border-l-warning bg-amber-50 px-4 py-3">
          <p className="label flex items-center gap-1.5 text-warning">
            <Users className="size-3.5" />
            posição dividida com
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {principal.divideCom.map((c) => (
              <li
                key={c}
                className="border border-warning/40 bg-white px-2 py-1 font-mono text-sm font-semibold text-warning"
              >
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Mais de um material ocupa {principal.endereco}. Confira a etiqueta antes de guardar.
          </p>
        </div>
      )}

      {extras.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="label">outras posições ({extras.length})</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {extras.map((p, i) => (
              <li
                key={`${p.endereco}-${i}`}
                className="border border-border bg-accent px-2 py-1 font-display text-sm font-bold text-navy"
              >
                {p.endereco}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResultadoFalha({ resultado }: { resultado: Resultado }) {
  const semEndereco = resultado.status === "sem_endereco";
  const invalido = resultado.status === "invalido";
  return (
    <div
      className={cn(
        "painel rise border-l-4",
        semEndereco ? "border-l-warning" : "border-l-destructive",
      )}
    >
      <div className="flex items-start gap-3 px-4 py-6">
        {semEndereco ? (
          <AlertTriangle className="mt-1 size-7 shrink-0 text-warning" />
        ) : (
          <XCircle className="mt-1 size-7 shrink-0 text-destructive" />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "font-display font-bold leading-tight",
              semEndereco ? "text-warning" : "text-destructive",
            )}
            style={{ fontSize: "clamp(1.7rem, 7vw, 2.6rem)" }}
          >
            {invalido ? "Código inválido" : semEndereco ? "Sem endereço" : "Não existe"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {invalido
              ? "A leitura não tinha dígitos. Bipe novamente."
              : semEndereco
                ? "O material está no cadastro, mas não tem posição na linha de separação atual."
                : "Esse código não foi encontrado na base. Confira a planilha do abastecimento."}
          </p>
          <div className="mt-4 grid grid-cols-2 divide-x divide-border border border-border bg-secondary sm:max-w-sm">
            <Campo rotulo="bipado" valor={resultado.entrada} />
            <Campo rotulo="sku calculado" valor={resultado.sku ? String(resultado.sku) : "—"} />
          </div>
          {resultado.descricao && (
            <div className="mt-4">
              <p className="label">descrição</p>
              <p className="mt-0.5 text-base font-semibold text-foreground">{resultado.descricao}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <p className="label">{rotulo}</p>
      <p className="mt-0.5 truncate font-display text-sm font-bold text-navy">{valor}</p>
    </div>
  );
}

function TecladoNumerico({
  onDigito,
  onApagar,
  onEnviar,
  ocupado,
}: {
  onDigito: (d: string) => void;
  onApagar: () => void;
  onEnviar: () => void;
  ocupado: boolean;
}) {
  const teclas = useMemo(() => ["1", "2", "3", "4", "5", "6", "7", "8", "9"], []);
  return (
    <div className="lg:hidden">
      <p className="label mb-2">sem coletor? digite</p>
      <div className="grid grid-cols-3 gap-2">
        {teclas.map((t) => (
          <Tecla key={t} onClick={() => onDigito(t)}>
            {t}
          </Tecla>
        ))}
        <Tecla onClick={onApagar}>
          <Delete className="mx-auto size-5" />
        </Tecla>
        <Tecla onClick={() => onDigito("0")}>0</Tecla>
        <button
          type="button"
          onClick={onEnviar}
          disabled={ocupado}
          className="bg-primary py-4 font-display text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors active:bg-navy disabled:opacity-40"
        >
          {ocupado ? "…" : "OK"}
        </button>
      </div>
    </div>
  );
}

function Tecla({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-border bg-card py-4 font-display text-xl font-bold text-navy shadow-[0_1px_2px_rgba(18,60,110,0.06)] transition-colors active:bg-accent"
    >
      {children}
    </button>
  );
}
