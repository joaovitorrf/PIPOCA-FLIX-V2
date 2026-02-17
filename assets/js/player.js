/**
 * PIPOCAFLIX — player.js
 * Lógica compartilhada do player de vídeo
 * Adaptado exatamente dos players fornecidos — sem alterar UX
 */

const Player = (() => {
  const SMARTLINK = "https://www.effectivegatecpm.com/eacwhk55f?key=87f8fc919fb5d70a825293b5490713dd";

  // ===== FORMATAR TEMPO =====
  function formatTime(t) {
    if (isNaN(t) || !isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ===== INICIALIZAR PLAYER (FILME) =====
  function initFilmePlayer({ videoEl, overlayEl, centerPlayEl, controlsEl, playerBoxEl,
    backBtn, playPauseBtn, forwardBtn, fullscreenBtn,
    progressEl, progressFilledEl, currentTimeEl, totalTimeEl,
    titleDisplay }) {

    let hideTimer;
    let isFullscreen = false;

    // --- Overlay / iniciar ---
    function iniciar() {
      overlayEl.classList.add('hidden');
      centerPlayEl.style.opacity = '0';
      controlsEl.classList.remove('hidden');
      videoEl.play();
    }

    overlayEl.addEventListener('click', iniciar);
    centerPlayEl.addEventListener('click', iniciar);

    // --- Play / Pause ---
    const playPath = playPauseBtn.querySelector('#playPausePath') ||
      playPauseBtn.querySelector('path');

    function updatePlayIcon() {
      if (!playPath) return;
      if (videoEl.paused) {
        playPath.setAttribute('d', 'M8 5v14l11-7z');
      } else {
        playPath.setAttribute('d', 'M6 5h4v14H6V5zm8 0h4v14h-4V5z');
      }
    }

    playPauseBtn.addEventListener('click', () => {
      if (videoEl.paused) videoEl.play(); else videoEl.pause();
    });
    videoEl.addEventListener('play', updatePlayIcon);
    videoEl.addEventListener('pause', updatePlayIcon);

    // --- Skip ---
    backBtn.addEventListener('click', () => { videoEl.currentTime = Math.max(0, videoEl.currentTime - 10); });
    forwardBtn.addEventListener('click', () => { videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 10); });

    // --- Progress Bar ---
    videoEl.addEventListener('timeupdate', () => {
      if (!videoEl.duration) return;
      const pct = (videoEl.currentTime / videoEl.duration) * 100;
      progressFilledEl.style.width = pct + '%';
      currentTimeEl.textContent = formatTime(videoEl.currentTime);
      totalTimeEl.textContent = formatTime(videoEl.duration);
    });

    progressEl.addEventListener('click', e => {
      const rect = progressEl.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoEl.currentTime = pos * videoEl.duration;
    });

    // --- Fullscreen ---
    fullscreenBtn.addEventListener('click', async () => {
      if (!isFullscreen) {
        await playerBoxEl.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          try { await screen.orientation.lock('landscape'); } catch (e) {}
        }
        isFullscreen = true;
      } else {
        document.exitFullscreen();
        isFullscreen = false;
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        isFullscreen = false;
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
      }
    });

    // --- Auto-hide controls ---
    playerBoxEl.addEventListener('mousemove', () => {
      controlsEl.classList.remove('hidden');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => controlsEl.classList.add('hidden'), 2500);
    });

    // Touch devices
    playerBoxEl.addEventListener('touchstart', () => {
      controlsEl.classList.remove('hidden');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => controlsEl.classList.add('hidden'), 3000);
    }, { passive: true });
  }

  // ===== INICIALIZAR PLAYER (SÉRIE) =====
  function initSeriePlayer({ videoEl, overlayEl, centerPlayEl, controlsEl, playerBoxEl,
    backBtn, playPauseBtn, forwardBtn, fullscreenBtn,
    progressEl, progressFilledEl, currentTimeEl, totalTimeEl,
    playerTitleEl }) {

    let hideTimer;
    let isFullscreen = false;

    function iniciar() {
      overlayEl.classList.add('hidden');
      centerPlayEl.style.opacity = '0';
      controlsEl.classList.remove('hidden');
      videoEl.play();
    }

    overlayEl.addEventListener('click', iniciar);
    centerPlayEl.addEventListener('click', iniciar);

    playPauseBtn.addEventListener('click', () => {
      if (videoEl.paused) {
        videoEl.play();
        playPauseBtn.innerHTML = '⏸';
      } else {
        videoEl.pause();
        playPauseBtn.innerHTML = '▶';
      }
    });
    videoEl.addEventListener('play', () => { playPauseBtn.innerHTML = '⏸'; });
    videoEl.addEventListener('pause', () => { playPauseBtn.innerHTML = '▶'; });

    backBtn.addEventListener('click', () => { videoEl.currentTime = Math.max(0, videoEl.currentTime - 10); });
    forwardBtn.addEventListener('click', () => { videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 10); });

    videoEl.addEventListener('timeupdate', () => {
      if (!videoEl.duration) return;
      const pct = (videoEl.currentTime / videoEl.duration) * 100;
      progressFilledEl.style.width = pct + '%';
      currentTimeEl.textContent = formatTime(videoEl.currentTime);
      totalTimeEl.textContent = formatTime(videoEl.duration);
    });

    progressEl.addEventListener('click', e => {
      const rect = progressEl.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoEl.currentTime = pos * videoEl.duration;
    });

    fullscreenBtn.addEventListener('click', async () => {
      if (!isFullscreen) {
        await playerBoxEl.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          try { await screen.orientation.lock('landscape'); } catch (e) {}
        }
        isFullscreen = true;
      } else {
        document.exitFullscreen();
        isFullscreen = false;
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        isFullscreen = false;
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
      }
    });

    playerBoxEl.addEventListener('mousemove', () => {
      controlsEl.classList.remove('hidden');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => controlsEl.classList.add('hidden'), 2500);
    });

    playerBoxEl.addEventListener('touchstart', () => {
      controlsEl.classList.remove('hidden');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => controlsEl.classList.add('hidden'), 3000);
    }, { passive: true });

    // Retorna função para trocar src dinamicamente
    return {
      load(url, titulo) {
        videoEl.src = url;
        videoEl.load();
        if (playerTitleEl) playerTitleEl.textContent = titulo || '';
        overlayEl.classList.remove('hidden');
        centerPlayEl.style.opacity = '1';
        controlsEl.classList.add('hidden');
      }
    };
  }

  // ===== SMARTLINK =====
  function openSmartlink() {
    window.open(SMARTLINK, '_blank');
  }

  return {
    initFilmePlayer,
    initSeriePlayer,
    openSmartlink,
    formatTime,
    SMARTLINK
  };
})();
