import { useRef, useState } from "react";
import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { StatusBar } from "../components/status-bar";
import { cn } from "../lib/utils";
import { useStatusBase, useSubirEnderecos, useSubirMateriais } from "../queries/base";
import { useBuscar } from "../queries/consulta";
import { useLoja } from "../components/loja-provider";

export default function AbastecerPage() {
  const status = useStatusBase();
  const { loja, nome } = useLoja();

  return (
    <div className="min-h-dvh bg-background">
      <StatusBar />

      <main className="mx-auto max-w-[1400px] px-3 pb-20 pt-4">
        <header className="pb-4">
          <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
            Abastecimento da base
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Suba a planilha da linha de separação sempre que ela for atualizada. Cada envio{" "}
            <strong className="font-semibold text-foreground">
              substitui toda a base da loja {loja} · {nome}
            </strong>{" "}
            — a outra loja não é afetada. O celular passa a consultar a versão nova na hora.
          </p>
          <p className="mt-2 border-l-4 border-primary bg-accent px-3 py-2 text-[13px] leading-relaxed text-foreground">
            Você está abastecendo <strong className="font-semibold">{loja} · {nome}</strong>. Para
            subir a planilha da outra loja, troque de loja no cabeçalho antes de enviar o arquivo.
          </p>
        </header>

        {/* Indicadores */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Indicador
            valor={status.data?.posicoes}
            rotulo="posições na linha"
            carregando={status.isLoading}
          />
          <Indicador
            valor={status.data?.materiaisEnderecados}
            rotulo="materiais endereçados"
            carregando={status.isLoading}
          />
          <Indicador
            valor={status.data?.materiaisCadastrados}
            rotulo="materiais no cadastro"
            carregando={status.isLoading}
          />
          <Indicador valor={status.data?.estacoes} rotulo="ruas/estações" carregando={status.isLoading} />
        </section>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <CartaoUpload
            titulo="Linha de separação"
            descricao="Planilha com as posições. Colunas esperadas: Nome estacao, Nr Rack, Area Linha Separaçao, Linha, Coluna, Codigo Material. Uma posição pode ter vários códigos na mesma célula, separados por ponto e vírgula (82059;85826)."
            tipo="enderecos"
          />
          <CartaoUpload
            titulo="Cadastro de materiais"
            descricao="Planilha código → descrição. Colunas esperadas: Codigo Material, Nome Material. Só precisa subir quando entram produtos novos."
            tipo="materiais"
          />
        </div>

        <BuscaManual />

        {/* Histórico de abastecimentos */}
        <section className="painel mt-4">
          <div className="painel-titulo border-b border-border">
            <Database className="size-[18px]" />
            Histórico de abastecimentos
          </div>
          {status.isLoading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">carregando…</p>
          ) : status.data && status.data.historico.length > 0 ? (
            <ul className="divide-y divide-border">
              {status.data.historico.map((h) => (
                <li key={h.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      h.tipo === "enderecos"
                        ? "bg-accent text-navy"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {h.tipo === "enderecos" ? "linha separação" : "materiais"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{h.arquivo}</span>
                  <span className="font-display text-sm font-bold text-navy">
                    {h.registros.toLocaleString("pt-BR")}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {new Date(h.criadoEm).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum abastecimento ainda.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function Indicador({
  valor,
  rotulo,
  carregando,
}: {
  valor: number | undefined;
  rotulo: string;
  carregando: boolean;
}) {
  return (
    <div className="painel px-4 py-4">
      <p className="numero-grande text-3xl sm:text-4xl">
        {carregando ? "—" : (valor ?? 0).toLocaleString("pt-BR")}
      </p>
      <p className="label mt-1.5">{rotulo}</p>
    </div>
  );
}

function CartaoUpload({
  titulo,
  descricao,
  tipo,
}: {
  titulo: string;
  descricao: string;
  tipo: "enderecos" | "materiais";
}) {
  const enderecos = useSubirEnderecos();
  const materiais = useSubirMateriais();
  const envio = tipo === "enderecos" ? enderecos : materiais;
  const [arraste, setArraste] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processar(arquivo: File | undefined) {
    if (!arquivo) return;
    setErroLocal(null);
    if (!/\.(xlsx|xlsm|xls|csv)$/i.test(arquivo.name)) {
      setErroLocal("Use um arquivo .xlsx, .xls, .xlsm ou .csv.");
      return;
    }
    if (arquivo.size > 40 * 1024 * 1024) {
      setErroLocal("Arquivo acima de 40 MB. Exporte só as abas necessárias.");
      return;
    }
    const buffer = new Uint8Array(await arquivo.arrayBuffer());
    let bin = "";
    const passo = 8192;
    for (let i = 0; i < buffer.length; i += passo) {
      bin += String.fromCharCode(...buffer.subarray(i, i + passo));
    }
    envio.mutate({ arquivo: btoa(bin), nome: arquivo.name });
  }

  const mensagemErro = erroLocal ?? (envio.error ? envio.error.message : null);

  return (
    <section className="painel">
      <div className="painel-titulo border-b border-border">
        <FileSpreadsheet className="size-[18px]" />
        {titulo}
      </div>

      <div className="px-4 py-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">{descricao}</p>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArraste(true);
          }}
          onDragLeave={() => setArraste(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArraste(false);
            void processar(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-8 text-center transition-colors",
            arraste ? "border-primary bg-accent" : "border-border bg-secondary hover:border-primary",
            envio.isPending && "pointer-events-none opacity-60",
          )}
        >
          <input
            ref={inputRef}
            aria-label="Selecionar planilha"
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              void processar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {envio.isPending ? (
            <>
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="mt-3 text-sm font-semibold text-primary">Gravando base…</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Planilhas grandes levam alguns segundos. Não feche a página.
              </p>
            </>
          ) : (
            <>
              <Upload className="size-6 text-primary" />
              <p className="mt-3 text-sm font-semibold text-navy">Arraste a planilha ou clique</p>
              <p className="mt-1 text-[12px] text-muted-foreground">.xlsx · .xls · .csv</p>
            </>
          )}
        </label>

        {envio.isSuccess && !envio.isPending && (
          <div className="mt-3 flex items-start gap-2 border-l-4 border-signal bg-emerald-50 px-3 py-2.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" />
            <p className="text-[13px] leading-relaxed text-signal">
              {envio.data.inseridos.toLocaleString("pt-BR")} registros gravados
              {envio.data.ignoradas > 0
                ? ` · ${envio.data.ignoradas.toLocaleString("pt-BR")} linhas sem código ignoradas`
                : ""}
              {"posicoesCompartilhadas" in envio.data && envio.data.posicoesCompartilhadas > 0
                ? ` · ${envio.data.posicoesCompartilhadas.toLocaleString("pt-BR")} posições com mais de um código`
                : ""}
              .
            </p>
          </div>
        )}

        {mensagemErro && (
          <div className="mt-3 flex items-start gap-2 border-l-4 border-destructive bg-red-50 px-3 py-2.5">
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-[13px] leading-relaxed text-destructive">{mensagemErro}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function BuscaManual() {
  const [termo, setTermo] = useState("");
  const busca = useBuscar(termo);

  return (
    <section className="painel mt-4">
      <div className="painel-titulo border-b border-border">
        <Search className="size-[18px]" />
        Conferência manual
      </div>

      <div className="px-4 py-4">
        <input
          aria-label="Conferência manual"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="EAN, código do material ou parte da descrição"
          className="w-full border border-border bg-secondary px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:bg-white"
        />

        {termo.trim().length >= 2 && (
          <div className="mt-4">
            {busca.isLoading ? (
              <p className="text-sm text-muted-foreground">buscando…</p>
            ) : busca.isError ? (
              <p className="text-sm text-destructive">Falha na busca.</p>
            ) : busca.data && busca.data.itens.length > 0 ? (
              <ul className="divide-y divide-border border border-border">
                {busca.data.itens.map((item) => (
                  <li
                    key={item.sku}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2.5 odd:bg-secondary/60"
                  >
                    <span className="font-mono text-sm font-semibold text-navy">{item.sku}</span>
                    <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                      {item.descricao ?? "sem descrição"}
                    </span>
                    {item.enderecos.length > 0 ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {item.enderecos.map((e, i) => (
                          <span
                            key={`${e}-${i}`}
                            className="flex items-center gap-1 bg-accent px-1.5 py-0.5 font-display text-xs font-bold text-navy"
                          >
                            <MapPin className="size-3" />
                            {e}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-warning">
                        sem endereço
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nada encontrado para “{termo}”.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
