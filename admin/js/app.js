// ============================================================
// admin/js/app.js
// SPA Router + Módulos del Panel Administrativo UT COMEXAGRO
// ============================================================

// ---- Definición de módulos del menú ----
const MODULES = [
  {
    key: 'dashboard',
    label: 'Inicio',
    icon: '🏠',
    desc: 'Panel principal y estadísticas del sistema',
    section: 'general',
    permiso: null,            // visible siempre
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-config',
  },
  {
    key: 'configuracion',
    label: 'Configuración',
    icon: '⚙️',
    desc: 'Usuarios, roles, permisos y parámetros',
    section: 'sistema',
    permiso: 'configuracion.usuarios',
    badgeText: 'Admin',
    badgeClass: 'badge-active',
    iconClass: 'icon-config',
  },
  {
    key: 'postulados',
    label: 'Postulados',
    icon: '👤',
    desc: 'Gestión de personas registradas en la convocatoria',
    section: 'gestion',
    permiso: 'postulados.leer',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-people',
  },
  {
    key: 'contratacion',
    label: 'Contratación',
    icon: '📋',
    desc: 'Evaluación, contratos automáticos y nómina',
    section: 'gestion',
    permiso: 'contratacion.evaluar',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-contract',
  },
  {
    key: 'beneficiarios',
    label: 'Beneficiarios',
    icon: '🤝',
    desc: 'Gestión de beneficiarios de los programas',
    section: 'gestion',
    permiso: 'beneficiarios.leer',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-people',
  },
  {
    key: 'presupuesto',
    label: 'Presupuesto',
    icon: '💰',
    desc: 'Control presupuestal y ejecución por rubros',
    section: 'admin',
    permiso: 'presupuesto.leer',
    badgeText: 'En desarrollo',
    badgeClass: 'badge-dev',
    iconClass: 'icon-budget',
  },
  {
    key: 'inventarios',
    label: 'Inventarios',
    icon: '📦',
    desc: 'Gestión de activos, dotaciones e insumos',
    section: 'admin',
    permiso: 'inventarios.leer',
    badgeText: 'En desarrollo',
    badgeClass: 'badge-dev',
    iconClass: 'icon-inventory',
  },
  {
    key: 'capacitaciones',
    label: 'Capacitaciones',
    icon: '🎓',
    desc: 'Programación de charlas y sesiones virtuales',
    section: 'gestion',
    permiso: 'capacitaciones.leer',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-training',
  },
  {
    key: 'encuestas',
    label: 'Encuestas',
    icon: '📊',
    desc: 'Creación y análisis de encuestas',
    section: 'admin',
    permiso: 'encuestas.leer',
    badgeText: 'En desarrollo',
    badgeClass: 'badge-dev',
    iconClass: 'icon-survey',
  },
];

// ---- Estado de la app ----
let currentModule = 'dashboard';

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.init()) return;   // redirige a login si no hay sesión

  const user = Auth.getUser();
  renderUserInfo(user);
  renderSidebarNav(user);
  initSidebar();
  initTopbar(user);
  startClock();

  // Ruta inicial por hash o dashboard
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(hash);

  window.addEventListener('hashchange', () => {
    const mod = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(mod);
  });
});

// ---- Render usuario en sidebar ----
function renderUserInfo(user) {
  const initial = (user.nombre || 'U')[0].toUpperCase();
  document.getElementById('sidebar-avatar-initial').textContent  = initial;
  document.getElementById('sidebar-user-name').textContent       = user.nombre;
  document.getElementById('sidebar-user-rol').textContent        = user.rol;
  document.getElementById('topbar-avatar-initial').textContent   = initial;
  document.getElementById('topbar-user-name').textContent        = user.nombre.split(' ')[0];
  document.getElementById('topbar-user-rol').textContent         = user.rol;
}

// ---- Render nav del sidebar según permisos ----
function renderSidebarNav(user) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';

  const sections = {
    general: 'General',
    gestion: 'Gestión',
    admin:   'Administración',
    sistema: 'Sistema',
  };

  Object.entries(sections).forEach(([key, label]) => {
    const items = MODULES.filter(m => m.section === key && canSeeModule(m, user));
    if (!items.length) return;

    const sectionEl = document.createElement('div');
    sectionEl.innerHTML = `<div class="nav-section-label">${label}</div>`;
    items.forEach(mod => {
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.dataset.module = mod.key;
      item.dataset.tooltip = mod.label;
      item.innerHTML = `
        <span class="nav-item-icon">${mod.icon}</span>
        <span class="nav-item-label">${mod.label}</span>`;
      item.addEventListener('click', () => {
        window.location.hash = mod.key;
        closeMobileSidebar();
      });
      sectionEl.appendChild(item);
    });
    nav.appendChild(sectionEl);
  });
}

