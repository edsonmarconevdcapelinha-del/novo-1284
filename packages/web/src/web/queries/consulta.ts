import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useLoja } from "../components/loja-provider";

/** Bipagem: mutation porque cada leitura é um evento, não um estado cacheado. */
export function useBipar() {
  const { loja } = useLoja();
  const m = useMutation(orpc.consulta.bipar.mutationOptions());
  return {
    ...m,
    // A loja entra aqui para nenhuma tela precisar lembrar de mandá-la.
    mutateAsync: (vars: { codigo: string }) => m.mutateAsync({ ...vars, loja }),
  };
}

export function useBuscar(termo: string) {
  const { loja } = useLoja();
  return useQuery(
    orpc.consulta.buscar.queryOptions({
      input: { termo, loja },
      enabled: termo.trim().length >= 2,
      staleTime: 30_000,
    }),
  );
}

export function useEstacoes() {
  const { loja } = useLoja();
  return useQuery(orpc.consulta.estacoes.queryOptions({ input: { loja }, staleTime: 5 * 60_000 }));
}

export function usePorEstacao(estacao: string | null) {
  const { loja } = useLoja();
  return useQuery(
    orpc.consulta.porEstacao.queryOptions({
      input: { estacao: estacao ?? "", loja },
      enabled: !!estacao,
      staleTime: 60_000,
    }),
  );
}
