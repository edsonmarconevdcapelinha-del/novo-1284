import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useStatusBase() {
  return useQuery(orpc.baseDados.status.queryOptions({ staleTime: 15_000 }));
}

export function useSubirEnderecos() {
  const qc = useQueryClient();
  return useMutation(
    orpc.baseDados.subirEnderecos.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.baseDados.key() }),
    }),
  );
}

export function useSubirMateriais() {
  const qc = useQueryClient();
  return useMutation(
    orpc.baseDados.subirMateriais.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.baseDados.key() }),
    }),
  );
}
