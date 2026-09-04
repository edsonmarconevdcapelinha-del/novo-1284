import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Uma posição da linha de separação (aba "BD" da planilha original). */
export const enderecos = sqliteTable(
  "enderecos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Código da loja: cada loja tem a própria linha de separação. */
    loja: text("loja").notNull().default("13629"),
    nomeEstacao: text("nome_estacao").notNull(),
    nrRack: text("nr_rack"),
    areaLinha: text("area_linha"),
    linha: text("linha"),
    coluna: text("coluna"),
    codigoMaterial: integer("codigo_material").notNull(),
    /** Endereço legível: CONCATENATE(estacao," / ",linha,"-",coluna) */
    endereco: text("endereco").notNull(),
    /**
     * Conteúdo original da célula quando a posição guarda mais de um material
     * ("82059;85826"). Nulo quando a célula tinha um código só.
     */
    codigosCelula: text("codigos_celula"),
  },
  (t) => [
    index("idx_enderecos_codigo").on(t.codigoMaterial),
    index("idx_enderecos_loja_codigo").on(t.loja, t.codigoMaterial),
    index("idx_enderecos_loja_estacao").on(t.loja, t.nomeEstacao),
  ],
);

/** Cadastro de materiais (aba "BD2"): código -> nome. */
export const materiais = sqliteTable("materiais", {
  codigo: integer("codigo").primaryKey(),
  nome: text("nome").notNull(),
});

/** Auditoria de cada abastecimento feito pelo PC. */
export const uploads = sqliteTable("uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Loja de onde partiu o abastecimento. */
  loja: text("loja").notNull().default("13629"),
  tipo: text("tipo").notNull(),
  arquivo: text("arquivo").notNull(),
  registros: integer("registros").notNull(),
  criadoEm: integer("criado_em", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
