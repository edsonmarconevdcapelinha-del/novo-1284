import { z } from "zod";
import { asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { candidatosDeCodigo, eanToSku } from "../lib/sku";

export type Posicao = {
  endereco: string;
  nomeEstacao: string;
  nrRack: string | null;
  areaLinha: string | null;
  linha: string | null;
  coluna: string | null;
  /** Outros materiais que dividem a mesma posição (célula "82059;85826"). */
  divideCom: number[];
};

export type Resultado = {
  entrada: string;
  sku: number | null;
  descricao: string | null;
  posicoes: Posicao[];
  status: "ok" | "sem_endereco" | "nao_existe" | "invalido";
};

async function consultarCodigo(entrada: string): Promise<Resultado> {
  const candidatos = candidatosDeCodigo(entrada);
  if (candidatos.length === 0) {
    return { entrada, sku: null, descricao: null, posicoes: [], status: "invalido" };
  }

  const materiaisEncontrados = await db
    .select()
    .from(schema.materiais)
    .where(inArray(schema.materiais.codigo, candidatos));

  const posicoesEncontradas = await db
    .select()
    .from(schema.enderecos)
    .where(inArray(schema.enderecos.codigoMaterial, candidatos))
    .orderBy(asc(schema.enderecos.nomeEstacao), asc(schema.enderecos.linha), asc(schema.enderecos.coluna));

  // Prioridade: o candidato que tem endereço; depois o que tem cadastro; depois a fórmula.
  const comEndereco = candidatos.find((c) => posicoesEncontradas.some((p) => p.codigoMaterial === c));
  const comCadastro = candidatos.find((c) => materiaisEncontrados.some((m) => m.codigo === c));
  const sku = comEndereco ?? comCadastro ?? eanToSku(entrada);

  const material = materiaisEncontrados.find((m) => m.codigo === sku) ?? null;
  const posicoes = posicoesEncontradas
    .filter((p) => p.codigoMaterial === sku)
    .map((p) => ({
      endereco: p.endereco,
      nomeEstacao: p.nomeEstacao,
      nrRack: p.nrRack,
      areaLinha: p.areaLinha,
      linha: p.linha,
      coluna: p.coluna,
      divideCom: outrosDaCelula(p.codigosCelula, sku),
    }));

  const status: Resultado["status"] =
    posicoes.length > 0 ? "ok" : material ? "sem_endereco" : "nao_existe";

  return { entrada, sku, descricao: material?.nome ?? null, posicoes, status };
}

export const consulta = {
  /** Bipagem: EAN ou código do material -> endereço na linha de separação. */
  bipar: base
    .input(z.object({ codigo: z.string().min(1).max(40) }))
    .handler(({ input }) => consultarCodigo(input.codigo)),

  /** Busca manual do PC: por código, EAN ou parte da descrição. */
  buscar: base
    .input(z.object({ termo: z.string().min(2).max(80) }))
    .handler(async ({ input }) => {
      const termo = input.termo.trim();
      const soDigitos = termo.replace(/\D/g, "");

      if (soDigitos.length >= 4 && soDigitos.length === termo.replace(/\s/g, "").length) {
        const r = await consultarCodigo(termo);
        return r.status === "nao_existe" ? { itens: [] as ItemBusca[] } : { itens: [paraItem(r)] };
      }

      const materiaisEncontrados = await db
        .select()
        .from(schema.materiais)
        .where(like(sql`lower(${schema.materiais.nome})`, `%${termo.toLowerCase()}%`))
        .limit(40);

      if (materiaisEncontrados.length === 0) return { itens: [] as ItemBusca[] };

      const codigos = materiaisEncontrados.map((m) => m.codigo);
      const posicoes = await db
        .select()
        .from(schema.enderecos)
        .where(inArray(schema.enderecos.codigoMaterial, codigos));

      const itens: ItemBusca[] = materiaisEncontrados.map((m) => ({
        sku: m.codigo,
        descricao: m.nome,
        enderecos: posicoes.filter((p) => p.codigoMaterial === m.codigo).map((p) => p.endereco),
      }));
      return { itens };
    }),

  /** Lista as posições de uma estação (conferência de rua). */
  porEstacao: base
    .input(z.object({ estacao: z.string().min(1) }))
    .handler(async ({ input }) => {
      const rows = await db
        .select()
        .from(schema.enderecos)
        .where(eq(schema.enderecos.nomeEstacao, input.estacao))
        .orderBy(asc(schema.enderecos.linha), asc(schema.enderecos.coluna))
        .limit(500);
      const codigos = [...new Set(rows.map((r) => r.codigoMaterial))];
      const mats = codigos.length
        ? await db.select().from(schema.materiais).where(inArray(schema.materiais.codigo, codigos))
        : [];
      const nomes = new Map(mats.map((m) => [m.codigo, m.nome]));
      return {
        itens: rows.map((r) => ({
          endereco: r.endereco,
          sku: r.codigoMaterial,
          descricao: nomes.get(r.codigoMaterial) ?? null,
        })),
      };
    }),

  estacoes: base.handler(async () => {
    const rows = await db
      .selectDistinct({ estacao: schema.enderecos.nomeEstacao })
      .from(schema.enderecos)
      .orderBy(asc(schema.enderecos.nomeEstacao));
    return rows.map((r) => r.estacao);
  }),
};

export type ItemBusca = { sku: number; descricao: string | null; enderecos: string[] };

function paraItem(r: Resultado): ItemBusca {
  return {
    sku: r.sku ?? 0,
    descricao: r.descricao,
    enderecos: r.posicoes.map((p) => p.endereco),
  };
}

/** Da célula "82059;85826", devolve os outros códigos que dividem a mesma posição. */
function outrosDaCelula(codigosCelula: string | null, sku: number | null): number[] {
  if (!codigosCelula) return [];
  return codigosCelula
    .split(";")
    .map((p) => Number(p.replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0 && n !== sku);
}

export const _internals = { consultarCodigo };

// evita import não usado do `or` caso a busca mude
void or;
