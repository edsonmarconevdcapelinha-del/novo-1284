import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Bipagem: mutation porque cada leitura é um evento, não um estado cacheado. */
export function useBipar() {
  return useMutation(orpc.consulta.bipar.mutationOptions());
}

export function useBuscar(termo: string) {
  return useQuery(
    orpc.consulta.buscar.queryOptions({
      input: { termo },
      enabled: termo.trim().length >= 2,
      staleTime: 30_000,
    }),
  );
}

export function useEstacoes() {
  return useQuery(orpc.consulta.estacoes.queryOptions({ staleTime: 5 * 60_000 }));
}

export function usePorEstacao(estacao: string | null) {
  return useQuery(
    orpc.consulta.porEstacao.queryOptions({
      input: { estacao: estacao ?? "" },
      enabled: !!estacao,
      staleTime: 60_000,
    }),
  );
}
