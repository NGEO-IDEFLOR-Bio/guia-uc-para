/**
 * Build do Atlas Editorial das UCs Estaduais do Pará.
 *
 * 1. Casa o CSV de resumos com o GeoJSON das UCs (nomes oficiais).
 * 2. Normaliza fatos, municípios, região administrativa, resumo e links oficiais.
 * 3. Gera assets/data/ucs.json.
 * 4. Gera o GeoJSON simplificado do mapa (mapshaper, 5%) e o contorno do estado.
 * 5. Gera as 29 páginas estáticas em uc/<slug>/index.html e o sitemap.
 *
 * Uso: node scripts/build-atlas.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data');
const BASE = 'https://ngeo-ideflor-bio.github.io/guia-uc-para/';

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').trim();
const normKey = (s) => norm(s).toLowerCase();
const slugify = (s) => norm(s).toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ------------------------------------------------------------------ */
/* Configuração editorial                                              */
/* ------------------------------------------------------------------ */
const SHORT_NAMES = {
  'Área de Proteção Ambiental do Marajó': 'APA Marajó',
  'Área de Proteção Ambiental de Algodoal-Maiandeua': 'APA Algodoal-Maiandeua',
  'Área de Proteção Ambiental da Região Metropolitana de Belém': 'APA Belém',
  'Parque Estadual da Serra dos Martírios/Andorinhas': 'Parque Serra dos Martírios',
  'Área de Proteção Ambiental da Ilha de Combu': 'APA Ilha do Combu',
  'Área de Proteção Ambiental de São Geraldo do Araguaia – APA Araguaia': 'APA Araguaia',
  'Parque Estadual Monte Alegre – PEMA': 'Parque Monte Alegre',
  'Área de Proteção Ambiental Paytuna': 'APA Paytuna',
  'Área de Proteção Ambiental do Lago de Tucuruí': 'APA Lago de Tucuruí',
  'Reserva de Desenvolvimento Sustentável Alcobaça': 'RDS Alcobaça',
  'Reserva de Desenvolvimento Sustentável Pucuruí-Ararão': 'RDS Pucuruí-Ararão',
  'Estação Ecológica do Grão-Pará (ESEC)': 'ESEC Grão-Pará',
  'Reserva Biológica do Maicuru (REBIO)': 'REBIO Maicuru',
  'Flota Estadual de Faro': 'FLOTA Faro',
  'Floresta Estadual do Paru': 'FLOTA Paru',
  'Floresta Estadual do Trombetas': 'FLOTA Trombetas',
  'Área de Proteção Ambiental Triunfo do Xingu': 'APA Triunfo do Xingu',
  'Floresta Estadual do Iriri': 'FLOTA Iriri',
  'Refúgio de Vida Silvestre Metrópole da Amazônia (REVIS)': 'REVIS Metrópole da Amazônia',
  'Parque Estadual Charapucu': 'Parque Charapucu',
  'Parque Estadual Ambiental das Árvores Gigantes da Amazônia (PAGAM)': 'Parque Árvores Gigantes',
  'Parque Estadual do Utinga “Camillo Vianna”': 'Parque Utinga',
  'Refúgio de Vida Silvestre Padre Sérgio Tonetto': 'REVIS Sérgio Tonetto',
  'Refúgio de Vida Silvestre Tabuleiro do Embaubal (REVIS)': 'REVIS Tabuleiro do Embaubal',
  'Reserva de Desenvolvimento Sustentável Vitória de Souzel': 'RDS Vitória de Souzel',
  'Reserva de Desenvolvimento Sustentável Campo das Mangabas': 'RDS Campo das Mangabas',
  'Monumento Natural Atalaia (MONA)': 'MONA Atalaia',
  'Refúgio de Vida Silvestre Rios São Benedito e Azul  (REVIS)': 'REVIS Rios São Benedito e Azul',
  'Estação Ecológica Mamuru (ESEC)': 'ESEC Mamuru',
};

