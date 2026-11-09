/* ==================================================================
   Guia das UCs Estaduais do Pará — atlas editorial
   Dados: assets/data/ucs.json + GeoJSON simplificado
   ================================================================== */
const html = document.documentElement;
const ROOT = html.dataset.root || './';
const VIEW = html.dataset.view || '';
const SLUG = document.querySelector('meta[name="uc-slug"]')?.content || '';
const VISUALIZADOR = 'https://ngeo-ideflor-bio.github.io/visualizador/';
const OFICIAL = 'https://ideflorbio.pa.gov.br/nossas-unidades/';
const THEME_KEY = 'guia-uc-theme';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = new Intl.NumberFormat('pt-BR');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const fmtArea = (ha) => fmt.format(Math.round(Number(ha) || 0));
const fmtKm2 = (km2) => fmt.format(Math.round(Number(km2) || 0));
const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const fmtDateTime = (iso) => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(iso));
  } catch { return ''; }
};

const state = {
  data: null,
  ucs: [],
  filtered: [],
  hover: null,
  map: null,
  mapLayers: {},
  stateLayer: null,
  base: null,
  mapHomeBounds: null,
  profileMap: null,
  profileLayers: {},
  profileStateLayer: null,
  profileBase: null,
  filters: { q: '', cat: '', grupo: '', regiao: '', decada: '', sort: 'name' },
  hasFilter: false,
  theme: 'light',
};

/* ------------------------------------------------------------------ */
/* Tema                                                               */
/* ------------------------------------------------------------------ */
function savedTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark' || t === 'light') return t;
  } catch { /* modo privado */ }
  return 'light';
}

function themeNow() { return html.dataset.theme === 'dark' ? 'dark' : 'light'; }

function setTheme(theme, persist = true) {
  html.dataset.theme = theme;
  state.theme = theme;
  if (persist) {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* noop */ }
  }
  updateBaseLayers();
  updateMapStyles();
  updateProfileMapStyles();
  const btn = $('#themeBtn');
  if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro');
}

function groupColor(group) {
  if (group === 'Proteção Integral') return themeNow() === 'dark' ? '#4ade80' : '#15803d';
  return themeNow() === 'dark' ? '#fbbf24' : '#b45309';
}

function stateColor() {
  return themeNow() === 'dark' ? '#6b7f72' : '#9aa69b';
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                         */
/* ------------------------------------------------------------------ */
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

let toastTimer;
function toast(message) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4200);
}

