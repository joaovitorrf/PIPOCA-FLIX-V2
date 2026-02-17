/**
 * PIPOCAFLIX — search.js
 * Busca inteligente: Fuzzy Search, normalização, debounce
 */

const Search = (() => {
  let _catalog = [];
  let _onResult = null;
  let _timer = null;
  const DEBOUNCE_MS = 280;

  // ===== NORMALIZAR TEXTO =====
  function normalize(str) {
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ===== FUZZY MATCH SIMPLES =====
  function fuzzyScore(query, text) {
    const q = normalize(query);
    const t = normalize(text);

    if (!q || !t) return 0;

    // Exact match
    if (t === q) return 100;
    // Starts with
    if (t.startsWith(q)) return 90;
    // Contains
    if (t.includes(q)) return 80;

    // Fuzzy por palavras
    const words = q.split(' ').filter(Boolean);
    let score = 0;
    words.forEach(w => {
      if (t.includes(w)) score += 60 / words.length;
    });
    if (score > 0) return score;

    // Fuzzy por caracteres (tolerância a erros)
    let qi = 0;
    let matches = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) { matches++; qi++; }
    }
    if (qi === q.length) {
      return Math.floor((matches / t.length) * 50);
    }

    // Bigrams
    const queryBigrams = getBigrams(q);
    const textBigrams = getBigrams(t);
    const common = queryBigrams.filter(b => textBigrams.includes(b)).length;
    if (common > 0) {
      return Math.floor((2 * common / (queryBigrams.length + textBigrams.length)) * 40);
    }

    return 0;
  }

  function getBigrams(str) {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  }

  // ===== BUSCAR =====
  function search(query, limit = 20) {
    if (!query || query.length < 2) return [];

    const results = _catalog
      .map(item => {
        const score = Math.max(
          fuzzyScore(query, item.nome || ''),
          fuzzyScore(query, item.categoria || '') * 0.6,
          fuzzyScore(query, item.ano || '') * 0.3
        );
        return { ...item, _score: score };
      })
      .filter(item => item._score > 10)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    return results;
  }

  // ===== INPUT HANDLER =====
  function handleInput(value) {
    clearTimeout(_timer);
    _timer = setTimeout(() => {
      const results = search(value.trim());
      if (_onResult) _onResult(results, value.trim());
    }, DEBOUNCE_MS);
  }

  // ===== API PÚBLICA =====
  return {
    init(catalog, onResult) {
      _catalog = catalog;
      _onResult = onResult;
    },

    updateCatalog(catalog) {
      _catalog = catalog;
    },

    query(value) {
      handleInput(value);
    },

    immediate(value) {
      return search(value.trim());
    }
  };
})();