function canSeeModule(mod, user) {
  if (!mod.permiso) return true;
  return (user.permisos || []).includes(mod.permiso) ||
         (user.permisos || []).some(p => p.startsWith(mod.permiso.split('.')[0] + '.'));
}

// ---- Navegación SPA ----
function navigateTo(moduleKey) {
  currentModule = moduleKey;

  // Actualizar sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.module === moduleKey);
  });

  // Breadcrumb
  const mod = MODULES.find(m => m.key === moduleKey);
  document.getElementById('breadcrumb-current').textContent = mod ? mod.label : 'Módulo';

  // Cargar vista
  const content = document.getElementById('content');
  content.innerHTML = '<div class="skeleton-row skeleton" style="width:60%;height:24px;margin-bottom:1.5rem"></div><div class="skeleton-row skeleton"></div><div class="skeleton-row skeleton" style="width:80%"></div>';

  setTimeout(() => {
    switch(moduleKey) {
      case 'dashboard':     renderDashboard(); break;
      case 'postulados':    renderPostulados(); break;
      case 'contratacion':  renderContratacion(); break;
      case 'configuracion': renderConfiguracion(); break;
      default:              renderComingSoon(mod); break;
    }
  }, 300);
}

// ================================================================
//  VISTA: DASHBOARD
// ================================================================
function renderDashboard() {
  const user = Auth.getUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const content = document.getElementById('content');

  // Módulos accesibles para las cards
  const accessibleMods = MODULES.filter(m => m.key !== 'dashboard' && canSeeModule(m, Auth.getUser()));

  content.innerHTML = `
    <div class="module-page">
      <div class="page-header">
        <div class="page-greeting">${greeting}, ${user.nombre.split(' ')[0]} 👋</div>
        <div class="page-subtitle">Panel de gestión administrativa – UT COMEXAGRO</div>
      </div>

      <!-- Stats -->
      <div class="stats-row" id="stats-row">
        <div class="stat-card">
          <div class="stat-icon green">👤</div>
          <div><div class="stat-value" id="stat-postulados">–</div><div class="stat-label">Postulados registrados</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">⭐</div>
          <div><div class="stat-value" id="stat-seleccionados">–</div><div class="stat-label">Seleccionados</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">📋</div>
          <div><div class="stat-value" id="stat-contratos">–</div><div class="stat-label">Contratos activos</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">📩</div>
          <div><div class="stat-value" id="stat-pqrs">–</div><div class="stat-label">PQRs pendientes</div></div>
        </div>
      </div>

      <!-- Módulos -->
      <div class="modules-title">Módulos del sistema</div>
      <div class="modules-grid">
        ${accessibleMods.map(mod => `
          <div class="module-card" onclick="window.location.hash='${mod.key}'" id="card-${mod.key}">
            <div class="module-card-header">
              <div class="module-icon ${mod.iconClass}">${mod.icon}</div>
              <div>
                <div class="module-name">${mod.label}</div>
                <span class="badge ${mod.badgeClass}">${mod.badgeText}</span>
              </div>
            </div>
            <div class="module-desc">${mod.desc}</div>
            <div class="module-card-footer">
              <span class="module-link">Acceder <span class="module-link-arrow">›</span></span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const res = await API.get('/dashboard/stats.php');
    if (res.success) {
      const d = res.data;
      document.getElementById('stat-postulados')?.textContent.replace('–', d.postulados || 0);
      if (document.getElementById('stat-postulados'))   document.getElementById('stat-postulados').textContent   = d.postulados   ?? 0;
      if (document.getElementById('stat-seleccionados'))document.getElementById('stat-seleccionados').textContent = d.seleccionados ?? 0;
      if (document.getElementById('stat-contratos'))    document.getElementById('stat-contratos').textContent    = d.contratos    ?? 0;
      if (document.getElementById('stat-pqrs'))         document.getElementById('stat-pqrs').textContent         = d.pqrs_pendientes ?? 0;
    }
  } catch { /* silencioso */ }
}

// ================================================================
//  VISTA: POSTULADOS
// ================================================================
async function renderPostulados() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">👤 Postulados</div>
        <div class="module-page-actions">
          <button class="btn btn-secondary btn-sm" onclick="exportPostulados()">📥 Exportar</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar por nombre o documento..." id="search-postulados" oninput="filterPostulados(this.value)">
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <select class="btn btn-secondary btn-sm" id="filter-estado" onchange="filterPostulados()">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aplica">Aplica</option>
              <option value="no_aplica">No aplica</option>
              <option value="seleccionado">Seleccionado</option>
            </select>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre completo</th>
                <th>Documento</th>
                <th>Programa</th>
                <th>Cargo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="postulados-tbody">
              <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
        <div class="table-pagination">
          <span id="postulados-count">Cargando...</span>
          <div class="pagination-btns" id="pagination-btns"></div>
        </div>
      </div>
    </div>
  `;

  await loadPostuladosData();
}

let allPostulados = [];

async function loadPostuladosData() {
  try {
    const res = await API.get('/postulados/list.php');
    if (res.success) {
      allPostulados = res.data;
      renderPostuladosTable(allPostulados);
    } else {
      document.getElementById('postulados-tbody').innerHTML =
        `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">${res.message}</div></div></td></tr>`;
    }
  } catch (e) {
    document.getElementById('postulados-tbody').innerHTML =
      `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Sin datos aún</div><div class="empty-desc">Aún no hay postulados registrados en el sistema.</div></div></td></tr>`;
  }
}