function debounce(fn, wait = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function findUc(slug) { return state.ucs.find((uc) => uc.slug === slug); }
function ucHref(uc) { return `${ROOT}uc/${uc.slug}/`; }

function rawValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return fmt.format(value);
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Shell                                                              */
/* ------------------------------------------------------------------ */
function shell(active) {
  const q = new URLSearchParams(location.search).get('q') || '';
  $('#app').innerHTML = `
    <header class="site-header">
      <div class="wrap header-inner">
        <a class="brand" href="${ROOT}">
          <img src="${ROOT}assets/img/brand-mark.svg" alt="" />
          <span class="brand-text">
            <strong>Guia das UCs</strong>
            <span>NGEO/IDEFLOR-Bio</span>
          </span>
        </a>
        <nav class="nav" aria-label="Principal">
          <a href="${ROOT}" class="${active === 'ucs' ? 'active' : ''}">UCs</a>
          <a href="${ROOT}temas.html" class="${active === 'temas' ? 'active' : ''}">Temas</a>
          <a href="${ROOT}fontes.html" class="${active === 'fontes' ? 'active' : ''}">Fontes</a>
        </nav>
        <div class="header-tools">
          <form class="header-search" action="${ROOT}" method="get" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
            <input type="search" name="q" value="${esc(q)}" placeholder="Buscar UC…" aria-label="Buscar UC" />
          </form>
          <button class="theme-btn" id="themeBtn" type="button" aria-label="Alternar tema">
            <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
            <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path></svg>
          </button>
        </div>
      </div>
    </header>
    <main id="main" class="main"></main>
    <footer class="site-footer">
      <div class="wrap footer-inner">
        <div>
          <strong>Guia das UCs</strong> · NGEO/IDEFLOR-Bio<br />
          <span>Uma leitura editorial das 29 unidades de conservação estaduais do Pará.</span>
        </div>
        <div class="footer-links">
          <a href="${OFICIAL}" target="_blank" rel="noopener">IDEFLOR-Bio ↗</a>
          <a href="${VISUALIZADOR}" target="_blank" rel="noopener">Visualizador ↗</a>
          <a href="${ROOT}fontes.html">Fontes e dados</a>
        </div>
      </div>
    </footer>
  `;
  $('#themeBtn').addEventListener('click', () => {
    setTheme(themeNow() === 'dark' ? 'light' : 'dark');
  });
  setTheme(themeNow(), false);
}

/* ------------------------------------------------------------------ */
/* Home                                                               */
/* ------------------------------------------------------------------ */
function renderHome() {
  shell('ucs');
  const s = state.data.stats;
  const years = state.ucs.map((uc) => uc.ano).filter(Boolean);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  $('#main').innerHTML = `
    <section class="hero wrap">
      <span class="eyebrow">Panorama · ${s.count} unidades estaduais</span>
      <h1>As UCs do Pará, para encontrar e entender.</h1>
      <p class="lead">Dados oficiais, mapa e uma leitura editorial. O guia resume, padroniza e encaminha; a ficha oficial, as fotos e os documentos ficam no IDEFLOR-Bio.</p>
      <div class="stats">
        <div class="stat"><strong>${fmt.format(s.count)}</strong><span>UCs estaduais</span></div>
        <div class="stat"><strong>${fmtArea(s.areaHa)}</strong><span>hectares protegidos</span></div>
        <div class="stat"><strong>${fmt.format(s.protecaoIntegral)}</strong><span>proteção integral</span></div>
        <div class="stat"><strong>${fmt.format(s.usoSustentavel)}</strong><span>uso sustentável</span></div>
        <div class="stat"><strong>${fmt.format(s.municipios)}</strong><span>municípios citados</span></div>
      </div>
      <div class="stat-line">${s.categorias} categorias · ${minYear}–${maxYear} · ${s.count} fichas oficiais linkadas</div>
    </section>

    <section class="filters wrap" aria-label="Filtros">
      <div class="filters-grid">
        <div class="filter search">
          <label for="q">Buscar</label>
          <input id="q" type="search" placeholder="Nome, município, categoria…" autocomplete="off" />
        </div>
        <div class="filter">
          <label for="cat">Categoria</label>
          <select id="cat"><option value="">Todas</option></select>
        </div>
        <div class="filter">
          <label for="grupo">Grupo</label>
          <select id="grupo"><option value="">Todos</option></select>
        </div>
        <div class="filter">
          <label for="regiao">Região</label>
          <select id="regiao"><option value="">Todas</option></select>
        </div>
        <div class="filter">
          <label for="decada">Década</label>
          <select id="decada"><option value="">Todas</option></select>
        </div>
        <div class="filter-actions">
          <button class="clear-btn" id="clearFilters" type="button" disabled>Limpar filtros</button>
        </div>
      </div>
    </section>

    <section class="home wrap">
      <div class="results-bar">
        <span class="results-count"><strong id="resultCount">0</strong> unidades</span>
        <div class="results-tools">
          <label class="sort">Ordenar
            <select id="sortBy">
              <option value="name">Nome (A–Z)</option>
              <option value="year">Ano (mais recente)</option>
              <option value="area">Área (maior)</option>
            </select>
          </label>
        </div>
      </div>
      <div class="home-grid">
        <div class="results" id="ucList"></div>
        <figure class="map-figure" id="mapFigure">
          <button class="map-toggle" id="mapToggle" type="button">Ver mapa</button>
          <div class="map-frame" id="mapFrame">
            <div id="map"></div>
            <div class="map-loading" id="mapLoading">Carregando mapa…</div>
            <div class="map-legend">
              <b>Legenda</b>
              <span><i class="dot" style="background:${groupColor('Proteção Integral')}"></i>Proteção integral</span><br />
              <span><i class="dot" style="background:${groupColor('Uso Sustentável')}"></i>Uso sustentável</span>
            </div>
          </div>
          <figcaption class="map-caption">
            <span>${s.count} UCs · cores por grupo · clique em uma UC para abrir o perfil</span>
            <a href="${VISUALIZADOR}" target="_blank" rel="noopener">Abrir no visualizador ↗</a>
          </figcaption>
        </figure>
      </div>
    </section>

    <section class="themes wrap">
      <div class="themes-grid">
        <a class="theme" href="${ROOT}temas.html#categorias">
          <span class="theme-kicker">Entenda</span>
          <h2>As categorias de UC</h2>
          <p>O que muda entre APA, FLOTA, ESEC, REBIO, PARQUE, REVIS, RDS e MONA; proteção integral x uso sustentável.</p>
        </a>
        <a class="theme" href="${ROOT}temas.html#historia">
          <span class="theme-kicker">Contexto</span>
          <h2>Como o sistema cresceu</h2>
          <p>A linha do tempo como gráfico e ensaio — de ${minYear} a ${maxYear} —, não como jornada obrigatória.</p>
        </a>
        <a class="theme" href="${ROOT}temas.html#territorios">
          <span class="theme-kicker">Território</span>
          <h2>UCs e territórios tradicionais</h2>
          <p>Onde ver as relações com terras indígenas, quilombos e comunidades no Visualizador Geoespacial.</p>
        </a>
      </div>
    </section>

    <section class="source-note wrap">
      <b>Fonte oficial:</b> IDEFLOR-Bio. O guia é uma leitura editorial: resume, padroniza e encaminha; não substitui a ficha oficial.
      <a href="${ROOT}fontes.html">Sobre os dados</a>.
    </section>
  `;

  buildFilters();
  readFilters();
  bindFilters();
  applyFilters({ fit: false, sync: false });

  if (window.matchMedia('(max-width: 1080px)').matches) {
    $('#mapToggle').addEventListener('click', toggleHomeMap);
  } else {
    initHomeMap();
  }
}

function buildFilters() {
  const cats = [...new Map(state.ucs.map((uc) => [uc.categoria, uc.categoriaLabel])).entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  const grupos = [...new Set(state.ucs.map((uc) => uc.grupo))].sort();
  const regioes = [...new Set(state.ucs.map((uc) => uc.regiao))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const decadas = [...new Set(state.ucs.map((uc) => uc.decada).filter(Boolean))].sort((a, b) => a - b);

  $('#cat').insertAdjacentHTML('beforeend',
    cats.map(([key, label]) => `<option value="${esc(key)}">${esc(key)} · ${esc(label)}</option>`).join(''));
  $('#grupo').insertAdjacentHTML('beforeend',
    grupos.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join(''));
  $('#regiao').insertAdjacentHTML('beforeend',
    regioes.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join(''));
  $('#decada').insertAdjacentHTML('beforeend',
    decadas.map((d) => `<option value="${esc(String(d))}">Anos ${d}</option>`).join(''));
}

function readFilters() {
  const params = new URLSearchParams(location.search);
  state.filters = {
    q: params.get('q') || '',
    cat: params.get('cat') || '',
    grupo: params.get('grupo') || '',
    regiao: params.get('regiao') || '',
    decada: params.get('decada') || '',
    sort: params.get('sort') || 'name',
  };
  $('#q').value = state.filters.q;
  $('#cat').value = state.filters.cat;
  $('#grupo').value = state.filters.grupo;
  $('#regiao').value = state.filters.regiao;
  $('#decada').value = state.filters.decada;
  $('#sortBy').value = state.filters.sort;
}

function bindFilters() {
  const apply = (fit) => applyFilters({ fit, sync: true });
  const onSearch = debounce(() => {
    state.filters.q = $('#q').value.trim();
    apply(false);
  }, 180);

  $('#q').addEventListener('input', onSearch);
  for (const id of ['cat', 'grupo', 'regiao', 'decada']) {
    $(`#${id}`).addEventListener('change', () => {
      state.filters[id] = $(`#${id}`).value;
      apply(true);
    });
  }
  $('#sortBy').addEventListener('change', () => {
    state.filters.sort = $('#sortBy').value;
    apply(false);
  });
  $('#clearFilters').addEventListener('click', () => {
    state.filters = { q: '', cat: '', grupo: '', regiao: '', decada: '', sort: 'name' };
    $('#q').value = '';
    for (const id of ['cat', 'grupo', 'regiao', 'decada']) $(`#${id}`).value = '';
    $('#sortBy').value = 'name';
    apply(true);
  });
}

function filterUcs() {
  const f = state.filters;
  const q = f.q.toLowerCase();
  return state.ucs
    .filter((uc) => {
      if (f.cat && uc.categoria !== f.cat) return false;
      if (f.grupo && uc.grupo !== f.grupo) return false;
      if (f.regiao && uc.regiao !== f.regiao) return false;
      if (f.decada && String(uc.decada) !== String(f.decada)) return false;
      if (q) {
        const hay = [
          uc.shortName, uc.fullName, uc.summary, uc.categoria, uc.categoriaLabel,
          uc.grupo, uc.regiao, ...uc.municipios,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (f.sort === 'year') return (b.ano || 0) - (a.ano || 0) || a.shortName.localeCompare(b.shortName, 'pt-BR');
      if (f.sort === 'area') return b.areaHa - a.areaHa || a.shortName.localeCompare(b.shortName, 'pt-BR');
      return a.shortName.localeCompare(b.shortName, 'pt-BR');
    });
}

function applyFilters({ fit = false, sync = true } = {}) {
  state.filtered = filterUcs();
  const count = state.filtered.length;
  const countEl = $('#resultCount');
  if (countEl) countEl.textContent = fmt.format(count);

  const anyFilter = !!(state.filters.q || state.filters.cat || state.filters.grupo || state.filters.regiao || state.filters.decada);
  state.hasFilter = anyFilter;
  const clearBtn = $('#clearFilters');
  if (clearBtn) clearBtn.disabled = !anyFilter;

  renderList();
  updateMapStyles();
  if (fit) fitFiltered();
  if (sync) syncURL();
}

function syncURL() {
  const url = new URL(location.href);
  const f = state.filters;
  const set = (key, value) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  };
  set('q', f.q);
  set('cat', f.cat);
  set('grupo', f.grupo);
  set('regiao', f.regiao);
  set('decada', f.decada);
  set('sort', f.sort !== 'name' ? f.sort : '');
  history.replaceState(null, '', url);
}

function renderList() {
  const box = $('#ucList');
  if (!box) return;
  if (!state.filtered.length) {
    box.innerHTML = '<div class="empty">Nenhuma UC encontrada com esses filtros. <button class="clear-btn" type="button" id="emptyClear">Limpar filtros</button></div>';
    $('#emptyClear')?.addEventListener('click', () => $('#clearFilters').click());
    return;
  }

  box.innerHTML = state.filtered.map((uc) => `
    <a class="uc-row" href="${ucHref(uc)}" data-slug="${esc(uc.slug)}">
      <div class="uc-row-meta">
        <span class="cat">${esc(uc.categoria)}</span>
        <span class="sep">/</span>
        <span class="${uc.grupo === 'Proteção Integral' ? 'pi' : 'us'}">${esc(uc.grupo)}</span>
        <span class="sep">/</span>
        <span>${uc.ano || '—'}</span>
        <span class="sep">/</span>
        <span>${esc(uc.regiao)}</span>
      </div>
      <h2 class="uc-row-title">${esc(uc.shortName)}</h2>
      <div class="uc-row-facts">${fmtArea(uc.areaHa)} ha · ${fmt.format(uc.municipiosCount)} ${uc.municipiosCount === 1 ? 'município' : 'municípios'}</div>
      <p class="uc-row-summary">${esc(uc.summaryShort)}</p>
      <span class="uc-row-cta">Ler perfil →</span>
    </a>
  `).join('');

  for (const row of $$('.uc-row', box)) {
    const slug = row.dataset.slug;
    row.addEventListener('pointerenter', () => setHover(slug));
    row.addEventListener('pointerleave', () => setHover(null));
    row.addEventListener('focus', () => setHover(slug));
    row.addEventListener('blur', () => setHover(null));
  }
}

function setHover(slug) {
  state.hover = slug;
  updateMapStyles();
  for (const row of $$('.uc-row')) {
    row.classList.toggle('is-active', row.dataset.slug === slug);
  }
}

/* ------------------------------------------------------------------ */
/* Mapa da home                                                       */
/* ------------------------------------------------------------------ */
function mapTileLayer() {
  const dark = themeNow() === 'dark';
  return L.tileLayer(
    `https://basemaps.cartocdn.com/${dark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}.png`,
    {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors © CARTO',
    }
  );
}

async function initHomeMap() {
  if (!window.L) {
    const loading = $('#mapLoading');
    if (loading) loading.textContent = 'Mapa indisponível.';
    return;
  }
  if (state.map) {
    state.map.invalidateSize();
    return;
  }

  const map = L.map('map', {
    center: [-4.6, -52.0],
    zoom: 5.2,
    minZoom: 4,
    maxZoom: 13,
    zoomControl: true,
    scrollWheelZoom: false,
    preferCanvas: true,
    attributionControl: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
  });
  state.map = map;
  state.base = mapTileLayer().addTo(map);
  map.invalidateSize();

  try {
    const [estado, atlas] = await Promise.all([
      getJSON(`${ROOT}assets/data/estado-simplificado.geojson`),
      getJSON(`${ROOT}assets/data/atlas.geojson`),
    ]);

    state.stateLayer = L.geoJSON(estado, {
      style: () => ({ color: stateColor(), weight: 1, opacity: 0.7, fill: false, interactive: false }),
    }).addTo(map);

    const layer = L.geoJSON(atlas, {
      style: (feature) => styleFor(feature.properties),
      onEachFeature: (feature, lyr) => {
        const p = feature.properties;
        state.mapLayers[p.slug] = lyr;
        lyr.bindTooltip(`${esc(p.shortName)} · ${esc(p.categoria)}`, { sticky: true, className: 'uc-tooltip' });
        lyr.on('mouseover', () => {
          map.getContainer().style.cursor = 'pointer';
          setHover(p.slug);
        });
        lyr.on('mouseout', () => {
          map.getContainer().style.cursor = '';
          setHover(null);
        });
        lyr.on('click', () => {
          window.location.href = ucHref({ slug: p.slug });
        });
      },
    }).addTo(map);
    state.ucLayer = layer;

    const bounds = state.stateLayer.getBounds().isValid()
      ? state.stateLayer.getBounds()
      : layer.getBounds();
    state.mapHomeBounds = bounds;
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [18, 18], animate: false });
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [18, 18], animate: false });
    }, 120);
    updateMapStyles();

    const loading = $('#mapLoading');
    if (loading) loading.classList.add('is-done');
  } catch (err) {
    console.error('[mapa]', err);
    const loading = $('#mapLoading');
    if (loading) loading.textContent = 'Não foi possível carregar o mapa.';
  }
}

