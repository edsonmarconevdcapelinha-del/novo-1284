import { z } from "zod";

/** Lojas atendidas pelo CD. Cada uma tem a própria linha de separação. */
export const LOJAS = [
  { codigo: "13688", nome: "Capelinha" },
  { codigo: "13629", nome: "Sarzedo" },
] as const;

export type CodigoLoja = (typeof LOJAS)[number]["codigo"];

/** Loja dos dados que já estavam na base antes do suporte a múltiplas lojas. */
export const LOJA_PADRAO: CodigoLoja = "13629";

export const zLoja = z.enum(["13688", "13629"]);

export function nomeLoja(codigo: string): string {
  return LOJAS.find((l) => l.codigo === codigo)?.nome ?? codigo;
}