function renderPostuladosTable(data) {
  const tbody = document.getElementById('postulados-tbody');
  const count  = document.getElementById('postulados-count');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Sin resultados</div><div class="empty-desc">No se encontraron postulados con los filtros aplicados.</div></div></td></tr>`;
    if (count) count.textContent = '0 resultados';
    return;
  }

  const badgeMap = {
    pendiente: 'badge-pendiente', aplica: 'badge-aplica',
    no_aplica: 'badge-no_aplica', seleccionado: 'badge-seleccionado',
    contratado: 'badge-contratado',
  };

  tbody.innerHTML = data.map(p => `
    <tr>
      <td style="color:var(--gray-400);font-size:.75rem">${p.id}</td>
      <td><strong>${p.p_nombre} ${p.p_apellido}</strong><br><small style="color:var(--gray-400)">${p.email || ''}</small></td>
      <td>${p.tipo_doc} ${p.num_doc}</td>
      <td style="font-size:.8rem">${p.programa_nombre || '–'}</td>
      <td style="font-size:.8rem">${p.cargo_nombre || '–'}</td>
      <td><span class="badge ${badgeMap[p.estado_evaluacion] || ''}">${p.estado_evaluacion}</span></td>
      <td style="font-size:.78rem;color:var(--gray-400)">${formatDate(p.created_at)}</td>
      <td>
        <div style="display:flex;gap:.375rem">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="verPostulado(${p.id})" title="Ver detalle">👁️</button>
          ${Auth.can('contratacion','evaluar') ? `<button class="btn btn-primary btn-icon btn-sm" onclick="evaluarPostulado(${p.id},'${p.estado_evaluacion}')" title="Evaluar">✏️</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  if (count) count.textContent = `${data.length} postulado${data.length !== 1 ? 's' : ''}`;
}

function filterPostulados(searchVal) {
  const search = (searchVal || document.getElementById('search-postulados')?.value || '').toLowerCase();
  const estado = document.getElementById('filter-estado')?.value || '';
  let filtered = allPostulados;
  if (search) filtered = filtered.filter(p =>
    `${p.p_nombre} ${p.p_apellido} ${p.num_doc} ${p.email || ''}`.toLowerCase().includes(search)
  );
  if (estado) filtered = filtered.filter(p => p.estado_evaluacion === estado);
  renderPostuladosTable(filtered);
}

async function verPostulado(id) {
  try {
    const res = await API.postulados.get(id);
    if (!res.success) {
      showToastAdmin(res.message, 'error');
      return;
    }
    
    const p = res.data;
    
    const badgeMap = {
      pendiente: 'badge-pendiente', aplica: 'badge-aplica',
      no_aplica: 'badge-no_aplica', seleccionado: 'badge-seleccionado',
      contratado: 'badge-contratado',
    };

    const docItems = p.documentos && p.documentos.length 
      ? p.documentos.map(d => {
          const docUrl = `/utcomexagro/${d.ruta_relativa}`;
          const sizeKb = d.tamano_bytes ? Math.round(d.tamano_bytes / 1024) + ' KB' : '–';
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:.5rem .75rem;margin-bottom:.5rem;">
              <div style="display:flex;align-items:center;gap:.5rem;">
                <span style="font-size:1.2rem">📄</span>
                <div>
                  <div style="font-size:.85rem;font-weight:600;color:var(--white)">${d.tipo_doc.toUpperCase()}</div>
                  <div style="font-size:.7rem;color:var(--gray-500)">${d.nombre_original} (${sizeKb})</div>
                </div>
              </div>
              <a href="${docUrl}" target="_blank" class="btn btn-secondary btn-sm" style="padding:.25rem .5rem;font-size:.75rem">Abrir ↗</a>
            </div>
          `;
        }).join('')
      : '<p style="color:var(--gray-500);font-size:.85rem">No se subieron documentos para este postulado.</p>';

    const bodyHtml = `
      <div style="display:grid;grid-template-columns:1fr;gap:1.5rem;max-height:500px;overflow-y:auto;padding-right:.5rem;text-align:left;">
        
        <!-- Header info -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:.75rem;">
          <div>
            <h3 style="color:var(--white);font-size:1.2rem;margin-bottom:.25rem;">${p.p_nombre} ${p.s_nombre || ''} ${p.p_apellido} ${p.s_apellido || ''}</h3>
            <span style="font-size:.85rem;color:var(--gray-400)">${p.tipo_doc} ${p.num_doc}</span>
          </div>
          <span class="badge ${badgeMap[p.estado_evaluacion] || ''}" style="font-size:.85rem">${p.estado_evaluacion.toUpperCase()}</span>
        </div>

        <!-- 2 Column Grid for details -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1.5rem;">
          
          <!-- Column 1: Info Personal y Ubicación -->
          <div>
            <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-left:3px solid var(--green-500);padding-left:.5rem;">Información Personal</h4>
            <div style="display:grid;gap:.5rem;font-size:.85rem;">
              <div><span style="color:var(--gray-500)">Email:</span> <span style="color:var(--white)">${p.email || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Teléfono:</span> <span style="color:var(--white)">${p.telefono || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Sexo:</span> <span style="color:var(--white)">${p.sexo || '–'}</span></div>
              <div><span style="color:var(--gray-500)">RH:</span> <span style="color:var(--white)">${p.rh || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Fecha Nacimiento:</span> <span style="color:var(--white)">${p.fecha_nacimiento ? formatDate(p.fecha_nacimiento) : '–'}</span></div>
              <div><span style="color:var(--gray-500)">Origen:</span> <span style="color:var(--white)">${p.pais_origen || 'Colombia'}</span></div>
              <div><span style="color:var(--gray-500)">Ubicación:</span> <span style="color:var(--white)">${p.municipio || '–'}, ${p.departamento || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Dirección:</span> <span style="color:var(--white)">${p.direccion || '–'}</span></div>
            </div>
          </div>

          <!-- Column 2: Aplicación y Dotación -->
          <div>
            <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-left:3px solid var(--green-500);padding-left:.5rem;">Postulación y Salud</h4>
            <div style="display:grid;gap:.5rem;font-size:.85rem;">
              <div><span style="color:var(--gray-500)">Programa:</span> <strong style="color:var(--white)">${p.programa_nombre || '–'}</strong></div>
              <div><span style="color:var(--gray-500)">Cargo solicitado:</span> <strong style="color:var(--white)">${p.cargo_nombre || '–'}</strong></div>
              <div style="margin-top:.5rem;"><span style="color:var(--gray-500)">Talla Camisa:</span> <span style="color:var(--white)">${p.talla_camisa || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Talla Pantalón:</span> <span style="color:var(--white)">${p.talla_pantalon || '–'}</span></div>
              <div style="margin-top:.5rem;"><span style="color:var(--gray-500)">EPS:</span> <span style="color:var(--white)">${p.eps || '–'}</span></div>
              <div><span style="color:var(--gray-500)">AFP:</span> <span style="color:var(--white)">${p.afp || '–'}</span></div>
              <div><span style="color:var(--gray-500)">ARL:</span> <span style="color:var(--white)">${p.arl || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Discapacidad:</span> <span style="color:var(--white)">${p.discapacidad || 'Ninguna'}</span></div>
            </div>
          </div>

        </div>

        <!-- Evaluation details if evaluated -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:1rem;">
          <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:.25rem;">Evaluación Interna</h4>
          <div style="display:grid;gap:.5rem;font-size:.85rem;">
            <div><span style="color:var(--gray-500)">Evaluado por:</span> <span style="color:var(--white)">${p.evaluador_nombre ? p.evaluador_nombre + ' ' + (p.evaluador_apellidos || '') : 'Sin evaluar'}</span></div>
            <div><span style="color:var(--gray-500)">Fecha evaluación:</span> <span style="color:var(--white)">${p.fecha_evaluacion ? formatDate(p.fecha_evaluacion) + ' ' + new Date(p.fecha_evaluacion).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'}) : '–'}</span></div>
            <div><span style="color:var(--gray-500)">Observaciones:</span> <p style="color:var(--white);margin-top:.25rem;font-style:italic;line-height:1.4;">"${p.observaciones_evaluacion || 'Sin observaciones.'}"</p></div>
          </div>
        </div>

        <!-- Documents section -->
        <div>
          <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-left:3px solid var(--green-500);padding-left:.5rem;">Documentos Adjuntos</h4>
          ${docItems}
        </div>

      </div>
    `;

    showModal('Detalle del Postulado', bodyHtml);

  } catch (err) {
    showToastAdmin('Error al obtener los detalles del postulado.', 'error');
  }
}

