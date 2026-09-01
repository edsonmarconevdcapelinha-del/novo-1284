/**
 * Regra da planilha original: SKU = LEFT(RIGHT(codigo;6);5)
 *
 * O EAN interno do CP carrega o código do material nos dígitos finais:
 * 7891033474660 -> RIGHT(...,6) = "474660" -> LEFT(...,5) = "47466"
 *
 * Quando o operador digita/bipa o próprio código do material (5 dígitos),
 * a fórmula devolve o mesmo valor: "87802" -> "87802".
 */
export function eanToSku(raw: string): number | null {
  const digitos = String(raw ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const ultimos6 = digitos.length > 6 ? digitos.slice(-6) : digitos;
  const sku = ultimos6.slice(0, 5);
  if (!sku) return null;
  const n = Number(sku);
  return Number.isFinite(n) ? n : null;
}

/**
 * Candidatos de busca, em ordem de prioridade:
 * 1. o SKU pela fórmula da planilha
 * 2. o número cru (cobre códigos de 6 dígitos, que a fórmula truncaria)
 */
export function candidatosDeCodigo(raw: string): number[] {
  const digitos = String(raw ?? "").replace(/\D/g, "");
  if (!digitos) return [];
  const lista: number[] = [];
  const sku = eanToSku(digitos);
  if (sku !== null) lista.push(sku);
  if (digitos.length <= 7) {
    const cru = Number(digitos.replace(/^0+/, "") || "0");
    if (Number.isFinite(cru) && cru > 0 && !lista.includes(cru)) lista.push(cru);
  }
  return lista;
}

/** Monta o endereço legível igual ao CONCATENATE da planilha. */
export function montarEndereco(estacao: string, linha: string, coluna: string): string {
  const e = (estacao ?? "").toString().trim();
  const l = (linha ?? "").toString().trim();
  const c = (coluna ?? "").toString().trim();
  if (!l && !c) return e;
  return `${e} / ${l}-${c}`;
}
