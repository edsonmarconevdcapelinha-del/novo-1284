import * as XLSX from "xlsx";

export type Linha = Record<string, unknown>;

/** Remove acentos, espaços duplicados e caixa para comparar cabeçalhos. */
export function normalizar(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function lerWorkbook(base64: string): XLSX.WorkBook {
  const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return XLSX.read(bin, { type: "array", cellDates: false, cellFormula: false });
}

type Achado = { linhas: Linha[]; mapa: Record<string, string>; aba: string };

/**
 * Procura, em todas as abas, a linha de cabeçalho que contenha as colunas
 * obrigatórias. Aceita cabeçalho fora da primeira linha e nomes com acento,
 * caixa ou espaçamento diferentes.
 */
export function extrair(
  wb: XLSX.WorkBook,
  obrigatorias: string[],
  opcionais: string[] = [],
): Achado {
  const alvo = [...obrigatorias, ...opcionais].map(normalizar);
  const req = obrigatorias.map(normalizar);
  let melhor: (Achado & { nota: number }) | null = null;

  for (const aba of wb.SheetNames) {
    const ws = wb.Sheets[aba];
    if (!ws) continue;
    const grade = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, raw: true });
    const limite = Math.min(grade.length, 15);

    for (let i = 0; i < limite; i++) {
      const cabecalho = (grade[i] ?? []).map(normalizar);
      const mapa: Record<string, string> = {};
      for (const col of alvo) {
        const idx = cabecalho.findIndex((h) => h === col);
        if (idx >= 0) mapa[col] = String(idx);
      }
      const faltando = req.filter((c) => !(c in mapa));
      if (faltando.length > 0) continue;

      const nota = Object.keys(mapa).length * 1000 + (grade.length - i);
      if (melhor && nota <= melhor.nota) continue;

      const linhas: Linha[] = [];
      for (let j = i + 1; j < grade.length; j++) {
        const bruta = grade[j] ?? [];
        const obj: Linha = {};
        let vazia = true;
        for (const [col, idxStr] of Object.entries(mapa)) {
          const v = bruta[Number(idxStr)];
          obj[col] = v;
          if (v !== undefined && v !== null && String(v).trim() !== "") vazia = false;
        }
        if (!vazia) linhas.push(obj);
      }
      melhor = { linhas, mapa, aba, nota };
    }
  }

  if (!melhor) {
    throw new Error(
      `Não encontrei as colunas obrigatórias (${obrigatorias.join(", ")}) em nenhuma aba do arquivo.`,
    );
  }
  return { linhas: melhor.linhas, mapa: melhor.mapa, aba: melhor.aba };
}

/** Extrai só os dígitos e converte para número, ignorando lixo de célula. */
export function paraCodigo(v: unknown): number | null {
  const s = String(v ?? "").replace(/\D/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Uma mesma posição da linha de separação pode guardar mais de um material.
 * Nesse caso a célula Codigo Material vem com os códigos juntos, separados por
 * ponto e vírgula (ex.: "82059;85826"), barra, vírgula, pipe, "e" ou quebra de
 * linha. Devolve cada código como um número, sem repetição e na ordem original.
 */
export function paraCodigos(v: unknown): number[] {
  const bruto = String(v ?? "").trim();
  if (!bruto) return [];

  const pedacos = bruto
    .split(/[;,/|\n\r\t]+|\s+e\s+|\s{2,}|\s+/gi)
    .map((p) => p.replace(/\D/g, ""))
    .filter(Boolean);

  const vistos = new Set<number>();
  const codigos: number[] = [];
  for (const p of pedacos) {
    const n = Number(p);
    if (!Number.isFinite(n) || n <= 0 || vistos.has(n)) continue;
    vistos.add(n);
    codigos.push(n);
  }
  return codigos;
}

export function paraTexto(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}
