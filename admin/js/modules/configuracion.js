// ================================================================
//  MÓDULO: CONFIGURACIÓN
//  admin/js/modules/configuracion.js
// ================================================================

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
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Configuración', key: 'configuracion' },
    { label: 'Usuarios' }
  ]);
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
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Configuración', key: 'configuracion' },
    { label: 'Roles y Permisos' }
  ]);
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
