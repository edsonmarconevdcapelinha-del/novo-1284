import { cn } from "../lib/utils";

/**
 * Marca do app: código de barras (a bipagem) apoiado sobre a linha de
 * separação (o endereço). Desenhado em SVG para ficar nítido em qualquer
 * tamanho e herdar a cor do cabeçalho.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 34 32"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <g fill="currentColor">
        <rect x="1" y="3" width="3" height="18" />
        <rect x="6" y="3" width="2" height="18" />
        <rect x="10" y="3" width="4" height="18" />
        <rect x="16" y="3" width="2" height="18" />
        <rect x="20" y="3" width="3" height="18" />
      </g>
      {/* Coluna de destaque: a posição que o repositor tem de achar */}
      <rect x="26" y="3" width="4" height="18" fill="#7DD3FC" />
      {/* Linha de separação */}
      <rect x="0" y="25" width="34" height="4" fill="currentColor" />
    </svg>
  );
}
