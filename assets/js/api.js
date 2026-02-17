/**
 * PIPOCAFLIX — api.js
 * Integração com Google Sheets via Proxy (anti-CORS)
 * NUNCA acessa Sheets diretamente. Sempre via proxy.
 */

const API = (() => {
  // ===== CONFIGURAÇÃO =====
  const PROXY = "https://autumn-pine-50da.slacarambafdsosobrenome.workers.dev/?url=";
  const SHEETS_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS9sXjpyoG6N147QcYeh50AIXF6-Bmp0sCt4fqDblpjw466UBvTWXW8AZr4_PzUTWdRxYb5kUa0uOi4/pub?output=csv";

  const GID = {
    FILMES: 300449936,
    SERIES: 413183487,
    EPISODIOS: 1394045118
  };

  const CACHE = {};
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  const TIMEOUT_MS = 12000;
  const MAX_RETRIES = 3;

  // ===== FETCH COM RETRY + TIMEOUT =====
  async function fetchWithRetry(url, attempt = 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(PROXY + encodeURIComponent(url), {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, attempt * 800));
        return fetchWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  // ===== PARSE CSV ROBUSTO =====
  function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');

    for (let i = 1; i < lines.length; i++) { // pula header linha 1
      const line = lines[i].trim();
      if (!line) continue;

      const cols = [];
      let cur = '';
      let inQ = false;

      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
          if (inQ && line[c + 1] === '"') { cur += '"'; c++; }
          else inQ = !inQ;
        } else if (ch === ',' && !inQ) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cols.push(cur.trim());
      rows.push(cols);
    }
    return rows;
  }

  // ===== BUSCA COM CACHE =====
  async function fetchSheet(gid) {
    const key = `sheet_${gid}`;
    const now = Date.now();

    if (CACHE[key] && now - CACHE[key].ts < CACHE_TTL) {
      return CACHE[key].data;
    }

    const url = `${SHEETS_BASE}&gid=${gid}`;
    const text = await fetchWithRetry(url);
    const data = parseCSV(text);

    CACHE[key] = { data, ts: now };
    return data;
  }

  // ===== MAPEAR FILMES =====
  function mapFilme(row) {
    return {
      nome:       row[0]  || '',
      link:       row[1]  || '',
      sinopse:    row[2]  || '',
      capa:       row[3]  || '',
      categoria:  row[4]  || '',
      ano:        row[5]  || '',
      duracao:    row[6]  || '',
      trailer:    row[7]  || '',
      elencoNome: row[8]  ? row[8].split('|') : [],
      elencoFoto: row[9]  ? row[9].split('|') : [],
      tipo:       row[11] || 'filme',
      audio:      row[12] || ''
    };
  }

  // ===== MAPEAR SÉRIES =====
  function mapSerie(row) {
    return {
      nome:           row[0]  || '',
      link:           row[1]  || '',
      sinopse:        row[2]  || '',
      capa:           row[3]  || '',
      categoria:      row[4]  || '',
      ano:            row[5]  || '',
      duracao:        row[6]  || '',
      trailer:        row[7]  || '',
      elencoNome:     row[8]  ? row[8].split('|') : [],
      elencoFoto:     row[9]  ? row[9].split('|') : [],
      tipo:           'serie',
      audio:          row[12] || '',
      totalTemporadas: parseInt(row[13]) || 1
    };
  }

  // ===== MAPEAR EPISÓDIOS =====
  function mapEpisodio(row) {
    return {
      serie:     row[0] || '',
      link:      row[1] || '',
      temporada: parseInt(row[2]) || 1,
      episodio:  parseInt(row[3]) || 1
    };
  }

  // ===== API PÚBLICA =====
  return {
    async getFilmes() {
      try {
        const rows = await fetchSheet(GID.FILMES);
        return rows.filter(r => r[0]).map(mapFilme);
      } catch (e) {
        console.error('[API] Erro ao carregar filmes:', e);
        return [];
      }
    },

    async getSeries() {
      try {
        const rows = await fetchSheet(GID.SERIES);
        return rows.filter(r => r[0]).map(mapSerie);
      } catch (e) {
        console.error('[API] Erro ao carregar séries:', e);
        return [];
      }
    },

    async getEpisodios() {
      try {
        const rows = await fetchSheet(GID.EPISODIOS);
        return rows.filter(r => r[0]).map(mapEpisodio);
      } catch (e) {
        console.error('[API] Erro ao carregar episódios:', e);
        return [];
      }
    },

    async getTudo() {
      const [filmes, series] = await Promise.allSettled([
        this.getFilmes(),
        this.getSeries()
      ]);
      return {
        filmes: filmes.status === 'fulfilled' ? filmes.value : [],
        series: series.status === 'fulfilled' ? series.value : []
      };
    },

    clearCache() {
      Object.keys(CACHE).forEach(k => delete CACHE[k]);
    }
  };
})();
