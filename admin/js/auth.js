// ============================================================
// admin/js/auth.js
// Gestión completa de JWT: login, refresh, inactividad, logout
// ============================================================

const Auth = (() => {
  const KEYS = {
    token:   'utca_token',
    refresh: 'utca_refresh',
    user:    'utca_user',
    lastAct: 'utca_last_activity',
  };

  // Tiempos (en ms)
  const INACTIVITY_LIMIT = 30 * 60 * 1000;   // 30 min
  const WARN_BEFORE      = 2  * 60 * 1000;    // avisar 2 min antes
  const REFRESH_INTERVAL = 10 * 60 * 1000;    // refrescar token c/10 min
  const CHECK_INTERVAL   = 30 * 1000;         // revisar inactividad c/30s

  let inactivityTimer = null;
  let refreshTimer    = null;
  let warnShown       = false;

  // ---- Almacenamiento ----
  const save = (token, refresh, user) => {
    sessionStorage.setItem(KEYS.token,   token);
    sessionStorage.setItem(KEYS.refresh, refresh);
    sessionStorage.setItem(KEYS.user,    JSON.stringify(user));
    touchActivity();
  };

  const getToken   = ()  => sessionStorage.getItem(KEYS.token);
  const getRefresh = ()  => sessionStorage.getItem(KEYS.refresh);
  const getUser    = ()  => JSON.parse(sessionStorage.getItem(KEYS.user) || 'null');
  const isLoggedIn = ()  => !!getToken();

  const clear = () => {
    sessionStorage.removeItem(KEYS.token);
    sessionStorage.removeItem(KEYS.refresh);
    sessionStorage.removeItem(KEYS.user);
    sessionStorage.removeItem(KEYS.lastAct);
  };

  // ---- Actividad del usuario ----
  const touchActivity = () => {
    sessionStorage.setItem(KEYS.lastAct, Date.now().toString());
    warnShown = false;
    hideInactivityWarning();
  };

  const getLastActivity = () => parseInt(sessionStorage.getItem(KEYS.lastAct) || '0', 10);

  const initActivityListeners = () => {
    ['mousemove','keydown','click','touchstart','scroll'].forEach(evt => {
      document.addEventListener(evt, touchActivity, { passive: true });
    });
  };

  // ---- Verificación de inactividad ----
  const checkInactivity = () => {
    if (!isLoggedIn()) return;
    const idle = Date.now() - getLastActivity();

    if (idle >= INACTIVITY_LIMIT) {
      logout('inactividad');
      return;
    }
    if (idle >= INACTIVITY_LIMIT - WARN_BEFORE && !warnShown) {
      warnShown = true;
      showInactivityWarning(Math.round((INACTIVITY_LIMIT - idle) / 1000));
    }
  };

  // ---- Refresh automático del token ----
  const refreshAccessToken = async () => {
    const rt = getRefresh();
    if (!rt) return;
    try {
      const fd = new FormData();
      fd.append('refresh_token', rt);
      const res  = await fetch('/utcomexagro/api/auth/refresh.php', { method:'POST', body:fd });
      const json = await res.json();
      if (json.success) {
        sessionStorage.setItem(KEYS.token, json.data.access_token);
      } else {
        logout('token_expirado');
      }
    } catch {
      // silencioso, intentará de nuevo
    }
  };

  // ---- Iniciar temporizadores ----
  const startTimers = () => {
    stopTimers();
    inactivityTimer = setInterval(checkInactivity, CHECK_INTERVAL);
    refreshTimer    = setInterval(refreshAccessToken, REFRESH_INTERVAL);
  };

  const stopTimers = () => {
    if (inactivityTimer) clearInterval(inactivityTimer);
    if (refreshTimer)    clearInterval(refreshTimer);
  };

  // ---- Login ----
  const login = async (email, password) => {
    const fd = new FormData();
    fd.append('email', email);
    fd.append('password', password);
    const res  = await fetch('/utcomexagro/api/auth/login.php', { method:'POST', body:fd });
    const json = await res.json();
    if (json.success) {
      save(json.data.access_token, json.data.refresh_token, json.data.user);
      startTimers();
      initActivityListeners();
    }
    return json;
  };

  // ---- Logout ----
  const logout = async (reason = 'manual') => {
    stopTimers();
    const rt = getRefresh();
    if (rt) {
      try {
        const fd = new FormData();
        fd.append('refresh_token', rt);
        await fetch('/utcomexagro/api/auth/logout.php', { method:'POST', body:fd });
      } catch { /* silencioso */ }
    }
    clear();
    const msg = reason === 'inactividad'
      ? '?reason=inactividad'
      : reason === 'token_expirado'
      ? '?reason=sesion_expirada'
      : '';
    window.location.href = '/utcomexagro/login.html' + msg;
  };

  // ---- Verificar permisos ----
  const can = (modulo, accion) => {
    const user = getUser();
    if (!user) return false;
    return (user.permisos || []).includes(`${modulo}.${accion}`);
  };

  const hasAnyPerm = (modulo) => {
    const user = getUser();
    if (!user) return false;
    return (user.permisos || []).some(p => p.startsWith(`${modulo}.`));
  };

  // ---- UI: Warning modal de inactividad ----
  const showInactivityWarning = (secsLeft) => {
    let modal = document.getElementById('inactivity-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inactivity-modal';
      modal.innerHTML = `
        <div class="inact-overlay">
          <div class="inact-card">
            <div class="inact-icon">⏰</div>
            <h3>¿Sigues ahí?</h3>
            <p>Tu sesión se cerrará por inactividad en</p>
            <div class="inact-timer" id="inact-countdown">${secsLeft}s</div>
            <button class="inact-btn" id="inact-stay">Continuar sesión</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('inact-stay').addEventListener('click', () => {
        touchActivity();
        refreshAccessToken();
      });
      // Countdown
      let secs = secsLeft;
      const cd = setInterval(() => {
        secs--;
        const el = document.getElementById('inact-countdown');
        if (el) el.textContent = secs + 's';
        if (secs <= 0) clearInterval(cd);
      }, 1000);
    }
    modal.style.display = 'flex';
  };

  const hideInactivityWarning = () => {
    const modal = document.getElementById('inactivity-modal');
    if (modal) modal.style.display = 'none';
  };

  // ---- Guardar y cargar sesión ----
  const init = () => {
    if (!isLoggedIn()) {
      window.location.href = '/utcomexagro/login.html';
      return false;
    }
    startTimers();
    initActivityListeners();
    return true;
  };

  return { login, logout, init, getToken, getUser, isLoggedIn, can, hasAnyPerm, save };
})();