function styleFor(props, hover = false) {
  const color = groupColor(props.grupo);
  const matchSet = new Set(state.filtered.map((uc) => uc.slug));
  const match = !state.hasFilter || matchSet.has(props.slug);
  const isHover = props.slug === state.hover;

  if (!match) {
    return { color, weight: 0.6, opacity: 0.14, fillColor: color, fillOpacity: 0.04 };
  }
  if (isHover) {
    return { color, weight: 2.6, opacity: 1, fillColor: color, fillOpacity: 0.56 };
  }
  return { color, weight: 1, opacity: 0.9, fillColor: color, fillOpacity: 0.34 };
}

function updateMapStyles() {
  if (state.mapLayers) {
    for (const [slug, layer] of Object.entries(state.mapLayers)) {
      const feature = layer.feature?.properties;
      if (feature) layer.setStyle(styleFor(feature));
    }
  }
  if (state.stateLayer) {
    state.stateLayer.setStyle({ color: stateColor(), weight: 1, opacity: 0.7, fill: false });
  }
}

function fitFiltered() {
  if (!state.map || !state.ucLayer) return;
  const layers = state.filtered.map((uc) => state.mapLayers[uc.slug]).filter(Boolean);
  if (!layers.length) {
    if (state.mapHomeBounds) state.map.fitBounds(state.mapHomeBounds, { padding: [18, 18], maxZoom: 8 });
    return;
  }
  const group = L.featureGroup(layers);
  const bounds = group.getBounds();
  if (bounds.isValid()) {
    state.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9, animate: true, duration: 0.45 });
  }
}

