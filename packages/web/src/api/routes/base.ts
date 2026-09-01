import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base as procedure } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { extrair, lerWorkbook, paraCodigo, paraCodigos, paraTexto } from "../lib/planilha";
import { montarEndereco } from "../lib/sku";

const LOTE = 400;

export const baseDados = {
  /** Status da base para o cabeçalho e o painel do PC. */
  status: procedure.handler(async () => {
    const [pos] = await db.select({ n: sql<number>`count(*)` }).from(schema.enderecos);
    const [comMaterial] = await db
      .select({ n: sql<number>`count(distinct ${schema.enderecos.codigoMaterial})` })
      .from(schema.enderecos);
    const [mats] = await db.select({ n: sql<number>`count(*)` }).from(schema.materiais);
    const [estacoes] = await db
      .select({ n: sql<number>`count(distinct ${schema.enderecos.nomeEstacao})` })
      .from(schema.enderecos);
    const historico = await db
      .select()
      .from(schema.uploads)
      .orderBy(desc(schema.uploads.criadoEm))
      .limit(8);

    return {
      posicoes: Number(pos?.n ?? 0),
      materiaisEnderecados: Number(comMaterial?.n ?? 0),
      materiaisCadastrados: Number(mats?.n ?? 0),
      estacoes: Number(estacoes?.n ?? 0),
      ultimoAbastecimento: historico[0]?.criadoEm ?? null,
      historico,
    };
  }),

  /** Sobe a planilha da linha de separação — substitui tudo. */
  subirEnderecos: procedure
    .input(z.object({ arquivo: z.string().min(1), nome: z.string().default("planilha.xlsx") }))
    .handler(async ({ input }) => {
      let linhas;
      try {
        const wb = lerWorkbook(input.arquivo);
        linhas = extrair(
          wb,
          ["Codigo Material", "Nome estacao"],
          ["Nr Rack", "Area Linha Separaçao", "Area Linha Separacao", "Linha", "Coluna"],
        ).linhas;
      } catch (e) {
        throw new ORPCError("BAD_REQUEST", {
          message: e instanceof Error ? e.message : "Não consegui ler o arquivo.",
        });
      }

      const registros = [];
      let ignoradas = 0;
      let posicoesCompartilhadas = 0;
      for (const l of linhas) {
        const celula = paraTexto(l["codigo material"]);
        // Uma posição pode guardar vários materiais na mesma célula ("82059;85826"):
        // cada código vira uma entrada apontando para o mesmo endereço.
        const codigos = paraCodigos(celula);
        if (codigos.length === 0) {
          ignoradas++;
          continue;
        }
        if (codigos.length > 1) posicoesCompartilhadas++;

        const estacao = paraTexto(l["nome estacao"]);
        const linha = paraTexto(l["linha"]);
        const coluna = paraTexto(l["coluna"]);
        const endereco = montarEndereco(estacao, linha, coluna);
        for (const codigo of codigos) {
          registros.push({
            nomeEstacao: estacao,
            nrRack: paraTexto(l["nr rack"]) || null,
            areaLinha: paraTexto(l["area linha separacao"] ?? l["area linha separaçao"]) || null,
            linha: linha || null,
            coluna: coluna || null,
            codigoMaterial: codigo,
            endereco,
            codigosCelula: codigos.length > 1 ? codigos.join(";") : null,
          });
        }
      }

      if (registros.length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Nenhuma linha com Codigo Material preenchido foi encontrada na planilha.",
        });
      }

      await db.delete(schema.enderecos);
      for (let i = 0; i < registros.length; i += LOTE) {
        await db.insert(schema.enderecos).values(registros.slice(i, i + LOTE));
      }
      await db
        .insert(schema.uploads)
        .values({ tipo: "enderecos", arquivo: input.nome, registros: registros.length });

      return { inseridos: registros.length, ignoradas, posicoesCompartilhadas };
    }),

  /** Sobe o cadastro de materiais (código -> nome) — substitui tudo. */
  subirMateriais: procedure
    .input(z.object({ arquivo: z.string().min(1), nome: z.string().default("planilha.xlsx") }))
    .handler(async ({ input }) => {
      let linhas;
      try {
        const wb = lerWorkbook(input.arquivo);
        linhas = extrair(wb, ["Codigo Material", "Nome Material"]).linhas;
      } catch (e) {
        throw new ORPCError("BAD_REQUEST", {
          message: e instanceof Error ? e.message : "Não consegui ler o arquivo.",
        });
      }

      const mapa = new Map<number, string>();
      let ignoradas = 0;
      for (const l of linhas) {
        const codigo = paraCodigo(l["codigo material"]);
        const nome = paraTexto(l["nome material"]);
        if (codigo === null || !nome) {
          ignoradas++;
          continue;
        }
        mapa.set(codigo, nome);
      }

      if (mapa.size === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Nenhum material válido encontrado (preciso de Codigo Material e Nome Material).",
        });
      }

      const registros = [...mapa].map(([codigo, nome]) => ({ codigo, nome }));
      await db.delete(schema.materiais);
      for (let i = 0; i < registros.length; i += LOTE) {
        await db.insert(schema.materiais).values(registros.slice(i, i + LOTE));
      }
      await db
        .insert(schema.uploads)
        .values({ tipo: "materiais", arquivo: input.nome, registros: registros.length });

      return { inseridos: registros.length, ignoradas };
    }),
};
