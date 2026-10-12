// Runs before the game: Bridge owns storage and the game never starts over an unread save.
window.__PORTAL__ = 'playgama';
window.__playgamaBoot = (() => {
  'use strict';
  const key = 'skyline-guardian-save';
  const roots = new Set(document.body.children);
  const panel = document.createElement('div');
  panel.id = 'pg-loading';
  panel.innerHTML = '<div><h1>Skyline Guardian</h1><p id="pg-status">Loading your progress…</p><button id="pg-retry" hidden>Retry</button></div>';
  document.body.appendChild(panel);
  const status = panel.querySelector('p');
  panel.querySelector('button').onclick = () => location.reload();
  let raw = null, dirty = null, writing = null, retry = 0;
  const boot = {
    sdk: null, platformPaused: false, audioEnabled: true, readySent: false,
    onState: null, onPersist: null, onSaveError: null,
    get hostPaused() { return this.platformPaused || document.hidden; },
    getRaw() { return raw; },
    putRaw(value) { raw = value; dirty = value; void this.flush(); },
    async flush() {
      if (writing) return writing;
      if (dirty === null || !this.sdk) return;
      clearTimeout(retry);
      writing = Promise.resolve().then(async () => {
        try {
          while (dirty !== null) {
            const next = dirty;
            await this.sdk.storage.set([key], [next]);
            if (dirty === next) dirty = null;
          }
        } catch (error) {
          console.warn('Playgama save will be retried:', error);
          this.onSaveError?.();
          retry = setTimeout(() => { void this.flush(); }, 3500);
        } finally { writing = null; }
      });
      return writing;
    },
    message(name, options) {
      try { Promise.resolve(this.sdk.platform.sendMessage(name, options)).catch(error => console.warn('Playgama message:', name, error)); }
      catch (error) { console.warn('Playgama message:', name, error); }
    },
    gameReady() {
      if (this.readySent) return;
      this.readySent = true;
      panel.remove();
      this.message('game_ready');
      this.onState?.();
    },
    fail(error) {
      console.error('Playgama startup:', error);
      status.textContent = 'Unable to load the game and your progress. Check your connection, then retry.';
      panel.querySelector('button').hidden = false;
    },
  };
  function deadline(promise, label, ms = 20000) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).finally(() => clearTimeout(timer));
  }
  function checkpoint() { boot.onPersist?.(); void boot.flush(); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) checkpoint();
    boot.onState?.();
  });
  addEventListener('pagehide', checkpoint);
  addEventListener('orientationchange', checkpoint);
  setInterval(checkpoint, 15000);
  // Only block the game's own UI, leaving Bridge's ad and error-popup controls usable.
  const block = event => {
    if (!boot.hostPaused && !window.__playgamaAdActive) return;
    let root = event.target;
    while (root?.parentElement && root.parentElement !== document.body) root = root.parentElement;
    if (roots.has(root) || event.target === document.body || event.target === document.documentElement) {
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  for (const type of ['keydown','keyup','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','click','wheel']) {
    addEventListener(type, block, { capture: true, passive: false });
  }
  boot.ready = (async () => {
    await deadline(new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://bridge.playgama.com/v2/stable/playgama-bridge.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Bridge could not be downloaded'));
      document.head.appendChild(script);
    }), 'Bridge download');
    if (!window.bridge) throw new Error('Bridge is missing');
    await deadline(window.bridge.initialize(), 'Bridge initialization');
    boot.sdk = window.bridge;
    const platform = boot.sdk.platform;
    boot.audioEnabled = platform.isAudioEnabled !== false;
    boot.platformPaused = !!platform.isPaused;
    // English is the game's supported locale and the fallback for all other platform languages.
    boot.platformLanguage = platform.language || 'en';
    document.documentElement.lang = 'en';
    platform.on(boot.sdk.EVENT_NAME.AUDIO_STATE_CHANGED, enabled => {
      boot.audioEnabled = !!enabled; boot.onState?.();
    });
    platform.on(boot.sdk.EVENT_NAME.PAUSE_STATE_CHANGED, paused => {
      boot.platformPaused = !!paused;
      if (paused) checkpoint();
      boot.onState?.();
    });
    const values = await deadline(boot.sdk.storage.get([key], false), 'Saved progress');
    if (!Array.isArray(values) || values.length !== 1) throw new Error('Unexpected storage response');
    const value = values[0];
    raw = value == null ? null : typeof value === 'string' ? value : JSON.stringify(value);
    if (raw !== null && (typeof JSON.parse(raw) !== 'object' || JSON.parse(raw) === null)) {
      throw new Error('Saved progress is invalid');
    }
    if (document.fonts) await deadline(document.fonts.ready, 'Fonts').catch(() => {});
  })();
  return boot;
})();
