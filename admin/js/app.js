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
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-budget',
  },
  {
    key: 'terceros',
    label: 'Terceros',
    icon: '🪪',
    desc: 'Gestión de Proveedores y Clientes',
    section: 'hidden', // No show in sidebar
    permiso: 'presupuesto.leer', // Hereda permisos de presupuesto
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-people',
  },
  {
    key: 'presupuesto_rubros',
    label: 'Planeación Presupuestal',
    icon: '🧮',
    desc: 'Rubros y Árbol Presupuestal',
    section: 'hidden',
    permiso: 'presupuesto.leer',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-budget',
  },
  {
    key: 'presupuesto_movimientos',
    label: 'Ejecución Presupuestal',
    icon: '💸',
    desc: 'Registro de movimientos',
    section: 'hidden',
    permiso: 'presupuesto.leer',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-budget',
  },
  {
    key: 'presupuesto_traslados',
    label: 'Traslados',
    icon: '🔁',
    desc: 'Traslados presupuestales',
    section: 'hidden',
    permiso: 'presupuesto.leer',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
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
  {
    key: 'pqrs',
    label: 'PQRS',
    icon: '🗣️',
    desc: 'Control y seguimiento de Peticiones, Quejas y Reclamos',
    section: 'admin',
    permiso: 'pqrs.leer',
    badgeText: 'Activo',
    badgeClass: 'badge-active',
    iconClass: 'icon-message',
  },
  {
    key: 'informes',
    label: 'Informes',
    icon: '📊',
    desc: 'Central de reportes y exportaciones',
    section: 'admin',
    permiso: 'informes.leer',
    badgeText: 'Nuevo',
    badgeClass: 'badge-active',
    iconClass: 'icon-training',
  }
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
  updateBreadcrumb();

  // Cargar vista
  const content = document.getElementById('content');
  showSkeletonLoader('content');

  setTimeout(() => {
    switch(moduleKey) {
      case 'dashboard':     renderDashboard(); break;
      case 'postulados':    renderPostulados(); break;
      case 'contratacion':  renderContratacion(); break;
      case 'configuracion': renderConfiguracion(); break;
      case 'beneficiarios': renderBeneficiariosMenu(); break;
      case 'organizaciones':renderOrganizaciones(); break;
      case 'encuestas':     renderEncuestas(); break;
      case 'pqrs':          renderPqrs(); break;
      case 'presupuesto':   renderPresupuesto(); break;
      case 'terceros':      renderTerceros(); break;
      case 'presupuesto_rubros': renderPresupuestoRubros(); break;
      case 'presupuesto_movimientos': renderPresupuestoMovimientos(); break;
      case 'presupuesto_traslados': renderPresupuestoTraslados(); break;
      case 'informes':      renderInformes(); break;
      default:              const mod = MODULES.find(m => m.key === moduleKey); renderComingSoon(mod); break;
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
  const accessibleMods = MODULES.filter(m => m.key !== 'dashboard' && m.section !== 'hidden' && canSeeModule(m, Auth.getUser()));

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
          <div><div class="stat-value" id="stat-pqrs">–</div><div class="stat-label">PQRS (Total / Resueltas)</div></div>
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
      if (document.getElementById('stat-postulados'))   document.getElementById('stat-postulados').textContent   = d.postulados   ?? 0;
      if (document.getElementById('stat-seleccionados'))document.getElementById('stat-seleccionados').textContent = d.seleccionados ?? 0;
      if (document.getElementById('stat-contratos'))    document.getElementById('stat-contratos').textContent    = d.contratos    ?? 0;
      if (document.getElementById('stat-pqrs'))         document.getElementById('stat-pqrs').textContent         = `${d.pqrs_total ?? 0} / ${d.pqrs_resueltas ?? 0}`;
    }
  } catch { /* silencioso */ }
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
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Saldrás del panel de administración de UT Comexagro.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#166534',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        Auth.logout();
      }
    });
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
function showModal(title, bodyHtml, footerHtml = '', isLarge = false, preventOutsideClick = false) {
  let backdrop = document.getElementById('generic-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'generic-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal-admin" id="generic-modal-dialog">
        <div class="modal-admin-header">
          <div class="modal-admin-title" id="generic-modal-title"></div>
          <div class="modal-admin-close" onclick="closeModal()">✕</div>
        </div>
        <div class="modal-admin-body" id="generic-modal-body"></div>
        <div class="modal-admin-footer" id="generic-modal-footer"></div>
      </div>`;
    backdrop.addEventListener('click', e => { 
      if (e.target === backdrop && !backdrop.classList.contains('static-backdrop')) closeModal(); 
    });
    document.body.appendChild(backdrop);
  }
  
  const dialog = document.getElementById('generic-modal-dialog');
  if (dialog) {
    dialog.classList.toggle('modal-lg', isLarge);
  }

  document.getElementById('generic-modal-title').textContent = title;
  document.getElementById('generic-modal-body').innerHTML = bodyHtml;
  document.getElementById('generic-modal-footer').innerHTML = footerHtml || '<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>';
  
  if (preventOutsideClick) {
    backdrop.classList.add('static-backdrop');
  } else {
    backdrop.classList.remove('static-backdrop');
  }
  
  backdrop.classList.add('open');
}

// Global closeModal binding so it's accessible everywhere
window.closeModal = closeModal;
function closeModal() {
  document.getElementById('generic-modal-backdrop')?.classList.remove('open');
}

// ================================================================
//  TOAST ADMIN
// ================================================================
function showToastAdmin(msg, type = 'success') {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: type === 'success' ? 'success' : (type === 'error' ? 'error' : 'info'),
      title: type === 'success' ? 'Éxito' : (type === 'error' ? 'Error' : 'Atención'),
      text: msg,
      confirmButtonColor: type === 'success' ? '#22C55E' : '#EF4444'
    });
  } else {
    alert(msg);
  }
}

// ================================================================
//  UTILIDADES
// ================================================================
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function updateBreadcrumb(pathArray) {
  const container = document.querySelector('.breadcrumb');
  if (!container) return;

  if (!pathArray) {
    const mod = MODULES.find(m => m.key === currentModule);
    pathArray = [
      { label: '🏠', key: 'dashboard' }
    ];
    if (mod && mod.key !== 'dashboard') {
      pathArray.push({ label: mod.label });
    }
  }

  container.innerHTML = '';
  pathArray.forEach((item, index) => {
    if (index > 0) {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.textContent = '›';
      container.appendChild(sep);
    }

    const span = document.createElement('span');
    if (item.key && index < pathArray.length - 1) {
      span.className = 'breadcrumb-item';
      span.textContent = item.label;
      span.title = `Ir a ${item.label === '🏠' ? 'Inicio' : item.label}`;
      span.addEventListener('click', () => {
        if (window.location.hash === '#' + item.key) {
          navigateTo(item.key);
        } else {
          window.location.hash = item.key;
        }
      });
    } else {
      span.className = 'breadcrumb-current';
      span.textContent = item.label;
    }
    container.appendChild(span);
  });
}

/**
 * Muestra una animación de carga (skeleton) en el contenedor especificado
 * @param {string} containerId ID del contenedor donde se mostrará
 */
function showSkeletonLoader(containerId = 'content') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="skeleton-row skeleton" style="width:60%;height:24px;margin-bottom:1.5rem"></div>
      <div class="skeleton-row skeleton"></div>
      <div class="skeleton-row skeleton" style="width:80%"></div>
    `;
  }
}

// ---- Funcionalidad de Pestañas (Tabs) ----
window.switchTab = function(el, targetId) {
  // Hide all contents in the modal
  const container = el.closest('.modal-body') || document;
  container.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  
  // Show target
  const target = document.getElementById(targetId);
  if (target) target.style.display = 'flex';
  
  // Mark active
  el.classList.add('active');
};