const REGIOES = {
  'Belém': [
    'Área de Proteção Ambiental da Região Metropolitana de Belém',
    'Área de Proteção Ambiental da Ilha de Combu',
    'Parque Estadual do Utinga “Camillo Vianna”',
    'Refúgio de Vida Silvestre Metrópole da Amazônia (REVIS)',
  ],
  'Calha Norte I': [
    'Parque Estadual Monte Alegre – PEMA',
    'Área de Proteção Ambiental Paytuna',
  ],
  'Calha Norte II': [
    'Flota Estadual de Faro',
    'Floresta Estadual do Paru',
    'Floresta Estadual do Trombetas',
    'Parque Estadual Ambiental das Árvores Gigantes da Amazônia (PAGAM)',
  ],
  'Calha Norte III': [
    'Estação Ecológica do Grão-Pará (ESEC)',
    'Reserva Biológica do Maicuru (REBIO)',
    'Estação Ecológica Mamuru (ESEC)',
  ],
  'Xingu': [
    'Área de Proteção Ambiental Triunfo do Xingu',
    'Floresta Estadual do Iriri',
    'Refúgio de Vida Silvestre Tabuleiro do Embaubal (REVIS)',
    'Reserva de Desenvolvimento Sustentável Vitória de Souzel',
    'Refúgio de Vida Silvestre Rios São Benedito e Azul  (REVIS)',
  ],
  'Marajó': [
    'Área de Proteção Ambiental do Marajó',
    'Parque Estadual Charapucu',
  ],
  'Nordeste': [
    'Área de Proteção Ambiental de Algodoal-Maiandeua',
    'Monumento Natural Atalaia (MONA)',
    'Refúgio de Vida Silvestre Padre Sérgio Tonetto',
    'Reserva de Desenvolvimento Sustentável Campo das Mangabas',
  ],
  'Tucuruí': [
    'Área de Proteção Ambiental do Lago de Tucuruí',
    'Reserva de Desenvolvimento Sustentável Alcobaça',
    'Reserva de Desenvolvimento Sustentável Pucuruí-Ararão',
  ],
  'Araguaia': [
    'Parque Estadual da Serra dos Martírios/Andorinhas',
    'Área de Proteção Ambiental de São Geraldo do Araguaia – APA Araguaia',
  ],
};

const REGIAO_POR_UC = {};
for (const [regiao, names] of Object.entries(REGIOES)) {
  for (const name of names) REGIAO_POR_UC[normKey(name)] = regiao;
}

const LINK_OVERRIDES = {
  'Reserva Biológica do Maicuru (REBIO)': 'https://ideflorbio.pa.gov.br/reserva-biologica-do-maicuru/',
  'Parque Estadual do Utinga “Camillo Vianna”': 'https://ideflorbio.pa.gov.br/parque-estadual-do-utinga-camillo-vianna/',
};

const SUMMARY_OVERRIDES = {
  'Reserva Biológica do Maicuru (REBIO)': 'A Reserva Biológica do Maicuru é uma unidade de proteção integral criada em 2006, no oeste do Pará, entre os municípios de Almeirim e Monte Alegre. Protege um grande bloco de floresta amazônica entre os rios Maicuru e Jarí, na Calha Norte, e contribui para a conectividade das áreas protegidas da região. A visitação é restrita a atividades educacionais e a pesquisas científicas autorizadas.',
};

const MUNICIPIO_FIX = {
  'MonteAlegre': 'Monte Alegre',
  'Obido': 'Óbidos',
  'Oriximina': 'Oriximiná',
  'Sao Geraldo do Araguaia': 'São Geraldo do Araguaia',
  'São Felix do Xingu': 'São Félix do Xingu',
  'Ananind': 'Ananindeua',
  'Marit': 'Marituba',
  'Benev': 'Benevides',
  'SI do Pará': 'Santa Izabel do Pará',
  'Goianesia do Pará': 'Goianésia do Pará',
  'Itupi': 'Itupiranga',
  'Praina': 'Prainha',
};

