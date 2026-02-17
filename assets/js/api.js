/**
 * PIPOCAFLIX — api.js
 * Integração via Cloudflare Worker com rotas dedicadas
 */

const API = (() => {

  const WORKER = "https://autumn-pine-50da.slacarambafdsosobrenome.workers.dev";

  const CACHE = {};
  const CACHE_TTL = 5 * 60 * 1000;
  const TIMEOUT_MS = 10000;

  // ===== FETCH SIMPLES DO WORKER =====
  async function fetchRota(rota) {
    const cacheKey = rota;
    if (CACHE[cacheKey] && Date.now() - CACHE[cacheKey].ts < CACHE_TTL) {
      return CACHE[cacheKey].data;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${WORKER}/${rota}`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data = parseCSV(text);
      CACHE[cacheKey] = { data, ts: Date.now() };
      return data;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // ===== PARSE CSV ROBUSTO =====
  function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = [];
      let cur = '', inQ = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
          if (inQ && line[c+1] === '"') { cur += '"'; c++; }
          else inQ = !inQ;
        } else if (ch === ',' && !inQ) {
          cols.push(cur.trim()); cur = '';
        } else { cur += ch; }
      }
      cols.push(cur.trim());
      rows.push(cols);
    }
    return rows;
  }

  function mapFilme(row) {
    return {
      nome:        row[0]  || '',
      link:        row[1]  || '',
      sinopse:     row[2]  || '',
      capa:        row[3]  || '',
      categoria:   row[4]  || '',
      ano:         row[5]  || '',
      duracao:     row[6]  || '',
      trailer:     row[7]  || '',
      elencoNome:  row[8]  ? row[8].split('|') : [],
      elencoFoto:  row[9]  ? row[9].split('|') : [],
      tipo:        row[11] || 'filme',
      audio:       row[12] || ''
    };
  }

  function mapSerie(row) {
    return {
      nome:            row[0]  || '',
      link:            row[1]  || '',
      sinopse:         row[2]  || '',
      capa:            row[3]  || '',
      categoria:       row[4]  || '',
      ano:             row[5]  || '',
      duracao:         row[6]  || '',
      trailer:         row[7]  || '',
      elencoNome:      row[8]  ? row[8].split('|') : [],
      elencoFoto:      row[9]  ? row[9].split('|') : [],
      tipo:            'serie',
      audio:           row[12] || '',
      totalTemporadas: parseInt(row[13]) || 1
    };
  }

  function mapEpisodio(row) {
    return {
      serie:     row[0] || '',
      link:      row[1] || '',
      temporada: parseInt(row[2]) || 1,
      episodio:  parseInt(row[3]) || 1
    };
  }

  return {
    async getFilmes() {
      try {
        const rows = await fetchRota('filmes');
        return rows.filter(r => r[0]).map(mapFilme);
      } catch (e) {
        console.error('[API] Erro filmes:', e);
        return [];
      }
    },

    async getSeries() {
      try {
        const rows = await fetchRota('series');
        return rows.filter(r => r[0]).map(mapSerie);
      } catch (e) {
        console.error('[API] Erro séries:', e);
        return [];
      }
    },

    async getEpisodios() {
      try {
        const rows = await fetchRota('episodios');
        return rows.filter(r => r[0]).map(mapEpisodio);
      } catch (e) {
        console.error('[API] Erro episódios:', e);
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
    }
  };
})();
