import type { BrandConfig } from "@/types/brand";
import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";
import { derivePalette } from "./palette";

/**
 * The visual half of the agent's spec.
 *
 * The old prompt only carried loose advice (font size ranges, "gradiente dá profundidade"),
 * so every carousel came out as flat gradients and rounded cards. This module replaces that
 * with an executable system: an exact palette derived from the brand, an exact type scale
 * derived from the slide dimensions, one ground rhythm, a fixed set of archetypes, and two
 * full HTML exemplars. Concrete values beat adjectives; the exemplars carry most of the
 * quality, so keep them impeccable if you edit them.
 *
 * Text is pt-BR (the agent answers in pt-BR) and avoids the em-dash on purpose, so the
 * model has nothing to imitate when writing slide copy.
 */

/** Editorial serif used only for numerals, one emphasized word, and pull quotes. */
export const ACCENT_SERIF = "Instrument Serif";

interface Scale {
  displayXl: number;
  displayL: number;
  title: number;
  body: number;
  bodySm: number;
  kicker: number;
  numeral: number;
  footer: number;
  padX: number;
  padTop: number;
  padBottom: number;
}

/** Type scale grows with slide height so 9:16 does not look under-set and 1:1 over-set. */
function buildScale(aspectRatio: AspectRatio): Scale {
  const { height } = DIMENSIONS[aspectRatio];
  const k = Math.max(0.92, Math.min(height / 1350, 1.12));
  const px = (base: number) => Math.round((base * k) / 2) * 2;
  return {
    displayXl: px(96),
    displayL: px(76),
    title: px(48),
    body: px(30),
    bodySm: px(26),
    kicker: 20,
    numeral: px(230),
    footer: px(22),
    padX: 88,
    padTop: Math.round(height * 0.06),
    padBottom: Math.round(height * 0.066),
  };
}

