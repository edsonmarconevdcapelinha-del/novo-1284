export const LOJAS = [
  { codigo: "13688", nome: "Capelinha" },
  { codigo: "13629", nome: "Sarzedo" },
] as const;

export type CodigoLoja = (typeof LOJAS)[number]["codigo"];

const CHAVE = "reposicao-cp:loja";

export function lerLoja(): CodigoLoja | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return LOJAS.some((l) => l.codigo === v) ? (v as CodigoLoja) : null;
  } catch {
    return null;
  }
}

export function gravarLoja(codigo: CodigoLoja) {
  try {
    localStorage.setItem(CHAVE, codigo);
  } catch {
    /* modo privado: segue só na memória */
  }
}

export function esquecerLoja() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* ignora */
  }
}

export function nomeLoja(codigo: string): string {
  return LOJAS.find((l) => l.codigo === codigo)?.nome ?? codigo;
}