function toggleHomeMap() {
  const figure = $('#mapFigure');
  const open = figure.classList.toggle('is-open');
  const btn = $('#mapToggle');
  if (btn) btn.textContent = open ? 'Ocultar mapa' : 'Ver mapa';
  if (open) {
    if (!state.map) initHomeMap().then(() => fitFiltered());
    else {
      state.map.invalidateSize();
      setTimeout(() => state.map.invalidateSize(), 80);
      fitFiltered();
    }
  }
}

function updateBaseLayers() {
  if (state.map) {
    if (state.base) state.map.removeLayer(state.base);
    state.base = mapTileLayer().addTo(state.map);
    state.base.bringToBack();
  }
  if (state.profileMap) {
    if (state.profileBase) state.profileMap.removeLayer(state.profileBase);
    state.profileBase = mapTileLayer().addTo(state.profileMap);
    state.profileBase.bringToBack();
  }
}

/* ------------------------------------------------------------------ */
/* Perfil                                                             */
/* ------------------------------------------------------------------ */
function renderProfile(slug) {
  const uc = findUc(slug);
  if (!uc) return renderNotFound();
  shell('ucs');

  const categoryInfo = state.data.categories.find((c) => c.key === uc.categoria);
  const related = uc.related.map(findUc).filter(Boolean);
  const rawRows = Object.entries(uc.raw || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `<tr><th>${esc(key)}</th><td>${esc(rawValue(value))}</td></tr>`)
    .join('');

  document.body.classList.add('has-mobile-actions');

  $('#main').innerHTML = `
    <div class="wrap crumbs">
      <a href="${ROOT}">UCs</a> / <span>${esc(uc.shortName)}</span>
    </div>

    <header class="profile-head wrap">
      <div class="profile-badges">
        <span class="cat">${esc(uc.categoria)}</span>
        <span class="sep">/</span>
        <span class="${uc.grupo === 'Proteção Integral' ? 'pi' : 'us'}">${esc(uc.grupo)}</span>
        <span class="sep">/</span>
        <span>${uc.ano || '—'}</span>
        <span class="sep">/</span>
        <span>${esc(uc.regiao)}</span>
      </div>
      <h1>${esc(uc.fullName)}</h1>
      <p class="profile-lead">${esc(uc.summaryShort)}</p>
      <div class="profile-actions">
        <a class="btn primary" href="${esc(uc.link)}" target="_blank" rel="noopener">Ficha oficial no IDEFLOR-Bio ↗</a>
        <a class="btn" href="${VISUALIZADOR}" target="_blank" rel="noopener">Abrir no visualizador ↗</a>
        <button class="btn muted" id="shareBtn" type="button">Compartilhar</button>
      </div>
    </header>

    <div class="profile-grid wrap">
      <article class="reading">
        <section class="reading-section">
          <h2>Sobre a UC</h2>
          ${uc.summaryParagraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
          <p class="reading-note">Resumo editorial do guia. O texto completo, as fotos e os documentos estão na ficha oficial do IDEFLOR-Bio.</p>
        </section>

        <section class="reading-section">
          <h2>Sobre a categoria</h2>
          <p>${esc(categoryInfo?.description || '')}</p>
          <p class="reading-note">${esc(uc.categoria)} · ${esc(uc.categoriaLabel)} · ${esc(uc.grupo)}. <a href="${ROOT}temas.html#categorias">Entenda as categorias</a>.</p>
        </section>

        <section class="reading-section">
          <h2>Fonte e documentos</h2>
          <p>A ficha oficial reúne decreto de criação, conselho gestor, plano de gestão, publicações e contato da equipe. O guia não duplica esses documentos.</p>
          <p><a href="${esc(uc.link)}" target="_blank" rel="noopener">Abrir a ficha oficial no IDEFLOR-Bio ↗</a></p>
        </section>

        <details class="details">
          <summary>Ficha técnica completa</summary>
          <table class="raw-table">
            <tbody>${rawRows}</tbody>
          </table>
          <p class="reading-note">Dados da base geoespacial do guia. A ficha oficial é a referência para atos, áreas e documentos.</p>
        </details>
      </article>

      <aside class="sidebar">
        <section class="side-section">
          <h3>Ficha rápida</h3>
          <table class="facts">
            <tr><td>Categoria</td><td>${esc(uc.categoria)} · ${esc(uc.categoriaLabel)}</td></tr>
            <tr><td>Grupo</td><td>${esc(uc.grupo)}</td></tr>
            <tr><td>Criação</td><td>${esc(uc.data)}</td></tr>
            <tr><td>Ato</td><td>${esc(uc.ato)}</td></tr>
            <tr><td>Área</td><td>${fmtArea(uc.areaHa)} ha<br /><span style="font-weight:400;color:var(--muted)">${fmtKm2(uc.areaKm2)} km²</span></td></tr>
            <tr><td>Municípios</td><td>${uc.municipios.map(esc).join(', ')}</td></tr>
            <tr><td>Região</td><td>${esc(uc.regiao)}</td></tr>
            <tr><td>Órgão gestor</td><td>${esc(uc.raw['Órgão gestor'] || 'IDEFLOR-Bio')}</td></tr>
          </table>
          <p class="facts-note">Área e municípios calculados a partir da base geoespacial; a ficha oficial é a referência.</p>
        </section>

        <section class="side-section">
          <h3>Onde fica</h3>
          <div class="side-map">
            <div id="profileMap"></div>
            <div class="side-map-loading" id="profileMapLoading">Carregando mapa…</div>
          </div>
          <a class="side-link" href="${VISUALIZADOR}" target="_blank" rel="noopener">Ver no visualizador →</a>
        </section>

        <section class="side-section official-band">
          <h3>Fonte oficial</h3>
          <p>Ficha completa, fotos, decretos, plano de gestão, conselho e contato da equipe.</p>
          <a class="btn" href="${esc(uc.link)}" target="_blank" rel="noopener">Abrir no IDEFLOR-Bio ↗</a>
        </section>

        <section class="side-section visualizer-band">
          <h3>Análise espacial</h3>
          <p>Limites, sobreposições e download de dados no Visualizador Geoespacial.</p>
          <a class="btn" href="${VISUALIZADOR}" target="_blank" rel="noopener">Abrir no visualizador ↗</a>
        </section>

        <section class="side-section">
          <h3>UCs relacionadas</h3>
          <div class="related-list">
            ${related.map((r) => `
              <a href="${ucHref(r)}">
                ${esc(r.shortName)}
                <small>${esc(r.categoria)} · ${esc(r.regiao)}</small>
              </a>
            `).join('')}
          </div>
        </section>
      </aside>
    </div>

    <div class="mobile-actions">
      <a class="btn primary" href="${esc(uc.link)}" target="_blank" rel="noopener">Ficha oficial ↗</a>
      <a class="btn" href="${VISUALIZADOR}" target="_blank" rel="noopener">Visualizador ↗</a>
    </div>
  `;

  $('#shareBtn').addEventListener('click', () => shareProfile(uc));
  initProfileMap(uc);
}