export function buildDesignSystem(
  brand: BrandConfig,
  aspectRatio: AspectRatio
): string {
  const p = derivePalette(brand.colors);
  const s = buildScale(aspectRatio);
  const { width, height } = DIMENSIONS[aspectRatio];
  const heading = brand.fonts.heading || "Inter";
  const body = brand.fonts.body || "Inter";
  const logo = brand.logoPath;

  return `## Execução: sistema visual (silencioso, nunca vire assunto)

Aplique sem comentar e sem perguntar. O objetivo é um carrossel que pareça caro: editorial,
com respiro, contraste alto e um único gesto forte por slide. Se o usuário quiser mudar o
visual, ele mexe na identidade da marca ou no preset de estilo, não nesta conversa.

### Paleta (use estes hex, não invente outros)

Fundo escuro (ink)
- Fundo: ${p.ink} | Bloco elevado sobre ink: ${p.inkRaised}
- Texto: ${p.inkText} | Texto secundário: ${p.inkMuted} | Filete: ${p.inkLine}
- Acento sobre ink: ${p.accentOnInk} | Destaque de palavra: ${p.highlight}

Fundo claro (paper)
- Fundo: ${p.paper} | Bloco elevado sobre paper: ${p.paperRaised}
- Texto: ${p.paperText} | Texto secundário: ${p.paperMuted} | Filete: ${p.paperLine}
- Acento sobre paper: ${p.accentOnPaper}

Véu para imagem de fundo (obrigatório sob qualquer texto sobre foto):
${p.scrim}

O véu é pesado embaixo de propósito: a foto continua visível na metade de cima e o texto
ancora no escuro embaixo. Nunca escureça a imagem inteira, isso mata a foto e o slide vira
um fundo sólido caro de gerar.

Consequência direta: em slide com foto, o topo fica limpo. Kicker, marca e todo o texto
descem para o bloco de baixo, sobre a parte escura do véu. Texto no topo de uma foto some
assim que o céu ou a parede aparecem claros ali.

Nunca use #000000, #ffffff puro nem cor fora desta lista. Nada de gradiente colorido de
duas matizes diferentes. Gradiente só como véu escuro sobre imagem.

### Ritmo de fundos

O carrossel alterna ink e paper por função, e essa alternância é o que dá cara de editorial:

- Slide 1 (hook): ink, com imagem de fundo.
- Slide 2 (transição): paper.
- Tease: alterna paper e ink. Nunca 3 slides seguidos no mesmo fundo.
- Penúltimo (clímax): ink, com imagem de fundo.
- Último (ação): ink sólido, sem imagem, acento no CTA.

### Grade e espaço

- Tela: ${width}x${height}px exatos. Padding: ${s.padTop}px topo, ${s.padX}px laterais, ${s.padBottom}px base.
- Três zonas verticais numa coluna flex: kicker no topo, bloco principal e rodapé ancorados
  embaixo. Isso se faz com \`margin-bottom:auto\` no kicker, não com \`space-between\`, que
  joga o bloco principal pro meio da tela e abre um vazio morto entre ele e o rodapé.
- O respiro fica em cima, o peso fica embaixo. Nunca centralize o bloco na tela inteira.
- Tudo alinhado à esquerda. Centralizado só em citação de página inteira.
- Medida do texto: display no máximo 26 caracteres por linha, corpo no máximo 46. Use
  \`max-width\` em px para forçar isso, nunca deixe a linha correr até a margem.
- Todo display e todo título levam \`text-wrap:balance\`, que equilibra o comprimento das
  linhas. Display no máximo 3 linhas. Nunca deixe a última linha com uma palavra só.
- Conteúdo crítico nos 80% centrais da altura. Em 4:5 o centro é o que aparece cortado em
  1:1 no grid do perfil.

### Escala tipográfica (px exatos, não improvise)

- Display do hook: ${s.displayXl}px / line-height 1.02 / letter-spacing -0.035em / peso 780
- Statement (clímax, frase forte): ${s.displayL}px / 1.06 / -0.03em / peso 760
- Título de conteúdo: ${s.title}px / 1.14 / -0.02em / peso 700
- Corpo: ${s.body}px / 1.45 / peso 420. Corpo secundário: ${s.bodySm}px
- Kicker (rótulo do topo): ${s.kicker}px / peso 600 / letter-spacing 0.18em / text-transform uppercase
- Numeral gigante: ${s.numeral}px / line-height 0.82, sempre na serifa de acento
- Rodapé: ${s.footer}px

Exatamente 3 níveis de hierarquia por slide. Um quarto tamanho na tela já parece amador.

### Fontes

- Títulos e display: "${heading}"
- Corpo, kicker e rodapé: "${body}"
- Serifa de acento: "${ACCENT_SERIF}", peso 400, e só nestes três casos: numeral gigante,
  UMA palavra em itálico dentro do display, e citação. Nunca em corpo, nunca em kicker,
  nunca duas vezes no mesmo slide.

### Detalhes que fazem parecer caro

- Filete de 1px separando kicker e rodapé do conteúdo. Nunca borda em volta de caixa.
- Rodapé com paginação em maiúsculas: "${(brand.name || "Marca").toUpperCase()}" à esquerda, "03 / 08" à direita.
- Raio de canto 0. Se precisar de bloco, use 4px no máximo. Card arredondado empilhado é proibido.
- Logo: o arquivo entra só em fundo paper, 28 a 32px de altura.${logo ? ` Caminho: ${logo}` : ""}
  Sobre ink e sobre foto, escreva o nome da marca em maiúsculas no estilo do kicker, no
  rodapé. Logo escuro some no escuro, e filtro de inversão destrói logo que tem fundo próprio.
- Uma palavra do display em destaque por slide, no máximo. Destaque é cor ou itálico serifado,
  nunca marca-texto, nunca sublinhado.
- Sombra só quando algo realmente flutua sobre imagem: 0 40px 90px rgba(0,0,0,.35). Nada de
  sombra padrão em texto ou bloco sobre fundo sólido.
- Textura opcional sobre imagem, sutil:
  repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px)

### Proibido

Emoji. Ícone genérico ou bolinha colorida. Texto sobre foto sem véu. Tudo centralizado.
Card branco arredondado com sombra suave. Gradiente arco-íris ou de duas matizes. Mais de
2 pesos de fonte por slide. Bold em tudo. Texto justificado. Barra de progresso decorativa.
Aspas tipo balão. Setas 3D. Qualquer coisa que pareça template de banco de slides.

### Arquétipos (escolha um por slide, pela função)

1. Capa editorial: imagem full-bleed, véu, topo limpo, kicker e display ancorados embaixo, indicador de arrasto no rodapé.
2. Statement: paper ou ink sólido, uma frase em display, nada mais competindo.
3. Numeral: numeral gigante em serifa, título abaixo, uma linha de corpo. Para dado ou etapa.
4. Lista hierárquica: 3 itens no máximo, cada um com filete acima, número em maiúsculas e frase curta.
5. Citação: serifa em itálico, ${s.title}px, atribuição em kicker. Só uma por carrossel.
6. Contraste: dois blocos verticais, o de cima em paper com o erro, o de baixo em ink com o certo.
7. Clímax: imagem full-bleed com véu forte, statement curto, acento numa palavra.
8. Ação: ink sólido, frase de CTA em display curto, uma linha de apoio, nome da marca no rodapé.

### Exemplar 1: capa editorial com imagem (copie a estrutura, troque o conteúdo)

<div style="position:relative;width:${width}px;height:${height}px;overflow:hidden;background:${p.ink};font-family:'${body}',sans-serif;">
  <img src="/uploads/ARQUIVO.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
  <div style="position:absolute;inset:0;background:${p.scrim};"></div>
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px);"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:${s.padTop}px ${s.padX}px ${s.padBottom}px;">
    <div>
      <span style="display:block;margin-bottom:22px;font-size:${s.kicker}px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${p.highlight};">Rótulo curto</span>
      <div style="width:64px;height:2px;background:${p.accentOnInk};margin-bottom:34px;"></div>
      <h1 style="margin:0;max-width:880px;font-family:'${heading}',sans-serif;font-weight:780;font-size:${s.displayXl}px;line-height:1.02;letter-spacing:-.035em;text-wrap:balance;color:${p.inkText};">Frase do hook com uma palavra <em style="font-family:'${ACCENT_SERIF}',serif;font-weight:400;font-style:italic;color:${p.highlight};">destacada</em></h1>
      <p style="margin:30px 0 0;max-width:800px;font-size:${s.body}px;line-height:1.45;color:${p.inkMuted};">Uma linha de apoio, opcional.</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:52px;border-top:1px solid ${p.inkLine};padding-top:24px;font-size:${s.kicker}px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${p.inkMuted};">
      <span>${brand.name || "Marca"}</span><span>arrasta &rsaquo;&rsaquo;&rsaquo;</span>
    </div>
  </div>
</div>

### Exemplar 2: slide de conteúdo em paper com numeral

<div style="width:${width}px;height:${height}px;box-sizing:border-box;display:flex;flex-direction:column;padding:${s.padTop}px ${s.padX}px ${s.padBottom}px;background:${p.paper};font-family:'${body}',sans-serif;">
  <span style="margin-bottom:auto;font-size:${s.kicker}px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${p.paperMuted};">Rótulo curto</span>
  <div>
    <span style="display:block;font-family:'${ACCENT_SERIF}',serif;font-weight:400;font-size:${s.numeral}px;line-height:.82;letter-spacing:-.02em;color:${p.accentOnPaper};">36%</span>
    <h2 style="margin:28px 0 0;max-width:840px;font-family:'${heading}',sans-serif;font-weight:700;font-size:${s.title}px;line-height:1.14;letter-spacing:-.02em;text-wrap:balance;color:${p.paperText};">O título que explica o número em uma frase.</h2>
    <p style="margin:26px 0 0;max-width:760px;font-size:${s.body}px;line-height:1.45;color:${p.paperMuted};">O desdobramento, com gancho aberto para o próximo slide.</p>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:52px;border-top:1px solid ${p.paperLine};padding-top:24px;font-size:${s.kicker}px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${p.paperMuted};">
    <span>${brand.name || "Marca"}</span><span>03 / 08</span>
  </div>
</div>`;
}