const CATEGORY_INFO = {
  APA: {
    label: 'Área de Proteção Ambiental',
    group: 'Uso Sustentável',
    description: 'Unidade de uso sustentável que compatibiliza a conservação da natureza com o uso dos recursos naturais, geralmente em áreas públicas ou privadas.',
  },
  FLOTA: {
    label: 'Floresta Estadual',
    group: 'Uso Sustentável',
    description: 'Floresta pública de uso sustentável, destinada à conservação e ao manejo florestal, incluindo o uso comunitário.',
  },
  RDS: {
    label: 'Reserva de Desenvolvimento Sustentável',
    group: 'Uso Sustentável',
    description: 'Unidade de uso sustentável ocupada por populações tradicionais, com gestão participativa e regras para o uso dos recursos.',
  },
  ESEC: {
    label: 'Estação Ecológica',
    group: 'Proteção Integral',
    description: 'Unidade de proteção integral destinada à pesquisa científica e à educação ambiental; a visitação pública é restrita.',
  },
  REBIO: {
    label: 'Reserva Biológica',
    group: 'Proteção Integral',
    description: 'Unidade de proteção integral sem interferência humana direta, salvo medidas de recuperação e pesquisa autorizada.',
  },
  'PARQUE ESTADUAL': {
    label: 'Parque Estadual',
    group: 'Proteção Integral',
    description: 'Unidade de proteção integral com visitação pública, pesquisa científica e educação ambiental.',
  },
  REVIS: {
    label: 'Refúgio de Vida Silvestre',
    group: 'Proteção Integral',
    description: 'Unidade de proteção integral que busca garantir condições para a existência de espécies da fauna e da flora, com visitação controlada.',
  },
  MONA: {
    label: 'Monumento Natural',
    group: 'Proteção Integral',
    description: 'Unidade de proteção integral de sítios naturais raros ou de grande beleza cênica, com visitação sujeita a regras.',
  },
};

const CATEGORY_ORDER = ['APA', 'FLOTA', 'RDS', 'ESEC', 'REBIO', 'PARQUE ESTADUAL', 'REVIS', 'MONA'];

/* ------------------------------------------------------------------ */
/* Leitura e normalização                                             */
/* ------------------------------------------------------------------ */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cur = '', quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }

  const header = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const csv = parseCSV(fs.readFileSync(path.join(DATA, 'unidades_conservacao_resumo_conciso.csv'), 'utf8'));
const csvByName = new Map(csv.map((r) => [normKey(r.Nome), r]));

const geojson = JSON.parse(fs.readFileSync(path.join(DATA, 'unidades_estaduais_para.geojson'), 'utf8'));
if (geojson.features.length !== 29) throw new Error(`Esperava 29 UCs, encontrei ${geojson.features.length}.`);
if (csv.length !== 29) throw new Error(`Esperava 29 linhas no CSV, encontrei ${csv.length}.`);

function cleanMunicipios(raw) {
  const list = String(raw || '').split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => MUNICIPIO_FIX[s] || s);
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function stripSummary(summary, fullName, shortName) {
  let s = String(summary || '').replace(/\s+/g, ' ').trim();

  // Alguns resumos começam com o título da UC seguido de dois-pontos,
  // mas o título pode estar abreviado ou com o acrônimo em outro lugar.
  const colon = s.indexOf(':');
  if (colon > 0 && colon < 190) {
    const prefix = s.slice(0, colon);
    const startsType = /^(Área|Parque|Estação|Reserva|Refúgio|Floresta|Flota|Monumento)\b/i.test(prefix);
    if (prefix.includes(fullName) || prefix.includes(shortName) || startsType) {
      s = s.slice(colon + 1).trim();
    }
  }

  if (s.startsWith(fullName)) s = s.slice(fullName.length).trim();
  s = s.replace(/^\([^)]*\)\s*:\s*/, '').replace(/^:\s*/, '');
  return s.trim();
}

function paragraphsOf(text) {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).filter(Boolean);
  if (sentences.length <= 1) return [text];
  const out = [];
  for (let i = 0; i < sentences.length; i += 2) out.push(sentences.slice(i, i + 2).join(' '));
  return out;
}

function firstSentence(text, max = 210) {
  const m = text.match(/^.*?[.!?](?=\s|$)/);
  let s = m ? m[0] : text;
  if (s.length > max) s = s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  return s;
}