async function shareProfile(uc) {
  const url = location.href;
  const title = `${uc.shortName} · Guia das UCs`;
  if (navigator.share) {
    try { await navigator.share({ title, url }); return; } catch { /* cancelado */ }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copiado.');
  } catch {
    toast('Copie o endereço do navegador para compartilhar.');
  }
}

function renderNotFound() {
  shell('ucs');
  $('#main').innerHTML = `
    <div class="wrap error">
      <h1>UC não encontrada</h1>
      <p>O endereço pode ter mudado. Volte para a busca e escolha uma unidade.</p>
      <p><a href="${ROOT}">Voltar para o guia</a> · <a href="${OFICIAL}" target="_blank" rel="noopener">Nossas Unidades no IDEFLOR-Bio ↗</a></p>
    </div>
  `;
}

async function initProfileMap(uc) {
  if (!window.L) {
    const loading = $('#profileMapLoading');
    if (loading) loading.textContent = 'Mapa indisponível.';
    return;
  }
  const map = L.map('profileMap', {
    center: [-4.6, -52.0],
    zoom: 5.2,
    minZoom: 4,
    maxZoom: 12,
    zoomControl: true,
    scrollWheelZoom: false,
    preferCanvas: true,
    attributionControl: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
  });
  state.profileMap = map;
  state.profileBase = mapTileLayer().addTo(map);
  map.invalidateSize();

  try {
    const [estado, atlas] = await Promise.all([
      getJSON(`${ROOT}assets/data/estado-simplificado.geojson`),
      getJSON(`${ROOT}assets/data/atlas.geojson`),
    ]);

    state.profileStateLayer = L.geoJSON(estado, {
      style: () => ({ color: stateColor(), weight: 1, opacity: 0.7, fill: false, interactive: false }),
    }).addTo(map);

    state.profileSlug = uc.slug;
    state.profileGeoLayer = L.geoJSON(atlas, {
      style: (feature) => profileStyleFor(feature.properties, uc.slug),
      onEachFeature: (feature, layer) => {
        if (feature.properties.slug === uc.slug) {
          layer.bindTooltip(esc(feature.properties.shortName), { sticky: true, className: 'uc-tooltip' });
        }
      },
    }).addTo(map);

    const bounds = state.profileStateLayer.getBounds().isValid()
      ? state.profileStateLayer.getBounds()
      : map.getBounds();
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [10, 10], animate: false });
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [10, 10], animate: false });
    }, 120);

    const loading = $('#profileMapLoading');
    if (loading) loading.classList.add('is-done');
  } catch (err) {
    console.error('[mapa perfil]', err);
    const loading = $('#profileMapLoading');
    if (loading) loading.textContent = 'Não foi possível carregar o mapa.';
  }
}