async function evaluarPostulado(id, estadoActual) {
  const estados = ['pendiente','aplica','no_aplica','seleccionado'];
  const opcionesBtns = estados.map(e =>
    `<button class="btn ${e === estadoActual ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setEvaluacion(${id},'${e}')">${estadoIcons[e]} ${e}</button>`
  ).join('');

  showModal('Evaluar Postulado', `
    <p style="margin-bottom:1rem;color:var(--gray-500)">Seleccione el estado de evaluación:</p>
    <div style="display:flex;flex-wrap:wrap;gap:.5rem">${opcionesBtns}</div>
    <div class="form-group" style="margin-top:1rem">
      <label class="form-label">Observaciones</label>
      <textarea class="form-control" id="eval-obs" rows="3" placeholder="Notas adicionales..."></textarea>
    </div>
  `);
}

const estadoIcons = { pendiente:'⏳', aplica:'✅', no_aplica:'❌', seleccionado:'⭐' };

async function setEvaluacion(id, estado) {
  const obs = document.getElementById('eval-obs')?.value || '';
  const fd  = new FormData();
  fd.append('postulado_id', id);
  fd.append('estado', estado);
  fd.append('observaciones', obs);
  const res = await API.post('/contratacion/evaluar.php', fd);
  closeModal();
  if (res.success) { showToastAdmin('Evaluación guardada.'); loadPostuladosData(); }
  else showToastAdmin(res.message || 'Error al evaluar.', 'error');
}

