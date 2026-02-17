/**
 * PIPOCAFLIX — security.js
 * Proteção front-end: anti-inspect, anti-debug, anti-copy
 * Sem quebrar UX do usuário final.
 */

(function () {
  'use strict';

  // ===== DESABILITAR BOTÃO DIREITO =====
  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    return false;
  });

  // ===== BLOQUEAR TECLAS DE INSPEÇÃO =====
  document.addEventListener('keydown', e => {
    // F12
    if (e.key === 'F12') { e.preventDefault(); return false; }
    // Ctrl+Shift+I / J / C / U
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
      e.preventDefault(); return false;
    }
    // Ctrl+U (view source)
    if (e.ctrlKey && ['U', 'u'].includes(e.key)) {
      e.preventDefault(); return false;
    }
    // Ctrl+S (save page)
    if (e.ctrlKey && ['S', 's'].includes(e.key)) {
      e.preventDefault(); return false;
    }
  });

  // ===== DESABILITAR SELEÇÃO DE TEXTO EM ELEMENTOS SENSÍVEIS =====
  document.addEventListener('selectstart', e => {
    if (e.target.closest('.player-container, video')) {
      e.preventDefault();
    }
  });

  // ===== DETECÇÃO DE DEVTOOLS (tamanho da janela) =====
  let devToolsOpen = false;
  const THRESHOLD = 160;

  function detectDevTools() {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > THRESHOLD || heightDiff > THRESHOLD) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        handleDevToolsOpen();
      }
    } else {
      devToolsOpen = false;
    }
  }

  function handleDevToolsOpen() {
    // Redireciona suavemente sem quebrar a experiência em casos de falso positivo
    console.clear();
    // Anti-debug trap
    (function () {
      let count = 0;
      const trap = setInterval(() => {
        debugger; // eslint-disable-line no-debugger
        count++;
        if (count > 3) clearInterval(trap);
      }, 100);
    })();
  }

  setInterval(detectDevTools, 1500);

  // ===== ANTI-DEBUG PASSIVO =====
  const noop = function () {};
  const methods = ['log', 'warn', 'error', 'info', 'debug', 'table', 'trace', 'dir'];
  if (typeof window.console !== 'undefined') {
    // Não remove completamente para não quebrar erros críticos, apenas limpa logs
    const _warn = console.warn.bind(console);
    window.__pipeDebug = { warn: _warn };
  }

  // ===== PREVENIR ARRASTAR IMAGENS =====
  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  // ===== ANTI SOURCE-VIEW via URL =====
  // Injetado no HTML via meta tag X-Frame-Options e CSP
  // Adiciona aviso ao console para desencorajar
  setTimeout(() => {
    const style = 'color: #e50914; font-size: 20px; font-weight: bold;';
    const style2 = 'color: #ffffff; font-size: 13px;';
    console.log('%c🍿 PIPOCAFLIX', style);
    console.log('%cEsta área é reservada para desenvolvedores.', style2);
    console.log('%cO uso indevido pode comprometer sua conta.', style2);
  }, 500);

  // ===== ANTI-COPY PARA LINKS MP4 =====
  // Os links não são expostos no DOM; são carregados dinamicamente via JS
  // e nunca inseridos diretamente como atributos src visíveis

})();
