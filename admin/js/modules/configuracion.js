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
        <div class="module-card" onclick="loadParametros()">
          <div class="module-card-header">
            <div class="module-icon icon-config">🏢</div>
            <div><div class="module-name">Parámetros</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Información de la empresa operadora: NIT, nombre, representante legal y datos de contacto.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>
        <div class="module-card" onclick="loadParametrosNomina()">
          <div class="module-card-header">
            <div class="module-icon icon-config">💵</div>
            <div><div class="module-name">Parámetros de Nómina</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Configuración de valores legales anuales para cálculos de nómina.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>
      </div>
    </div>
  `;
}

// ================================================================
//  PARÁMETROS DE LA EMPRESA OPERADORA
// ================================================================
async function loadParametros() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Configuración', key: 'configuracion' },
    { label: 'Parámetros de Empresa' }
  ]);

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">🏢 Parámetros de la Empresa Operadora</div>
        <div class="module-page-actions">
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('configuracion')">↩️ Volver</button>
        </div>
      </div>

      <div class="form-card" style="max-width:720px;margin:0 auto">

        <!-- Header -->
        <div class="form-card-header">
          <div class="form-card-title">Información de la Empresa</div>
        </div>

        <!-- Body -->
        <div class="form-card-body">
          <p style="color:var(--gray-400);font-size:.85rem;margin:0 0 1.5rem">
            Configure los datos de la empresa u organización que opera esta plataforma.
            Esta información puede aparecer en reportes y documentos generados por el sistema.
          </p>

          <form id="form-parametros" onsubmit="guardarParametros(event)" autocomplete="off">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem 1.5rem">

              <div class="form-group">
                <label class="form-label" for="param-nit">NIT / Identificación</label>
                <input type="text" class="form-control" id="param-nit"
                  placeholder="Ej: 900.123.456-7" maxlength="20">
              </div>

              <div class="form-group">
                <label class="form-label" for="param-nombre">Nombre de la Empresa *</label>
                <input type="text" class="form-control" id="param-nombre"
                  placeholder="Nombre completo o razón social" required maxlength="200">
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label" for="param-direccion">Dirección</label>
                <input type="text" class="form-control" id="param-direccion"
                  placeholder="Calle, carrera, número, ciudad" maxlength="300">
              </div>

              <div class="form-group">
                <label class="form-label" for="param-telefono">Teléfono</label>
                <input type="tel" class="form-control" id="param-telefono"
                  placeholder="Ej: 601 123 4567" maxlength="20">
              </div>

              <div class="form-group">
                <label class="form-label" for="param-email">Correo Electrónico</label>
                <input type="email" class="form-control" id="param-email"
                  placeholder="contacto@empresa.com" maxlength="150">
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label" for="param-rep-legal">Representante Legal</label>
                <input type="text" class="form-control" id="param-rep-legal"
                  placeholder="Nombre completo del representante legal" maxlength="200">
              </div>

            </div>
          </form>

          <div id="param-updated" style="display:none;margin-top:1rem;font-size:.8rem;color:var(--gray-400);text-align:right">
            Última actualización: <span id="param-updated-date"></span>
          </div>
        </div>

        <!-- Footer -->
        <div class="form-card-footer">
          <button type="button" class="btn btn-secondary" onclick="navigateTo('configuracion')">Cancelar</button>
          <button type="submit" form="form-parametros" class="btn btn-primary" id="btn-guardar-param">💾 Guardar Parámetros</button>
        </div>

      </div>
    </div>
  `;

  // Cargar datos existentes
  try {
    const res = await API.configuracion.parametros.get();
    if (res.success && res.data) {
      const d = res.data;
      const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
      set('param-nit',       d.nit);
      set('param-nombre',    d.nombre);
      set('param-direccion', d.direccion);
      set('param-telefono',  d.telefono);
      set('param-email',     d.email);
      set('param-rep-legal', d.rep_legal);

      if (d.updated_at) {
        document.getElementById('param-updated').style.display = 'block';
        document.getElementById('param-updated-date').textContent = formatDate(d.updated_at);
      }
    }
  } catch (err) {
    showToastAdmin('Error al cargar los parámetros de empresa.', 'error');
  }
}

async function guardarParametros(event) {
  event.preventDefault();

  const btn = document.getElementById('btn-guardar-param');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  const fd = new FormData();
  fd.append('nit',       document.getElementById('param-nit')?.value.trim()       || '');
  fd.append('nombre',    document.getElementById('param-nombre')?.value.trim()    || '');
  fd.append('direccion', document.getElementById('param-direccion')?.value.trim() || '');
  fd.append('telefono',  document.getElementById('param-telefono')?.value.trim()  || '');
  fd.append('email',     document.getElementById('param-email')?.value.trim()     || '');
  fd.append('rep_legal', document.getElementById('param-rep-legal')?.value.trim() || '');

  try {
    const res = await API.configuracion.parametros.save(fd);
    if (res.success) {
      showToastAdmin('Parámetros guardados correctamente.');
      // Mostrar timestamp de actualización
      const updEl = document.getElementById('param-updated');
      const updDate = document.getElementById('param-updated-date');
      if (updEl && updDate) {
        updEl.style.display = 'block';
        updDate.textContent = formatDate(new Date().toISOString());
      }
    } else {
      showToastAdmin(res.message || 'Error al guardar.', 'error');
    }
  } catch (err) {
    showToastAdmin('Error de conexión con el servidor.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '💾 Guardar Parámetros'; }
  }
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

// ================================================================
//  GESTIÓN DE PARÁMETROS DE NÓMINA (CONFIGURACIÓN)
// ================================================================
async function loadParametrosNomina() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Configuración', key: 'configuracion' },
    { label: 'Parámetros de Nómina' }
  ]);
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div>
          <div class="module-page-title">💵 Parámetros de Nómina</div>
          <p style="color:var(--gray-400);font-size:0.85rem;margin-top:5px;">Configuración de valores legales anuales para cálculos de nómina.</p>
        </div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalParametroNomina()">➕ Nuevo Año</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('configuracion')">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>AÑO</th>
                <th>SALARIO MÍNIMO (SMLV)</th>
                <th>AUXILIO TRANSPORTE</th>
                <th>EXONERACIÓN LEY 1819</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody id="param-nomina-tbody">
              <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando parámetros...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await API.configuracion.parametrosNomina.list();
    if (res.success) {
      window.allParametrosNomina = res.data;
      renderParametrosNominaTable(res.data);
    } else {
      document.getElementById('param-nomina-tbody').innerHTML = 
        `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--danger)">Error al cargar datos.</td></tr>`;
    }
  } catch (err) {
    document.getElementById('param-nomina-tbody').innerHTML = 
      `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--danger)">Error de conexión con el servidor.</td></tr>`;
  }
}

