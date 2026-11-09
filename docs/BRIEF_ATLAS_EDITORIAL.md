# Brief — Atlas Editorial das UCs Estaduais do Pará

**Projeto:** Guia de Unidades de Conservação Estaduais do Pará (`guia-uc-para`)
**Instituição:** NGEO / IDEFLOR-Bio
**Status:** proposta para validação (v0.1)
**Data:** novembro de 2026
**Documento relacionado:** `docs/wireframe-atlas.html`

> **Wireframe navegável:** abra `docs/wireframe-atlas.html` no navegador. É um arquivo estático, não precisa de servidor.
>
> Este brief substitui, como direção de produto, o `PLANO_DE_MODERNIZACAO_UX.md` (mantido como histórico).

---

## 1. Tese em uma frase

> **O site oficial é a fonte. O visualizador é a análise. O guia é a leitura e a descoberta.**

O guia não substitui a página oficial de cada UC nem o visualizador. Ele é a **camada de curadoria** que ajuda o usuário a encontrar, entender e chegar ao documento certo — sem duplicar o arquivo oficial e sem refazer a análise espacial.

---

## 2. Contexto e problema

### O que já existe

- **Páginas oficiais por UC** (ex.: [APA Triunfo do Xingu](https://ideflorbio.pa.gov.br/area-de-protecao-ambiental-triunfo-do-xingu/)): texto completo, galeria de fotos, mapa estático em JPEG, endereço, gestor, decretos, plano de gestão e dezenas de PDFs. São a fonte da verdade, mas têm informação dispersa em um site WordPress com menu extenso e estrutura variável.
- **[Nossas Unidades](https://ideflorbio.pa.gov.br/nossas-unidades/)**: funciona como repositório de links, agrupado por região administrativa. Não tem busca, filtros, mapa, comparação nem visão do sistema.
- **Visualizador Geoespacial**: já responde “onde está / qual o limite / quais camadas se sobrepõem / como filtrar e baixar”. É a ferramenta de análise.
- **Scrollytelling atual do guia**: tentou transformar o conteúdo em uma jornada cronológica. O formato coloca a narrativa acima da consulta, usa rolagem interna, duplica a jornada espacial do visualizador e faz o usuário entrar sem saber qual é a tarefa.

### O que falta

O conteúdo existe. O que não existe é uma **camada de leitura e descoberta**:

- busca e filtros para achar uma UC rapidamente;
- ficha padronizada para comparar;
- mapa interativo de localização e visão do conjunto;
- contexto editorial (categorias, história, territórios tradicionais, maiores UCs);
- caminho claro para a fonte oficial e para a análise espacial.

---

## 3. Público e trabalhos

**Público primário:** público geral, escolas, imprensa e pessoas que precisam entender uma UC sem serem especialistas.
**Público secundário:** gestores, técnicos e pesquisadores que precisam dos dados, do ato e dos documentos oficiais.

O mesmo perfil atende os dois: começa no resumo editorial e abre a ficha técnica e os documentos para quem quer aprofundar.

### Job stories

- **Encontrar:** “Ouvi falar de uma UC e quero achá-la e entender o que ela protege.”
- **Entender:** “Quero saber por que ela existe, quem vive ali, qual é a categoria e o que está em jogo.”
- **Conferir:** “Preciso do ato de criação, da área oficial e dos documentos.”
- **Explorar:** “Quero ver todas as UCs no mapa, filtrar por categoria/região/ano e comparar.”
- **Analisar:** “Quero ver limites, sobreposições e baixar dados no visualizador.”
- **Compartilhar:** “Quero mandar o link de uma UC específica para alguém.”

---

## 4. Promessa e posicionamento

**Promessa:** encontrar e entender as 29 UCs estaduais do Pará, com dados oficiais e caminhos para a fonte e para o mapa.

**Posicionamento:** um **atlas editorial de consulta**, não uma campanha. O protagonista é a UC; o mapa é apoio; o site oficial é a fonte; o visualizador é a ferramenta de análise.

**Nome de trabalho:** Guia das UCs. Alternativas: Atlas das UCs, Panorama das UCs.

---

## 5. Princípios de produto e design

1. **Curadoria, não duplicação.** Resumir, padronizar, situar e encaminhar. Não copiar texto, fotos ou listas de PDFs do site oficial.
2. **Consulta antes de narrativa.** A home é busca/índice/panorama. A linha do tempo pode existir como tema, nunca como espinha dorsal.
3. **Uma tarefa por tela.** “Encontre uma UC”, “entenda esta UC”, “veja o sistema”. Se um elemento não ajuda nisso, sai.
4. **Mapa coadjuvante.** O mapa localiza e contextualiza; a análise espacial fica no visualizador. No mobile, o mapa é colapsável.
5. **Fonte explícita.** Cada perfil tem “Ficha oficial no IDEFLOR-Bio”, data de verificação e origem dos dados.
6. **Calma visual.** Marca verde, Rawline, tema claro por padrão, categorias em verde/âmbar. Sem glassmorphism, glow, som ambiente ou três paletas competindo.
7. **Conteúdo sem caixas.** Listas editoriais com fios finos, respiro e tipografia. Bordas, raios e sombras só em controles e no mapa. Nada de “card soup”, pills, gradientes ou sombras difusas — o visual de template de dashboard.
8. **Leveza.** Dados simplificados, bibliotecas locais, sem CDN no carregamento inicial. O conteúdo é pequeno; a entrega deve ser pequena.
9. **Acessibilidade de verdade.** Contraste, foco, teclado, leitores de tela, `prefers-reduced-motion`. Nada de rolagem interna que prende o usuário.

---

## 6. Modelo de conteúdo

### 6.1 Perfil de UC

| Campo | Origem | Observação |
|---|---|---|
| Nome | CSV/GeoJSON | nome oficial |
| Categoria (APA, FLOTA, ESEC…) | GeoJSON | badge + cor |
| Grupo (Proteção Integral / Uso Sustentável) | GeoJSON | define a cor principal |
| Ato de criação | CSV (`Ato de Criação`) | texto oficial |
| Data de criação | CSV/GeoJSON | exibir DD/MM/AAAA |
| Área (ha e km²) | GeoJSON (`area_ha`) | calcular km² |
| Municípios | GeoJSON (`municipio_`) | lista curta + contagem |
| Região administrativa | GeoJSON/CSV | agrupar por região |
| Órgão gestor | GeoJSON | IDEFLOR-Bio |
| Resumo editorial | CSV (`ResumoBreve`) + curadoria | 2–4 parágrafos, linguagem clara |
| O que protege | curadoria | 3–6 bullets |
| Por que importa | curadoria | 1–2 parágrafos |
| História | curadoria | contexto de criação, não cópia |
| Comunidades e uso | curadoria/dados | quando houver |
| Como visitar | curadoria | somente quando houver informação confiável |
| Documentos oficiais | CSV (`Link`) | link para a página oficial; não hospedar todos os PDFs |
| Ficha oficial | CSV (`Link`) | botão principal de fonte |
| Visualizador | link | “Abrir no visualizador” (deep link futuro) |
| UCs relacionadas | dados | mesma região, categoria ou proximidade |
| Última verificação | manual | data + responsável |

### 6.2 Temas editoriais

- **Entenda as categorias:** APA, FLOTA, ESEC, REBIO, PARQUE, REVIS, RDS, MONA; proteção integral x uso sustentável.
- **Como o sistema cresceu:** a linha do tempo como gráfico/ensaio, não como navegação obrigatória.
- **As UCs e os territórios tradicionais:** relações com terras indígenas e quilombos (dados do visualizador).
- **As maiores UCs / as UCs por região:** rankings e recortes que o site oficial não oferece.
- **Como ler uma UC:** guia rápido de ato, categoria, conselho, plano de gestão.

---

## 7. Arquitetura da informação

```
Home (panorama + busca)
├── Busca e filtros
├── Mapa geral (29 UCs por categoria)
├── Lista de resultados
├── Temas editoriais
└── Fonte oficial / sobre os dados

Perfil da UC (/uc/<slug>)
├── Cabeçalho: nome, categoria, grupo
├── Resumo + por que importa
├── Ficha técnica
├── Mapa locator
├── O que protege / história / comunidades / visita
├── Documentos e ficha oficial (link)
├── Abrir no visualizador (link)
└── UCs relacionadas

Temas (/temas/<slug>)
Fontes (/fontes)
```

**URLs:** cada UC precisa de URL própria e compartilhável. Em site estático, usar `/uc/<slug>/` (preferível) ou `#/uc/<slug>`.

---

## 8. Fluxos e interações

### Home

- Busca textual por nome/município.
- Filtros: categoria, grupo, região administrativa, década, município.
- Mapa e lista sincronizados: clicar na linha da lista destaca no mapa; clicar no polígono abre o perfil.
- Contagem de resultados e “limpar filtros”.
- Ordenação: nome, ano, área.
- Estado dos filtros na URL (compartilhável).
- No mobile: busca no topo, lista primeiro, mapa em um botão “Ver mapa” (não espremer a lista).

### Perfil

- Ler primeiro, aprofundar depois: resumo + ficha essencial; “Ficha técnica completa” expansível.
- Botões: **Ficha oficial** (externo, principal), **Abrir no visualizador** (secundário), **Compartilhar**.
- Mapa locator com a UC destacada; link para abrir no visualizador.
- Documentos: link para a página oficial; opcionalmente 1–2 links diretos (decreto, plano de gestão), sem despejar a lista inteira.
- Relacionadas: mesma região/categoria; 3–6 links em lista.
- Aviso de fonte: “Esta é uma leitura editorial. Fotos, documentos e contato estão na ficha oficial.”

### Deep link futuro com o visualizador

- Propor `?layer=ucs_estaduais&nome=<nome>` (ou `fid`) no visualizador para abrir a UC filtrada/destacada.
- Até lá, o botão leva ao visualizador com uma instrução curta.

---

## 9. Identidade e design

**Irmão do visualizador, não outro produto.**

- Marca verde da lupa/árvore; “NGEO/IDEFLOR-Bio”.
- Rawline local (400/600/700); sem Google Fonts.
- Tema claro por padrão; escuro como opção.
- Paleta: verde institucional + azul gov.br como estrutura; categorias em verde (proteção integral) e âmbar (uso sustentável). Sem ouro neon, sem ciano, sem glass.
- Fundo levemente quente (papel); conteúdo em listas editoriais separadas por fios finos, sem cartões. Bordas, raios e sombras só em controles e no mapa.
- Categorias como metadados tipográficos (texto + ponto/cor), não pills. Botões: sólido azul para a fonte oficial, sólido verde para o visualizador, links de texto para ações secundárias; raio pequeno (2–4 px).
- Tipografia de leitura maior que a do visualizador (15–16 px, linha 1,6–1,7); títulos 28–40 px.
- Layout: home em duas colunas (filtros/lista + mapa); perfil em duas colunas (leitura + ficha lateral); mobile em coluna única.
- Ícones SVG inline; zero som ambiente; zero animações decorativas.
- A linha do tempo pode ser um gráfico bonito, mas não a moldura da página.

---

## 10. Dados e performance

- Usar o CSV (`ResumoBreve`, `Ato`, `Data`, `Link`) e o GeoJSON das UCs.
- **Simplificar o GeoJSON** das UCs para o mapa: coordenadas com 5 casas, simplificação topológica; meta < 300 KB para os 29 polígonos.
- Não carregar o GeoJSON de 7,5 MB no mapa. O GeoJSON completo pode ficar disponível para download, se necessário.
- Fontes e bibliotecas locais; sem CDN no carregamento inicial.
- Mapas base neutros (CARTO/Esri) com cache; avaliar Leaflet Canvas ou MapLibre.
- Imagens: preferir mapa/ tipografia; se usar fotos oficiais, uma miniatura com crédito e link, nunca a galeria de 2048 px.
- Meta: LCP < 2,5 s em 4G; transferência inicial < 1 MB (sem tiles de mapa); busca instantânea.
- PWA/offline em fase posterior (o guia é um bom candidato a leitura offline).
- Substituir o `demo.gif` de 12,7 MB do README por um MP4/WebM curto ou uma imagem leve.

---

## 11. Não objetivos

- Ser uma cópia do site oficial ou hospedar todos os PDFs.
- Ser uma jornada scrollytelling como estrutura principal.
- Duplicar a análise espacial do visualizador.
- Ter som, glassmorphism, glow ou estética de campanha.
- Carregar 7,5 MB de dados para 29 polígonos.
- Ser um dashboard de métricas sem relação com a leitura.

---

## 12. Métricas de sucesso

- Usuário encontra uma UC e abre o perfil em **< 30 s**.
- Busca/filtros retornam o resultado esperado na primeira tentativa.
- Pelo menos **1 link oficial** disponível em cada perfil.
- Leitura confortável no celular (uma coluna, sem zoom).
- Transferência inicial < 1 MB; LCP < 2,5 s em 4G.
- Nenhuma dependência de CDN no carregamento inicial.

---

## 13. Roadmap

| Fase | Entrega | Critério de saída |
|---|---|---|
| **0** | Brief + wireframe (este documento) | tese e estrutura aprovadas |
| **1** | Dados normalizados + home (busca/lista/mapa) + perfil | achar uma UC e ler o perfil |
| **2** | Temas, relacionadas, deep link com o visualizador | leitura do sistema e ponte com a análise |
| **3** | PWA/offline, compartilhamento, polimento | uso em campo/celular |

---

## 14. Decisões abertas

1. Nome final: Guia, Atlas ou Panorama das UCs.
2. URL: páginas estáticas `/uc/<slug>/` ou SPA com hash.
3. Fotos: sem fotos (mapa/tipografia) ou miniaturas oficiais com crédito.
4. Mapa: Leaflet Canvas ou MapLibre; geoJSON simplificado ou PMTiles dedicado.
5. Linha do tempo: apenas tema/gráfico ou também um filtro por década.
6. Quais documentos linkar diretamente além da ficha oficial.
7. PWA já na fase 1 ou só na fase 3.

---

## 15. Referências

- Site oficial — APA Triunfo do Xingu: https://ideflorbio.pa.gov.br/area-de-protecao-ambiental-triunfo-do-xingu/
- Site oficial — Nossas Unidades: https://ideflorbio.pa.gov.br/nossas-unidades/
- Visualizador Geoespacial: https://ngeo-ideflor-bio.github.io/visualizador/
- Dados do guia: `assets/data/unidades_estaduais_para.geojson` e `assets/data/unidades_conservacao_resumo_conciso.csv`
