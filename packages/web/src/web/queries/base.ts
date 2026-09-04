import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useLoja } from "../components/loja-provider";

export function useStatusBase() {
  const { loja } = useLoja();
  return useQuery(orpc.baseDados.status.queryOptions({ input: { loja }, staleTime: 15_000 }));
}

export function useSubirEnderecos() {
  const qc = useQueryClient();
  const { loja } = useLoja();
  const m = useMutation(
    orpc.baseDados.subirEnderecos.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.baseDados.key() }),
    }),
  );
  return {
    ...m,
    mutate: (vars: { arquivo: string; nome: string }) => m.mutate({ ...vars, loja }),
  };
}

export function useSubirMateriais() {
  const qc = useQueryClient();
  const { loja } = useLoja();
  const m = useMutation(
    orpc.baseDados.subirMateriais.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.baseDados.key() }),
    }),
  );
  return {
    ...m,
    mutate: (vars: { arquivo: string; nome: string }) => m.mutate({ ...vars, loja }),
  };
}