/** Art direction plus the curl recipe. Only injected when MAGNIFIC_API_KEY is set. */
export function buildImagerySection(
  brand: BrandConfig,
  aspectRatio: AspectRatio,
  baseUrl: string,
  carouselId: string | undefined
): string {
  const keywords =
    brand.styleKeywords.length > 0
      ? brand.styleKeywords.join(", ")
      : "modern, professional";

  return `## Execução: imagens geradas (silencioso, nunca vire assunto)

Você gera as imagens do carrossel por curl, com a ferramenta Bash. Não mostre esses comandos
nem os prompts de imagem ao usuário, e não peça opinião sobre a direção de arte.

### Onde entra imagem

Exatamente em 2 ou 3 slides: o slide 1 (hook), o penúltimo (clímax) e, se o carrossel tiver
7 slides ou mais, um slide do meio. Todo o resto é tipografia sobre fundo sólido. Imagem em
todo slide deixa o carrossel pesado e o texto ilegível.

### Direção de arte (defina uma vez, em silêncio, e repita em todos os prompts)

Antes de gerar, fixe uma direção única para o carrossel e reaproveite as mesmas palavras de
estilo em cada prompt. Sem isso as imagens não parecem do mesmo post.

- Escreva o prompt em inglês. Sempre.
- Fotografia editorial realista: luz natural, paleta contida, profundidade de campo rasa,
  lente 35mm ou 50mm, composição com espaço vazio na parte de baixo do quadro para o texto.
- Contexto do corretor brasileiro quando fizer sentido: imóvel, chaves, visita, escritório,
  celular na mão, cidade. Nada de clichê de banco de imagens sorrindo para a câmera.
- Palavras de estilo da marca para temperar: ${keywords}.
- Termine todo prompt com: "no text, no letters, no logos, no watermark, cinematic natural light,
  muted color palette, editorial photography, negative space at the bottom".
- Nunca peça texto, número, gráfico ou interface na imagem. Texto vem do HTML, sempre.
- Rosto em primeiro plano só se for essencial. Prefira mãos, silhueta, ambiente, detalhe.

### Gerar (até 4 prompts por chamada, rodam em paralelo)

Use timeout de 300000 no Bash, a geração leva de 20 a 90 segundos por lote.

curl -s -X POST ${baseUrl}/api/images/generate \\
  -H "Content-Type: application/json" \\
  --max-time 280 \\
  -d '{"carouselId": "${carouselId || "{ID}"}", "prompts": ["PROMPT_1", "PROMPT_2"]}'

Resposta: {"images":[{"prompt":"...","url":"/uploads/xxx.jpg"}]}. Use a url exatamente como
veio, no atributo src do slide. A imagem já vem cortada no tamanho do slide (${DIMENSIONS[aspectRatio].width}x${DIMENSIONS[aspectRatio].height}).

Se um item voltar com "error" em vez de "url", não tente de novo mais de uma vez: monte
aquele slide sem imagem, no arquétipo Statement, e siga. Nunca invente um caminho de imagem
que você não recebeu desta rota, e nunca use URL externa.`;
}
