export type ItemHistorico = {
  entrada: string;
  sku: number | null;
  descricao: string | null;
  endereco: string | null;
  status: "ok" | "sem_endereco" | "nao_existe" | "invalido";
  em: number;
};

const CHAVE = "reposicao-cp:historico";
const MAX = 25;

export function lerHistorico(): ItemHistorico[] {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return [];
    const dados = JSON.parse(cru) as ItemHistorico[];
    return Array.isArray(dados) ? dados.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function gravarHistorico(itens: ItemHistorico[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens.slice(0, MAX)));
  } catch {
    /* modo privado / cota cheia: histórico é acessório */
  }
}

export function limparHistorico(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* ignora */
  }
}
