# Reposição CP — Design System

Estética: **portal corporativo VD+ / O Boticário**. Interface clara, densa e funcional,
com cabeçalho azul-marinho, cartões brancos de cantos praticamente retos e números grandes
em destaque. Nada de decoração — a tela é uma ferramenta de operação.

## Cores (CSS vars em `packages/web/src/web/styles.css`)

| Token | Hex | Uso |
|---|---|---|
| `--background` | `#ECEEF1` | Fundo da página (cinza claro do portal) |
| `--card` | `#FFFFFF` | Cartões / painéis |
| `--border` | `#D5DBE2` | Bordas de 1px |
| `--navy` | `#123C6E` | Barra superior, números grandes, valores |
| `--navy-deep` | `#0C2C52` | Bloco da marca no canto esquerdo do header |
| `--primary` | `#1A5FA4` | Títulos e ícones de cartão, botões, foco |
| `--accent` | `#E7EEF6` | Chips e destaques azuis suaves |
| `--foreground` | `#1B2733` | Texto principal |
| `--muted-foreground` | `#6E7A88` | Rótulos e apoio |
| `--signal` | `#1E8E3E` | Sucesso (gravação ok, status online) |
| `--warning` | `#B26A00` | Sem endereço / posição dividida |
| `--destructive` | `#C62828` | Erro / código não existe |

## Tipografia

- **Display**: Archivo (600–800) — títulos, endereço gigante, valores numéricos.
- **Corpo**: Source Sans 3 (400–700) — textos, descrições, rótulos.
- **Mono**: IBM Plex Mono — campo de bipagem, SKU, códigos, horários.

## Componentes

- `painel` — cartão branco, borda 1px `--border`, sombra `0 1px 2px rgba(18,60,110,.06)`, raio 2px.
- `painel-titulo` — cabeçalho do cartão: ícone + texto 15px semibold em `--primary`, borda inferior.
- `numero-grande` — Archivo bold em `--navy`; o endereço usa `clamp(2.6rem, 11vw, 5rem)`.
- `label` — 11px, caixa alta, semibold, `--muted-foreground`.
- Estados usam **faixa lateral de 4px** (borda esquerda colorida) + fundo pastel, no lugar de molduras neon.

## Header

Barra fixa azul-marinho ocupando a largura toda: bloco `cp+` em azul mais escuro à esquerda,
abas com ícone acima do rótulo (padrão do menu VD+), status da base alinhado à direita.

## Layout

Densidade controlada: gaps de 12px, padding interno 16px, grade de indicadores 2 col (mobile) / 4 col (desktop).
Bipar usa 1 coluna no celular e `1fr + 360px` (histórico à direita) no desktop.