function profileStyleFor(props, selectedSlug) {
  const color = groupColor(props.grupo);
  if (props.slug !== selectedSlug) {
    return { color, weight: 0.6, opacity: 0.18, fillColor: color, fillOpacity: 0.05 };
  }
  return { color, weight: 2.4, opacity: 1, fillColor: color, fillOpacity: 0.5 };
}

function updateProfileMapStyles() {
  if (state.profileStateLayer) {
    state.profileStateLayer.setStyle({ color: stateColor(), weight: 1, opacity: 0.7, fill: false });
  }
  if (state.profileGeoLayer && state.profileSlug) {
    state.profileGeoLayer.eachLayer((layer) => {
      const props = layer.feature?.properties;
      if (props) layer.setStyle(profileStyleFor(props, state.profileSlug));
    });
  }
}

/* ------------------------------------------------------------------ */
/* Temas                                                              */
/* ------------------------------------------------------------------ */
function renderThemes() {
  shell('temas');
  const maxCount = Math.max(...state.data.decades.map((d) => d.count), 1);

  $('#main').innerHTML = `
    <header class="page-head wrap">
      <span class="eyebrow">Leitura do sistema</span>
      <h1>Entenda as UCs para além da lista.</h1>
      <p>As categorias, a evolução do sistema e as conexões com os territórios tradicionais. O mapa de cada UC fica no perfil; a análise espacial fica no visualizador.</p>
    </header>

    <div class="wrap theme-page">
      <section class="theme-section" id="categorias">
        <h2>As categorias de UC</h2>
        <p class="lead">Oito categorias, dois grandes grupos: proteção integral e uso sustentável.</p>
        <div class="category-list">
          ${state.data.categories.map((c) => `
            <a class="category-row" href="${ROOT}?cat=${encodeURIComponent(c.key)}">
              <div class="category-meta">
                ${esc(c.key)} · <span class="${c.group === 'Proteção Integral' ? 'pi' : 'us'}">${esc(c.group)}</span>
              </div>
              <h3>${esc(c.label)}</h3>
              <p>${esc(c.description)}</p>
              <p class="reading-note">${c.count} ${c.count === 1 ? 'unidade' : 'unidades'} · ${fmtArea(c.areaHa)} ha</p>
            </a>
          `).join('')}
        </div>
      </section>

      <section class="theme-section" id="historia">
        <h2>Como o sistema cresceu</h2>
        <p class="lead">A cronologia como gráfico e contexto — não como uma jornada obrigatória.</p>
        <div class="decade-chart">
          ${state.data.decades.map((d) => `
            <div class="decade-row">
              <span class="decade-label">${esc(d.label)}</span>
              <span class="decade-bar"><i style="width:${Math.max(4, Math.round((d.count / maxCount) * 100))}%"></i></span>
              <span class="decade-count">${d.count}</span>
              <span class="decade-area">${fmtArea(d.areaHa)} ha</span>
            </div>
          `).join('')}
        </div>
        <div class="prose">
          <p>O sistema estadual começa em 1989, com a APA do Marajó, e se expande em ondas: os anos 2000 concentram o maior número de criações, com as florestas estaduais da Calha Norte e unidades do Xingu; os anos 2010 e 2020 trazem novas reservas e parques.</p>
          <p>A linha do tempo é uma dimensão do sistema, não o seu produto. Para comparar ou analisar uma UC, use os filtros da lista ou abra o perfil.</p>
        </div>
      </section>

      <section class="theme-section" id="territorios">
        <h2>UCs e territórios tradicionais</h2>
        <p class="lead">A relação entre unidades de conservação, terras indígenas e quilombos não cabe em uma ficha isolada.</p>
        <div class="prose">
          <p>Muitas UCs estaduais se sobrepõem ou fazem fronteira com terras indígenas e territórios quilombolas, e a gestão precisa considerar esses territórios. O guia mostra a ficha e o mapa locator de cada UC; a leitura das sobreposições é feita no Visualizador Geoespacial, que reúne as camadas de UCs, terras indígenas e quilombos.</p>
          <p><a href="${VISUALIZADOR}" target="_blank" rel="noopener">Abrir o Visualizador e ativar as camadas de territórios tradicionais ↗</a></p>
          <p class="reading-note">A análise de sobreposição é uma etapa separada; o guia não substitui o visualizador nem produz laudos.</p>
        </div>
      </section>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* Fontes                                                             */
/* ------------------------------------------------------------------ */
function renderFontes() {
  shell('fontes');
  const generated = fmtDateTime(state.data.generatedAt);
  $('#main').innerHTML = `
    <header class="page-head wrap">
      <span class="eyebrow">Transparência</span>
      <h1>Fontes e dados.</h1>
      <p>O guia é uma camada editorial sobre dados oficiais. Ele resume, padroniza e encaminha; a ficha oficial é a referência.</p>
    </header>

    <div class="wrap sources" style="padding-top:10px;padding-bottom:48px">
      <section class="source-block">
        <h2>Fonte oficial</h2>
        <p>Cada perfil aponta para a página da unidade no site do IDEFLOR-Bio. É lá que estão o texto completo, as fotos, os decretos, o plano de gestão, o conselho e o contato.</p>
        <p><a href="${OFICIAL}" target="_blank" rel="noopener">Nossas Unidades · IDEFLOR-Bio ↗</a></p>
      </section>

      <section class="source-block">
        <h2>Dados do guia</h2>
        <ul class="source-list">
          <li><a href="${ROOT}assets/data/unidades_conservacao_resumo_conciso.csv">CSV de resumos e links oficiais</a> — nome, ato, data, link e resumo.</li>
          <li><a href="${ROOT}assets/data/unidades_estaduais_para.geojson">GeoJSON das UCs</a> — geometria, categoria, grupo, área, municípios e situação legal.</li>
          <li><a href="${ROOT}assets/data/ucs.json">Dados normalizados do atlas</a> — fichas, estatísticas e relações.</li>
          <li><a href="${ROOT}assets/data/atlas.geojson">GeoJSON simplificado do mapa</a> — 5% da geometria original, para leitura em escala estadual.</li>
        </ul>
        <p class="reading-note">Última geração: ${esc(generated)}.</p>
      </section>

      <section class="source-block">
        <h2>Como ler os números</h2>
        <p><b>Área:</b> os valores são calculados a partir da geometria da base geoespacial; podem variar em relação à área do decreto ou da ficha oficial. Consulte a fonte oficial para o valor jurídico.</p>
        <p><b>Municípios:</b> a lista usa os municípios registrados na base geoespacial. Algumas fichas oficiais trazem listas mais completas.</p>
        <p><b>Resumo:</b> o texto é uma leitura editorial do guia, baseada no resumo do CSV, e não substitui o texto oficial.</p>
        <p><b>Mapa:</b> os polígonos do guia são simplificados para navegação. Para limites detalhados, use o Visualizador Geoespacial.</p>
      </section>

      <section class="source-block">
        <h2>Projeto</h2>
        <p>O Guia das UCs é uma ferramenta do <b>NGEO</b> (Núcleo de Geoinformação) do IDEFLOR-Bio, disponibilizada ao público. Ele complementa o Visualizador Geoespacial: o visualizador analisa; o guia lê e encaminha.</p>
        <ul class="source-list">
          <li><a href="${VISUALIZADOR}" target="_blank" rel="noopener">Visualizador Geoespacial ↗</a></li>
          <li><a href="${ROOT}docs/BRIEF_ATLAS_EDITORIAL.md">Brief do atlas editorial</a></li>
          <li><a href="${ROOT}docs/wireframe-atlas.html">Wireframe estrutural</a></li>
          <li><a href="${ROOT}index-legacy.html">Versão anterior (scrollytelling)</a></li>
        </ul>
      </section>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* Boot                                                               */
/* ------------------------------------------------------------------ */
async function boot() {
  html.dataset.theme = savedTheme();
  state.theme = themeNow();

  try {
    const data = await getJSON(`${ROOT}assets/data/ucs.json`);
    state.data = data;
    state.ucs = data.ucs;
    window.__atlas = state;

    if (SLUG) renderProfile(SLUG);
    else if (VIEW === 'temas') renderThemes();
    else if (VIEW === 'fontes') renderFontes();
    else renderHome();
  } catch (err) {
    console.error('[guia]', err);
    $('#app').innerHTML = `
      <div class="wrap error">
        <h1>Não foi possível carregar o guia.</h1>
        <p>Verifique a conexão e recarregue. Enquanto isso, a fonte oficial continua disponível.</p>
        <p><a href="${OFICIAL}" target="_blank" rel="noopener">Nossas Unidades · IDEFLOR-Bio ↗</a></p>
      </div>
    `;
  }
}

boot();

window.addEventListener('resize', debounce(() => {
  state.map?.invalidateSize();
  state.profileMap?.invalidateSize();
}, 150));
