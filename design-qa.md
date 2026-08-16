# Design QA — identidade pastel celestial

- Source visual truth: `docs/design/approved-home-pastel.png`
- Implementation desktop: `docs/design/implementation-home-1440.png`
- Implementation mobile: `docs/design/implementation-home-375.png`
- Desktop viewport: 1440 × 1024 CSS px, device scale factor 1
- Mobile viewport: 375 × 844 CSS px, device scale factor 1
- Source pixels: 1536 × 1024
- Desktop implementation pixels: 1440 × 1024
- Mobile implementation pixels: 375 × 844
- State: página inicial, topo da página, menu móvel fechado

## Full-view comparison evidence

O source e a implementação foram abertos juntos e comparados no mesmo passe visual. A implementação preserva a estrutura dominante aprovada: cabeçalho técnico, trilho lateral, título grotesco em quatro linhas, descrição e CTAs à esquerda, instrumento celeste à direita e índice horizontal de três serviços. O enquadramento foi normalizado pela mesma altura de 1024 px; a diferença de largura do source (1536 px) foi considerada ao avaliar proporções.

## Required fidelity surfaces

- Fonts and typography: Manrope Variable reproduz o grotesco geométrico e IBM Plex Mono cobre rótulos técnicos. Pesos, tracking, quebras e hierarquia correspondem ao source sem truncamento.
- Spacing and layout rhythm: grade desktop equilibrada, hero termina aproximadamente na mesma dobra do source e não há overflow em 1440 px ou 375 px. A versão móvel recompõe a hierarquia em vez de comprimir o atlas desktop.
- Colors and visual tokens: marfim rosado, ameixa, lavanda lunar, rosa queimado e dourado suave estão centralizados em tokens e mantêm contraste legível.
- Image quality and asset fidelity: o instrumento celeste é um WebP dedicado, otimizado a partir do PNG RGBA gerado na mesma direção de arte, com 1254 × 1254 px e sem substituição por CSS/SVG artesanal. A imagem prioritária possui dimensões explícitas e `decoding="async"`; a decoração do login usa lazy loading.
- Copy and content: título, texto de apoio, CTAs e conteúdo original dos três atendimentos foram preservados.

## Focused comparison evidence

O hero foi verificado isoladamente porque concentra tipografia, CTA e imagem de maior fidelidade. O source posiciona o título em aproximadamente y=184 px; a captura final o posiciona em y=199 px. A diferença residual de 15 px é aceitável diante da largura normalizada e não altera a dobra. O atlas começa aproximadamente 8 px abaixo do source e mantém escala, foco e leitura equivalentes.

## Comparison history

1. Primeiro passe — bloqueado: hero e atlas estavam cerca de 50–70 px abaixo do source, empurrando o índice de serviços para fora da dobra (P2).
2. Correção: reduzidos `padding-top`, `min-height` e espaçamento interno do hero; nova captura alinhou título, atlas e dobra.
3. Segundo passe — aprovado: nenhuma diferença P0, P1 ou P2 restante. A pequena variação vertical e a ausência dos microdados decorativos à direita são P3 e não prejudicam hierarquia ou uso.

## Interaction and accessibility evidence

- Menu móvel abre e fecha e permanece navegável.
- Largura móvel: `scrollWidth = clientWidth = 375`, sem overflow horizontal.
- Largura desktop: `scrollWidth = clientWidth = 1440`, sem overflow horizontal.
- Rotas são lazy-loaded com skeleton geométrico.
- Consultas, documentos e listagens administrativas possuem skeletons; ações pendentes exibem progresso textual e visual.
- Motion respeita `prefers-reduced-motion`; foco visível e navegação por teclado permanecem disponíveis.
- O browser não exibiu overlay de erro durante carregamento, navegação móvel ou capturas.

## Findings

- Nenhum P0, P1 ou P2 aberto.
- P3: o source contém microdados decorativos adicionais no extremo direito; foram omitidos para preservar legibilidade e responsividade.
- P3: o cabeçalho da implementação é 16 px mais baixo que o mockup, sem impacto no fluxo.

## Implementation checklist

- [x] Composição desktop fiel ao source aprovado.
- [x] Reflow mobile em 375 px sem overflow.
- [x] Asset celestial real incorporado.
- [x] Motion, lazy loading, skeletons e estados de progresso.
- [x] `prefers-reduced-motion` e foco visível.
- [x] Testes automatizados e build executados.

## Follow-up polish

- Os microdados decorativos P3 podem ser adicionados em uma iteração futura caso contribuam para conteúdo real, evitando ruído ornamental sem significado.

final result: passed