function parseDate(value) {
  const m = /^(\d{2})\/(\d{2})\/(\d{2,4})$/.exec(String(value || '').trim());
  if (!m) return { label: String(value || ''), year: null, iso: null, decade: null };
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  const label = `${m[1]}/${m[2]}/${year}`;
  const iso = `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return { label, year, iso, decade: Math.floor(year / 10) * 10 };
}

const ucs = [];
const usedSlugs = new Set();

for (const feature of geojson.features) {
  const p = feature.properties;
  const fullName = p.name;
  const key = normKey(fullName);
  const row = csvByName.get(key);
  if (!row) throw new Error(`CSV sem linha para: ${fullName}`);
  const shortName = SHORT_NAMES[fullName];
  if (!shortName) throw new Error(`Sem shortName para: ${fullName}`);

  let slug = slugify(shortName);
  if (usedSlugs.has(slug)) slug = `${slug}-${slugify(p.categoria)}`;
  usedSlugs.add(slug);

  const region = REGIAO_POR_UC[key] || 'Não classificada';
  const date = parseDate(p.data_de_cr || row['Data de Criação']);
  const areaHa = Number(p.area_ha) || 0;
  const municipios = cleanMunicipios(p.municipio_);
  const summary = stripSummary(SUMMARY_OVERRIDES[fullName] || row.ResumoBreve, fullName, shortName);
  const link = LINK_OVERRIDES[fullName] || row.Link || '';
  const categoryInfo = CATEGORY_INFO[p.categoria] || { label: p.categoria, group: p.grupo || '', description: '' };

  ucs.push({
    slug,
    fullName,
    shortName,
    categoria: p.categoria,
    categoriaLabel: categoryInfo.label,
    grupo: p.grupo || categoryInfo.group || '',
    regiao: region,
    ato: row['Ato de Criação'] || p.situacao_l || '',
    atoCompleto: p.situacao_l || row['Ato de Criação'] || '',
    data: date.label,
    dataISO: date.iso,
    ano: date.year,
    decada: date.decade,
    areaHa: Math.round(areaHa),
    areaKm2: Math.round((areaHa / 100) * 10) / 10,
    municipios,
    municipiosCount: municipios.length,
    link,
    summary,
    summaryShort: firstSentence(summary),
    summaryParagraphs: paragraphsOf(summary),
    raw: {
      'Ato de criação': p.situacao_l || null,
      'Área do decreto (ha)': p.area_decre ? Math.round(p.area_decre) : null,
      'Área calculada (ha)': p.area_ha ? Math.round(p.area_ha) : null,
      'Destinação': p.destinacao || null,
      'Categoria territorial': p.cat_territ || null,
      'Tipo de floresta': p.tipo_flore || null,
      'Órgão gestor': p.orgao_gest || null,
    },
  });
}

/* relacionadas por categoria, grupo, região, década e município */
for (const uc of ucs) {
  const scored = ucs
    .filter((other) => other.slug !== uc.slug)
    .map((other) => {
      let score = 0;
      if (other.categoria === uc.categoria) score += 5;
      if (other.grupo === uc.grupo) score += 2;
      if (other.regiao === uc.regiao) score += 2;
      if (other.decada === uc.decada) score += 1;
      if (other.municipios.some((m) => uc.municipios.includes(m))) score += 2;
      return { other, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.other.areaHa - a.other.areaHa || a.other.shortName.localeCompare(b.other.shortName, 'pt-BR'));

  uc.related = scored.slice(0, 3).map((x) => x.other.slug);
}

/* estatísticas */
const allMunicipios = new Set();
for (const uc of ucs) for (const m of uc.municipios) allMunicipios.add(m);

const stats = {
  count: ucs.length,
  areaHa: ucs.reduce((sum, uc) => sum + uc.areaHa, 0),
  protecaoIntegral: ucs.filter((uc) => uc.grupo === 'Proteção Integral').length,
  usoSustentavel: ucs.filter((uc) => uc.grupo === 'Uso Sustentável').length,
  municipios: allMunicipios.size,
  categorias: new Set(ucs.map((uc) => uc.categoria)).size,
};

const categories = CATEGORY_ORDER.map((key) => {
  const items = ucs.filter((uc) => uc.categoria === key);
  const info = CATEGORY_INFO[key];
  return {
    key,
    label: info.label,
    group: info.group,
    count: items.length,
    areaHa: items.reduce((sum, uc) => sum + uc.areaHa, 0),
    description: info.description,
  };
}).filter((c) => c.count > 0);

const decades = [...new Set(ucs.map((uc) => uc.decada).filter(Boolean))]
  .sort((a, b) => a - b)
  .map((decade) => {
    const items = ucs.filter((uc) => uc.decada === decade);
    return {
      decade,
      label: `Anos ${decade}`,
      count: items.length,
      areaHa: items.reduce((sum, uc) => sum + uc.areaHa, 0),
    };
  });

const manifest = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  stats,
  categories,
  decades,
  ucs,
};

fs.writeFileSync(path.join(DATA, 'ucs.json'), JSON.stringify(manifest, null, 1));
console.log(`ucs.json: ${ucs.length} UCs, ${(fs.statSync(path.join(DATA, 'ucs.json')).size / 1024).toFixed(1)} KB`);

/* ------------------------------------------------------------------ */
/* GeoJSON simplificado com mapshaper                                  */
/* ------------------------------------------------------------------ */
const atlasSource = {
  type: 'FeatureCollection',
  features: geojson.features.map((f) => {
    const uc = ucs.find((u) => u.fullName === f.properties.name);
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        slug: uc.slug,
        name: uc.fullName,
        shortName: uc.shortName,
        categoria: uc.categoria,
        grupo: uc.grupo,
        areaHa: uc.areaHa,
        ano: uc.ano,
        link: uc.link,
      },
    };
  }),
};

const tmpAtlas = path.join(DATA, '.atlas-source.geojson');
fs.writeFileSync(tmpAtlas, JSON.stringify(atlasSource));

const atlasOut = path.join(DATA, 'atlas.geojson');
const estadoSrc = path.join(DATA, 'estado.geojson');
const estadoOut = path.join(DATA, 'estado-simplificado.geojson');

function mapshaper(input, output) {
  const cmd = `npx --yes mapshaper "${input}" -simplify 5% keep-shapes -o precision=0.00001 "${output}"`;
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

mapshaper(tmpAtlas, atlasOut);
fs.rmSync(tmpAtlas, { force: true });
if (fs.existsSync(estadoSrc)) mapshaper(estadoSrc, estadoOut);

console.log(`atlas.geojson: ${(fs.statSync(atlasOut).size / 1024).toFixed(1)} KB`);
if (fs.existsSync(estadoOut)) console.log(`estado-simplificado.geojson: ${(fs.statSync(estadoOut).size / 1024).toFixed(1)} KB`);

/* ------------------------------------------------------------------ */
/* Páginas de perfil                                                   */
/* ------------------------------------------------------------------ */
const ucDir = path.join(ROOT, 'uc');
fs.rmSync(ucDir, { recursive: true, force: true });
fs.mkdirSync(ucDir, { recursive: true });

for (const uc of ucs) {
  const dir = path.join(ucDir, uc.slug);
  fs.mkdirSync(dir, { recursive: true });
  const html = `<!DOCTYPE html>
<html lang="pt-BR" data-theme="light" data-root="../../">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(uc.shortName)} · Guia das UCs · NGEO/IDEFLOR-Bio</title>
  <meta name="description" content="${esc(uc.summaryShort)}" />
  <meta name="uc-slug" content="${esc(uc.slug)}" />
  <link rel="canonical" href="${BASE}uc/${uc.slug}/" />
  <link rel="icon" type="image/svg+xml" href="../../assets/img/brand-mark.svg" />
  <link rel="stylesheet" href="../../assets/vendor/leaflet/leaflet.css" />
  <link rel="stylesheet" href="../../assets/css/atlas.css" />
</head>
<body>
  <a class="skip-link" href="#app">Pular para o conteúdo</a>
  <div id="app"><div class="loading">Carregando perfil…</div></div>
  <noscript>
    <main class="noscript">
      <h1>${esc(uc.fullName)}</h1>
      <p>${esc(uc.summaryShort)}</p>
      <p><a href="${esc(uc.link)}">Ficha oficial no IDEFLOR-Bio</a></p>
    </main>
  </noscript>
  <script src="../../assets/vendor/leaflet/leaflet.js"></script>
  <script type="module" src="../../assets/js/atlas.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

/* sitemap */
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `${BASE}`,
  `${BASE}temas.html`,
  `${BASE}fontes.html`,
  ...ucs.map((uc) => `${BASE}uc/${uc.slug}/`),
];
fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`
);

console.log(`\n${ucs.length} páginas de perfil geradas em uc/`);
console.log(`municípios citados: ${stats.municipios}`);
console.log(`área total: ${stats.areaHa.toLocaleString('pt-BR')} ha`);
console.log(`sitemap.xml: ${urls.length} URLs`);
