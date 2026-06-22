// ============================================================
// admin/js/api.js
// Cliente API centralizado – agrega JWT en cada request
// ============================================================

const API = (() => {
  const BASE = window.location.pathname.includes('/utcomexagro') ? '/utcomexagro/api' : '/api';

  /**
   * Fetch autenticado: agrega Authorization header con JWT.
   * @param {string} endpoint - Ruta relativa a /api (ej: '/postulados/list.php')
   * @param {object} options  - Opciones de fetch (method, body, etc.)
   */
  const request = async (endpoint, options = {}) => {
    const token = Auth.getToken();
    const headers = {
      ...(options.headers || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Si el token expiró, intentar con refresh
    if (res.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        const retryRes = await fetch(`${BASE}${endpoint}`, { ...options, headers });
        return retryRes.json();
      } else {
        Auth.logout('token_expirado');
        return { success: false, message: 'Sesión expirada.' };
      }
    }

    return res.json();
  };

  const tryRefresh = async () => {
    const rt = sessionStorage.getItem('utca_refresh');
    if (!rt) return false;
    try {
      const fd = new FormData();
      fd.append('refresh_token', rt);
      const res  = await fetch(`${BASE}/auth/refresh.php`, { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        sessionStorage.setItem('utca_token', json.data.access_token);
        return true;
      }
    } catch { /* silencioso */ }
    return false;
  };

  // ---- Métodos helper ----
  const get  = (endpoint)         => request(endpoint, { method: 'GET' });
  const post = (endpoint, body)   => request(endpoint, { method: 'POST', body });
  const put  = (endpoint, body)   => request(endpoint, { method: 'PUT',  body });
  const del  = (endpoint)         => request(endpoint, { method: 'DELETE' });

  // ---- Endpoints específicos ----
  const postulados = {
    list:    (params = '') => get(`/postulados/list.php${params}`),
    get:     (id)          => get(`/postulados/get.php?id=${id}`),
    evaluar: (id, data)    => post(`/contratacion/evaluar.php`, (() => { const f = new FormData(); f.append('postulado_id', id); Object.entries(data).forEach(([k,v]) => f.append(k,v)); return f; })()),
  };

  const configuracion = {
    usuarios: {
      list:   ()       => get('/config/usuarios.php'),
      create: (fd)     => post('/config/usuarios.php', fd),
      toggle: (id)     => post('/config/usuarios_toggle.php', (() => { const f = new FormData(); f.append('id', id); return f; })()),
    },
    roles: (() => {
      const fn = () => get('/config/roles.php');
      fn.updatePermisos = (rolId, perms) => post('/config/roles_update_permisos.php', (() => { const f = new FormData(); f.append('rol_id', rolId); f.append('permiso_ids', JSON.stringify(perms)); return f; })());
      return fn;
    })(),
    permisos: ()       => get('/config/permisos.php'),
    parametros: {
      get:  ()   => get('/config/parametros.php'),
      save: (fd) => post('/config/parametros.php', fd),
    },
    parametrosNomina: {
      list: ()   => get('/config/parametros_nomina.php'),
      save: (fd) => post('/config/parametros_nomina.php', fd),
    },
    contratos: {
      list: () => get('/contratacion/postulados_seleccionados.php'),
      generar: (fd) => post('/contratacion/generar_contrato.php', fd)
    }
  };

  const contratacion = {
    conceptosNomina: {
      list: ()   => get('/contratacion/conceptos_nomina.php'),
      save: (fd) => post('/contratacion/conceptos_nomina.php', fd),
    }
  };

  const beneficiarios = {
    organizaciones: {
      list:   ()   => get('/beneficiarios/organizaciones.php'),
      create: (fd) => post('/beneficiarios/organizaciones.php', fd),
    },
    beneficiarios: {
      list:   ()   => get('/beneficiarios/beneficiarios.php'),
      create: (fd) => post('/beneficiarios/beneficiarios.php', fd),
    },
    tipos: {
      list:   ()       => get('/beneficiarios/tipos.php'),
      create: (fd)     => post('/beneficiarios/tipos.php', fd),
      update: (id, fd) => post(`/beneficiarios/tipos.php?id=${id}`, fd),
      delete: (id)     => request(`/beneficiarios/tipos.php?id=${id}`, { method: 'DELETE' }),
    }
  };

  const dashboard = {
    stats: () => get('/dashboard/stats.php'),
  };

  const capacitaciones = {
    list:   ()   => get('/capacitaciones/list.php'),
    save:   (fd) => post('/capacitaciones/save.php', fd),
    state:  (fd) => post('/capacitaciones/state.php', fd),
    delete: (fd) => post('/capacitaciones/delete.php', fd),
  };

  return { request, get, post, put, del, postulados, configuracion, contratacion, beneficiarios, capacitaciones, dashboard };
})();