function exportPostulados() {
  alert('Exportación a Excel – Próximamente disponible.');
}

// ================================================================
//  VISTA: CONTRATACIÓN
// ================================================================
function renderContratacion() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-title" style="margin-bottom:1.5rem">📋 Contratación</div>
      <div class="modules-grid">
        <div class="module-card" onclick="window.location.hash='postulados'">
          <div class="module-card-header">
            <div class="module-icon icon-people">✅</div>
            <div><div class="module-name">Evaluación de Postulados</div></div>
          </div>
          <div class="module-desc">Revisar y marcar postulados como Aplica / No Aplica / Seleccionado.</div>
          <div class="module-card-footer"><span class="module-link">Ir a Postulados <span class="module-link-arrow">›</span></span></div>
        </div>
        <div class="module-card" onclick="alert('Próximamente')">
          <div class="module-card-header">
            <div class="module-icon icon-contract">📄</div>
            <div><div class="module-name">Generación de Contratos</div><span class="badge badge-dev">En desarrollo</span></div>
          </div>
          <div class="module-desc">Generar contratos automáticos en PDF a partir de minutas predefinidas.</div>
          <div class="module-card-footer"><span class="module-link">Próximamente <span class="module-link-arrow">›</span></span></div>
        </div>
        <div class="module-card" onclick="alert('Próximamente')">
          <div class="module-card-header">
            <div class="module-icon icon-budget">💵</div>
            <div><div class="module-name">Nómina</div><span class="badge badge-dev">En desarrollo</span></div>
          </div>
          <div class="module-desc">Gestión de períodos de nómina, liquidaciones y desprendibles.</div>
          <div class="module-card-footer"><span class="module-link">Próximamente <span class="module-link-arrow">›</span></span></div>
        </div>
      </div>
    </div>
  `;
}

// ================================================================
//  VISTA: CONFIGURACIÓN
// ================================================================
function renderConfiguracion() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-title" style="margin-bottom:1.5rem">⚙️ Configuración del Sistema</div>
      <div class="modules-grid">
        <div class="module-card" onclick="loadUsuarios()">
          <div class="module-card-header">
            <div class="module-icon icon-people">👥</div>
            <div><div class="module-name">Usuarios</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Gestionar usuarios del sistema, activar cuentas y asignar roles.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>
        <div class="module-card" onclick="loadRoles()">
          <div class="module-card-header">
            <div class="module-icon icon-config">🔐</div>
            <div><div class="module-name">Roles y Permisos</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Definir roles y asignar permisos granulares por módulo y acción.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>
        <div class="module-card" onclick="alert('Próximamente')">
          <div class="module-card-header">
            <div class="module-icon icon-config">🌿</div>
            <div><div class="module-name">Programas</div><span class="badge badge-dev">Próximo</span></div>
          </div>
          <div class="module-desc">Administrar los programas activos disponibles para postulación.</div>
          <div class="module-card-footer"><span class="module-link">Próximamente <span class="module-link-arrow">›</span></span></div>
        </div>
      </div>
    </div>
  `;
}