function renderParametrosNominaTable(data) {
  const tbody = document.getElementById('param-nomina-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-400)">No hay parámetros registrados.</td></tr>`;
    return;
  }

  const fmtMoneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

  tbody.innerHTML = data.map(p => {
    const estadoBadge = p.estado == 1 ? '<span class="badge badge-aplica">Activo</span>' : '<span class="badge badge-no_aplica">Inactivo</span>';
    const exBadge = p.aplica_exoneracion == 1 ? '<span style="color:#16a34a;font-weight:bold">Sí</span>' : '<span style="color:var(--gray-500)">No</span>';
    
    return `
      <tr>
        <td><strong>${p.anio}</strong></td>
        <td>${fmtMoneda.format(p.salario_minimo)}</td>
        <td>${fmtMoneda.format(p.auxilio_transporte)}</td>
        <td>${exBadge}</td>
        <td>${estadoBadge}</td>
        <td>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="abrirModalParametroNomina(${p.id})" title="Editar Parámetro">
            ✏️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function abrirModalParametroNomina(id = null) {
  let param = { anio: new Date().getFullYear(), salario_minimo: '', auxilio_transporte: '', aplica_exoneracion: 1, estado: 1 };
  if (id) {
    param = window.allParametrosNomina.find(p => p.id == id) || param;
  }

  const title = id ? 'Editar Parámetros Anuales' : 'Nuevos Parámetros Anuales';
  
  showModal(title, `
    <form id="form-param-nomina" onsubmit="guardarParametroNomina(event, ${id || 'null'})" style="display:flex;flex-direction:column;gap:1rem">
      <div class="form-group">
        <label class="form-label" for="pn-anio">AÑO</label>
        <input type="number" class="form-control" id="pn-anio" required value="${param.anio}" ${id ? 'readonly style="background:var(--gray-800)"' : ''}>
      </div>
      <div class="form-group">
        <label class="form-label" for="pn-smlv">SALARIO MÍNIMO (SMLV)</label>
        <input type="number" step="0.01" class="form-control" id="pn-smlv" required placeholder="Ej: 1300000" value="${param.salario_minimo}">
      </div>
      <div class="form-group">
        <label class="form-label" for="pn-aux">AUXILIO TRANSPORTE</label>
        <input type="number" step="0.01" class="form-control" id="pn-aux" required placeholder="Ej: 162000" value="${param.auxilio_transporte}">
      </div>
      <div class="remember-wrap" style="color:var(--white);margin-top:.5rem;align-items:flex-start">
        <input type="checkbox" id="pn-exo" ${param.aplica_exoneracion == 1 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--green-500);margin-top:3px">
        <div>
          <label for="pn-exo" style="cursor:pointer;font-weight:bold;font-size:.85rem">¿APLICA EXONERACIÓN LEY 1819?</label>
          <div style="font-size:.75rem;color:var(--gray-400);margin-top:2px;">Exime de aportes patronales a Salud (8.5%), SENA (2%) e ICBF (3%)</div>
        </div>
      </div>
      <div class="remember-wrap" style="color:var(--white);margin-top:.5rem">
        <input type="checkbox" id="pn-estado" ${param.estado == 1 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--green-500)">
        <label for="pn-estado" style="cursor:pointer;font-size:.85rem">Parámetro Activo</label>
      </div>
      <button type="submit" style="display:none;" id="btn-submit-pn-hidden"></button>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-pn-hidden').click()">Guardar</button>
  `);
}

async function guardarParametroNomina(event, id) {
  event.preventDefault();
  
  const fd = new FormData();
  if (id) fd.append('id', id);
  fd.append('anio', document.getElementById('pn-anio').value);
  fd.append('salario_minimo', document.getElementById('pn-smlv').value);
  fd.append('auxilio_transporte', document.getElementById('pn-aux').value);
  fd.append('aplica_exoneracion', document.getElementById('pn-exo').checked ? 1 : 0);
  fd.append('estado', document.getElementById('pn-estado').checked ? 1 : 0);

  try {
    const res = await API.configuracion.parametrosNomina.save(fd);
    if (res.success) {
      showToastAdmin(res.message);
      closeModal();
      loadParametrosNomina();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar.', 'error');
  }
}
