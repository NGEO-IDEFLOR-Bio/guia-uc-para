# Scrollytelling – Guia de Unidades de Conservação Estaduais do Pará

Narrativa geoespacial por rolagem (*scrollytelling*) das Unidades de Conservação (UCs) Estaduais do Pará, sob gestão do IDEFLOR-Bio. Ao rolar a página, os cartões avançam em ordem cronológica e o mapa acompanha a história — de 1989 a 2023.

![Demonstração](assets/img/demo.gif)

## Funcionalidades

* Fusão de GeoJSON + CSV em **Web Worker** (com *fallback* para a thread principal), sem travar a rolagem.
* 29 cartões narrativos com badges de categoria, área em ha e km², número de municípios, leitura editorial, destaque de fauna/flora e **ficha técnica** com 12 itens oficiais.
* 5 separadores de década (anos 80 a 2020) organizando a jornada.
* HUD dinâmico no mapa: UC ativa, ano de criação, área e acumulado de hectares no Estado.
* Linha do tempo fixa no rodapé do mapa, com 15 nós de ano clicáveis e barra de progresso.
* Gaveta de busca e filtros por década, tipo de UC e grupo — os filtros atuam também sobre a narrativa.
* 3 mapas base neutros (Esri cinza escuro, cinza claro e satélite) com máscara de escurecimento; UC ativa com contorno luminoso (*glow*).
* Tema claro/escuro persistido no navegador, trilha sonora ambiente opcional (Web Audio, sintetizada) e *loader* com estado de erro.
* Em telas pequenas: mapa com HUD no topo e cartões em *bottom sheet* arrastável.
* Acessibilidade: contraste verificado, atributos `aria-*`, foco visível e respeito a `prefers-reduced-motion`.

## Estrutura do projeto

```text
guia-uc-para/
├── index.html                 aplicação (HTML + CSS + JS em um único arquivo)
├── README.md
├── assets/
│   ├── data/
│   │   ├── unidades_estaduais_para.geojson          polígonos das UCs
│   │   └── unidades_conservacao_resumo_conciso.csv  metadados oficiais
│   └── img/
│       ├── icon.png                 marca do guia (cabeçalho e favicon)
│       ├── Logomarca_Ideflor-bio.png
│       ├── logo_ngeo.png
│       └── demo.gif
└── docs/
    └── PLANO_DE_MODERNIZACAO_UX.md plano de modernização de UX/UI
```

## Dados

* `assets/data/unidades_estaduais_para.geojson` — propriedades `name`, `categoria`, `grupo`, `area_ha`, `data_de_cr`, `municipio_`, `orgao_gest`, `situacao_l`...
* `assets/data/unidades_conservacao_resumo_conciso.csv` — `Nome`, `Ato de Criação`, `Data de Criação` (DD/MM/AAAA), `Link`, `ResumoBreve`.

A junção entre as duas fontes é feita por `properties.name` no GeoJSON com a coluna `Nome` do CSV.

## Tecnologias

HTML, CSS e JavaScript sem *framework* e sem etapa de compilação: Leaflet 1.9.4, IntersectionObserver, Web Workers, Web Audio API e Google Fonts (Plus Jakarta Sans, Inter, JetBrains Mono).

## Como executar

Publicado em: [https://ngeo-ideflor-bio.github.io/guia-uc-para/](https://ngeo-ideflor-bio.github.io/guia-uc-para/)

Localmente é preciso servir a pasta por HTTP (a página busca os dados com `fetch`):

```bash
python -m http.server 8765
```

Em seguida abra [http://localhost:8765](http://localhost:8765).

## Observações

* A ordenação cronológica depende de datas válidas no formato DD/MM/AAAA.
* Os mapas base usam tiles do Esri com atribuição preservada no rodapé do mapa.
* O projeto não utiliza emojis: os ícones da interface são SVG embutidos no `index.html`.

## Licença

MIT.