// ================================================================
//  GESTIÓN DE USUARIOS (CONFIGURACIÓN)
// ================================================================
async function loadUsuarios() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">⚙️ Gestión de Usuarios</div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalUsuario()">➕ Agregar Usuario</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('configuracion')">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar por nombre o email..." id="search-usuarios" oninput="filterUsuarios()">
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <select class="btn btn-secondary btn-sm" id="filter-rol-usuario" onchange="filterUsuarios()">
              <option value="">Todos los roles</option>
            </select>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Último Acceso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="usuarios-tbody">
              <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando usuarios...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const [resUsers, resRoles] = await Promise.all([
      API.configuracion.usuarios.list(),
      API.configuracion.roles()
    ]);

    if (resUsers.success && resRoles.success) {
      window.allUsuarios = resUsers.data;
      window.allRoles = resRoles.data;
      
      // Llenar select de roles en filtros
      const filterRol = document.getElementById('filter-rol-usuario');
      if (filterRol) {
        resRoles.data.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.nombre;
          opt.textContent = r.nombre;
          filterRol.appendChild(opt);
        });
      }

      renderUsuariosTable(window.allUsuarios);
    } else {
      document.getElementById('usuarios-tbody').innerHTML = 
        `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--danger)">Error al cargar datos: ${resUsers.message || resRoles.message}</td></tr>`;
    }
  } catch (err) {
    document.getElementById('usuarios-tbody').innerHTML = 
      `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--danger)">Error de conexión con el servidor.</td></tr>`;
  }
}

function renderUsuariosTable(data) {
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-400)">No se encontraron usuarios.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(u => {
    const isSelf = u.id === Auth.getUser().id;
    const badgeClass = u.activo ? 'badge-aplica' : 'badge-no_aplica';
    const statusText = u.activo ? 'Activo' : 'Inactivo';
    const toggleTitle = u.activo ? 'Inactivar usuario' : 'Activar usuario';
    const toggleIcon = u.activo ? '🔒' : '🔓';
    
    return `
      <tr>
        <td style="color:var(--gray-400);font-size:.75rem">${u.id}</td>
        <td><strong>${u.nombre} ${u.apellidos || ''}</strong></td>
        <td>${u.email}</td>
        <td><span class="badge badge-active" style="background:var(--gray-800);border:1px solid var(--gray-700)">${u.rol_nombre || 'Sin Rol'}</span></td>
        <td style="font-size:.8rem">${u.ultimo_acceso ? formatDate(u.ultimo_acceso) + ' ' + new Date(u.ultimo_acceso).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'}) : 'Nunca'}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>
          <div style="display:flex;gap:.375rem">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="toggleUsuario(${u.id})" ${isSelf ? 'disabled title="No puedes desactivarte a ti mismo"' : `title="${toggleTitle}"`}>
              ${toggleIcon}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterUsuarios() {
  const search = (document.getElementById('search-usuarios')?.value || '').toLowerCase();
  const rol = document.getElementById('filter-rol-usuario')?.value || '';
  
  let filtered = window.allUsuarios || [];
  if (search) {
    filtered = filtered.filter(u => 
      `${u.nombre} ${u.apellidos || ''} ${u.email}`.toLowerCase().includes(search)
    );
  }
  if (rol) {
    filtered = filtered.filter(u => u.rol_nombre === rol);
  }
  renderUsuariosTable(filtered);
}

async function toggleUsuario(id) {
  try {
    const res = await API.configuracion.usuarios.toggle(id);
    if (res.success) {
      showToastAdmin('Estado de usuario actualizado correctamente.');
      loadUsuarios(); // Recargar tabla
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al actualizar el usuario.', 'error');
  }
}

function abrirModalUsuario() {
  const rolesOpts = (window.allRoles || []).map(r => 
    `<option value="${r.id}">${r.nombre} - ${r.descripcion}</option>`
  ).join('');

  showModal('Crear Nuevo Usuario', `
    <form id="form-crear-usuario" onsubmit="guardarUsuario(event)" style="display:flex;flex-direction:column;gap:1rem">
      <div class="form-group">
        <label class="form-label" for="usr-nombre">Nombres *</label>
        <input type="text" class="form-control" id="usr-nombre" required placeholder="Nombres">
      </div>
      <div class="form-group">
        <label class="form-label" for="usr-apellidos">Apellidos</label>
        <input type="text" class="form-control" id="usr-apellidos" placeholder="Apellidos">
      </div>
      <div class="form-group">
        <label class="form-label" for="usr-email">Correo Electrónico *</label>
        <input type="email" class="form-control" id="usr-email" required placeholder="usuario@utcomexagro.com">
      </div>
      <div class="form-group">
        <label class="form-label" for="usr-pass">Contraseña Temporal *</label>
        <input type="password" class="form-control" id="usr-pass" required placeholder="Contraseña">
      </div>
      <div class="form-group">
        <label class="form-label" for="usr-rol">Rol de Acceso *</label>
        <select class="form-control" id="usr-rol" required style="padding-left:1rem">
          <option value="">Seleccione un rol...</option>
          ${rolesOpts}
        </select>
      </div>
      <div class="remember-wrap" style="color:var(--white);margin-top:.5rem">
        <input type="checkbox" id="usr-activo" checked style="width:18px;height:18px;accent-color:var(--green-500)">
        <label for="usr-activo" style="cursor:pointer;font-size:.875rem">Activar usuario inmediatamente</label>
      </div>
      <button type="submit" style="display:none;" id="btn-submit-user-hidden"></button>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-user-hidden').click()">Crear Usuario</button>
  `);
}

async function guardarUsuario(event) {
  event.preventDefault();
  
  const nombre = document.getElementById('usr-nombre').value.trim();
  const apellidos = document.getElementById('usr-apellidos').value.trim();
  const email = document.getElementById('usr-email').value.trim();
  const password = document.getElementById('usr-pass').value;
  const rol_id = document.getElementById('usr-rol').value;
  const activo = document.getElementById('usr-activo').checked ? 1 : 0;

  if (!nombre || !email || !password || !rol_id) {
    showToastAdmin('Por favor complete todos los campos obligatorios.', 'error');
    return;
  }

  const fd = new FormData();
  fd.append('nombre', nombre);
  fd.append('apellidos', apellidos);
  fd.append('email', email);
  fd.append('password', password);
  fd.append('rol_id', rol_id);
  fd.append('activo', activo);

  try {
    const res = await API.configuracion.usuarios.create(fd);
    if (res.success) {
      showToastAdmin('Usuario creado correctamente.');
      closeModal();
      loadUsuarios();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar el usuario.', 'error');
  }
}

// ================================================================
//  GESTIÓN DE ROLES Y PERMISOS (CONFIGURACIÓN)
// ================================================================
async function loadRoles() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">🔐 Gestión de Roles y Permisos</div>
        <div class="module-page-actions">
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('configuracion')">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Rol</th>
                <th>Descripción</th>
                <th>Permisos Activos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="roles-tbody">
              <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando roles...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await API.configuracion.roles();
    if (res.success) {
      window.allRoles = res.data;
      renderRolesTable(res.data);
    } else {
      document.getElementById('roles-tbody').innerHTML = 
        `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--danger)">Error al cargar roles.</td></tr>`;
    }
  } catch (err) {
    document.getElementById('roles-tbody').innerHTML = 
      `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--danger)">Error de conexión con el servidor.</td></tr>`;
  }
}

function renderRolesTable(data) {
  const tbody = document.getElementById('roles-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gray-400)">No se encontraron roles.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(r => {
    const count = r.permiso_ids ? r.permiso_ids.length : 0;
    const isSuper = r.id === 1;
    
    return `
      <tr>
        <td style="color:var(--gray-400);font-size:.75rem">${r.id}</td>
        <td><strong>${r.nombre}</strong></td>
        <td>${r.descripcion || 'Sin descripción'}</td>
        <td><span class="badge badge-active">${count} permisos</span></td>
        <td>
          <div style="display:flex;gap:.375rem">
            <button class="btn btn-primary btn-sm" onclick="editarPermisosRol(${r.id})" ${isSuper ? 'disabled title="Superadmin posee todos los permisos de forma fija"' : ''}>
              🔑 Editar Permisos
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function editarPermisosRol(rolId) {
  const rol = (window.allRoles || []).find(r => r.id === rolId);
  if (!rol) return;

  try {
    const resPerms = await API.configuracion.permisos();
    if (!resPerms.success) {
      showToastAdmin('Error al cargar catálogo de permisos.', 'error');
      return;
    }

    const perms = resPerms.data;
    // Agrupar por módulo
    const grouped = {};
    perms.forEach(p => {
      if (!grouped[p.modulo]) grouped[p.modulo] = [];
      grouped[p.modulo].push(p);
    });

    const isChecked = (permId) => (rol.permiso_ids || []).includes(permId);

    const bodyHtml = `
      <p style="margin-bottom:1rem;color:var(--gray-400)">
        Seleccione los permisos otorgados al rol <strong>${rol.nombre}</strong>:
      </p>
      <div style="max-height: 400px; overflow-y: auto; padding-right: .5rem; display: flex; flex-direction: column; gap: 1rem;">
        ${Object.entries(grouped).map(([modulo, items]) => `
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:1rem">
            <h4 style="text-transform:uppercase;color:var(--green-300);font-size:0.8rem;margin-bottom:0.75rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0.25rem;">
              Módulo: ${modulo}
            </h4>
            <div style="display:grid;grid-template-columns:1fr;gap:0.5rem;">
              ${items.map(item => `
                <label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.85rem;color:var(--gray-300);cursor:pointer;">
                  <input type="checkbox" class="perm-checkbox" value="${item.id}" ${isChecked(item.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--green-500);margin-top:2px;">
                  <div>
                    <span style="font-weight:600;color:var(--white);">${item.accion}</span>
                    <span style="display:block;font-size:0.75rem;color:var(--gray-500);">${item.descripcion || ''}</span>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    showModal(`Editar Permisos: ${rol.nombre}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="guardarPermisosRol(${rolId})">Guardar Cambios</button>
    `);

  } catch (err) {
    showToastAdmin('Error al abrir editor de permisos.', 'error');
  }
}

async function guardarPermisosRol(rolId) {
  const checkboxes = document.querySelectorAll('.perm-checkbox');
  const checkedIds = [];
  checkboxes.forEach(cb => {
    if (cb.checked) checkedIds.push(parseInt(cb.value, 10));
  });

  try {
    const res = await API.configuracion.roles.updatePermisos(rolId, checkedIds);
    if (res.success) {
      showToastAdmin('Permisos del rol actualizados correctamente.');
      closeModal();
      loadRoles(); // Recargar roles
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar los permisos.', 'error');
  }
}

// ================================================================
//  VISTA: PRÓXIMAMENTE (módulos en desarrollo)
// ================================================================
function renderComingSoon(mod) {
  if (!mod) { navigateTo('dashboard'); return; }
  document.getElementById('content').innerHTML = `
    <div class="module-page">
      <div class="empty-state" style="margin-top:3rem">
        <div class="empty-icon">${mod.icon}</div>
        <div class="empty-title">${mod.label}</div>
        <div class="empty-desc">${mod.desc}<br><br>Este módulo está en desarrollo y estará disponible próximamente.</div>
        <button class="btn btn-primary" onclick="window.location.hash='dashboard'">← Volver al inicio</button>
      </div>
    </div>
  `;
}

// ================================================================
//  SIDEBAR – collapse / mobile
// ================================================================
function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  // Toggle colapso
  toggleBtn?.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    toggleBtn.textContent = collapsed ? '›' : '‹';
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  });

  // Restaurar estado guardado
  if (localStorage.getItem('sidebar_collapsed') === '1') {
    sidebar.classList.add('collapsed');
    if (toggleBtn) toggleBtn.textContent = '›';
  }

  // Hamburguesa móvil
  document.getElementById('topbar-hamburger')?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // Cerrar al clic fuera en móvil
  document.getElementById('content')?.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
}

// ================================================================
//  TOPBAR
// ================================================================
function initTopbar(user) {
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('¿Deseas cerrar sesión?')) Auth.logout();
  });
}

// ================================================================
//  RELOJ EN TOPBAR
// ================================================================
function startClock() {
  const el = document.getElementById('topbar-time');
  if (!el) return;
  const update = () => {
    el.textContent = new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
  };
  update();
  setInterval(update, 60000);
}

// ================================================================
//  MODAL GENÉRICO
// ================================================================
function showModal(title, bodyHtml, footerHtml = '') {
  let backdrop = document.getElementById('generic-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'generic-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal-admin">
        <div class="modal-admin-header">
          <div class="modal-admin-title" id="generic-modal-title"></div>
          <div class="modal-admin-close" onclick="closeModal()">✕</div>
        </div>
        <div class="modal-admin-body" id="generic-modal-body"></div>
        <div class="modal-admin-footer" id="generic-modal-footer"></div>
      </div>`;
    backdrop.addEventListener('click', e => { if(e.target===backdrop) closeModal(); });
    document.body.appendChild(backdrop);
  }
  document.getElementById('generic-modal-title').textContent = title;
  document.getElementById('generic-modal-body').innerHTML = bodyHtml;
  document.getElementById('generic-modal-footer').innerHTML = footerHtml || '<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>';
  backdrop.classList.add('open');
}

function closeModal() {
  document.getElementById('generic-modal-backdrop')?.classList.remove('open');
}

// ================================================================
//  TOAST ADMIN
// ================================================================
function showToastAdmin(msg, type = 'success') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `admin-toast admin-toast-${type}`;
  t.style.cssText = `
    position:fixed;bottom:1.5rem;right:1.5rem;z-index:9998;
    background:${type==='error'?'#1F2937':'#064E3B'};
    color:#fff;padding:.75rem 1.25rem;border-radius:10px;
    font-size:.875rem;font-weight:500;display:flex;gap:.5rem;align-items:center;
    box-shadow:0 8px 24px rgba(0,0,0,.3);
    border-left:4px solid ${type==='error'?'#DC2626':'#22C55E'};
    transform:translateY(60px);opacity:0;transition:all .4s cubic-bezier(.34,1.56,.64,1);
  `;
  t.innerHTML = `<span>${type==='error'?'❌':'✅'}</span><span>${msg}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.transform='translateY(0)';t.style.opacity='1'; });
  setTimeout(()=>{ t.style.opacity='0';t.style.transform='translateY(60px)'; setTimeout(()=>t.remove(),400); }, 4000);
}

// ================================================================
//  UTILIDADES
// ================================================================
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' });
}
