// ============================================================
// MÓDULO: ORGANIZACIONES
// ============================================================

async function renderOrganizaciones() {
  if (typeof updateBreadcrumb === 'function') {
    updateBreadcrumb([
      { label: '🏠', key: 'dashboard' },
      { label: 'Beneficiarios', key: 'beneficiarios' },
      { label: 'Organizaciones' }
    ]);
  }

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">🏢 Organizaciones Autorizadas</div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalOrganizacion()">+ Nueva Organización</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('beneficiarios')">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar por nombre o NIT..." id="search-org" oninput="filterOrganizaciones(this.value)">
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NIT</th>
                <th>Nombre</th>
                <th>Tipo / Enfoque</th>
                <th>Representante</th>
                <th>Email / Tel</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="orgs-tbody">
              <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadOrganizacionesData();
}

let allOrganizaciones = [];

async function loadOrganizacionesData() {
  try {
    const res = await API.get('/organizaciones/list.php');
    if (res.success) {
      allOrganizaciones = res.data;
      renderOrganizacionesTable(allOrganizaciones);
    } else {
      showToastAdmin('Error al cargar organizaciones', 'error');
    }
  } catch (e) {
    console.error(e);
  }
}

function renderOrganizacionesTable(data) {
  const tbody = document.getElementById('orgs-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Sin resultados</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(o => `
    <tr>
      <td style="color:var(--gray-400);font-size:.75rem">${o.id}</td>
      <td><strong>${o.nit}</strong></td>
      <td>${o.nombre}</td>
      <td style="font-size:.85rem">
        <div>${o.tipo_nombre || 'N/A'}</div>
        ${o.poblacion_nombre ? `<span class="badge badge-aplica" style="font-size:.7rem;margin-top:.25rem">${o.poblacion_nombre}</span>` : ''}
      </td>
      <td style="font-size:.85rem">${o.rep_legal || '–'}</td>
      <td style="font-size:.85rem">${o.email || '–'}<br><span style="color:var(--gray-400)">${o.telefono || '–'}</span></td>
      <td style="font-size:.85rem">${o.municipio || '–'}, ${o.departamento || '–'}</td>
      <td><span class="badge ${o.estado === 'activo' ? 'badge-aplica' : 'badge-no_aplica'}">${o.estado.toUpperCase()}</span></td>
      <td>
        <div style="display:flex;gap:.375rem">
          <button class="btn btn-secondary btn-icon btn-sm" onclick='abrirModalOrganizacion(${JSON.stringify(o).replace(/'/g, "&apos;")})' title="Editar">✏️</button>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="eliminarOrganizacion(${o.id})" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterOrganizaciones(searchVal) {
  const search = (searchVal || '').toLowerCase();
  let filtered = allOrganizaciones;
  if (search) {
    filtered = filtered.filter(o => 
      `${o.nombre} ${o.nit}`.toLowerCase().includes(search)
    );
  }
  renderOrganizacionesTable(filtered);
}

async function abrirModalOrganizacion(org = null) {
  const isEdit = !!org;
  const title = isEdit ? 'Editar Organización' : 'Nueva Organización';
  
  // Mostrar loading state
  showModal(title, '<div style="text-align:center;padding:2rem"><div class="spinner-inline"></div> Cargando formulario...</div>', '', true);

  let tiposPoblacion = [];
  try {
    const resP = await API.get('/beneficiarios/poblacion_tipos.php');
    if (resP.success) tiposPoblacion = resP.data;
  } catch(e) {}

  const formHtml = `
    <form id="form-org" onsubmit="guardarOrganizacion(event, ${org ? org.id : 'null'})">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="form-group">
          <label class="form-label">NIT *</label>
          <input type="text" id="org-nit" class="form-control" value="${org?.nit || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre de la Organización *</label>
          <input type="text" id="org-nombre" class="form-control" value="${org?.nombre || ''}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tipo de Población (Enfoque)</label>
          <select id="org-poblacion" class="form-control">
            <option value="">-- No aplica / Ninguno --</option>
            ${tiposPoblacion.map(t => `<option value="${t.id}" ${org?.poblacion_tipo_id == t.id ? 'selected' : ''}>${t.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Representante Legal</label>
          <input type="text" id="org-rep" class="form-control" value="${org?.rep_legal || ''}">
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="org-email" class="form-control" value="${org?.email || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input type="text" id="org-telefono" class="form-control" value="${org?.telefono || ''}">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Dirección</label>
          <input type="text" id="org-direccion" class="form-control" value="${org?.direccion || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Departamento</label>
          <select id="org-depto" class="form-control"></select>
        </div>
        <div class="form-group">
          <label class="form-label">Municipio</label>
          <select id="org-mun" class="form-control"></select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select id="org-estado" class="form-control">
            <option value="activo" ${org?.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${org?.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
      <button type="submit" style="display:none;" id="btn-save-org-hidden"></button>
    </form>
  `;
  
  const footerHtml = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-save-org-hidden').click()">Guardar Organización</button>
  `;

  showModal(title, formHtml, footerHtml, true);
  
  if (typeof loadDepartamentos === 'function') {
    loadDepartamentos('org-depto');
    loadMunicipios('org-depto', 'org-mun');
    
    if (org && org.departamento) {
      const deptoSel = document.getElementById('org-depto');
      deptoSel.value = org.departamento;
      deptoSel.dispatchEvent(new Event('change'));
      
      if (org.municipio) {
        const munSel = document.getElementById('org-mun');
        // El cambio es asincrono en UI pero sincronico en JS, podemos setearlo directamente
        munSel.value = org.municipio;
      }
    }
  }
}

async function guardarOrganizacion(e, id) {
  e.preventDefault();
  const btn = document.querySelector('.modal-admin-footer .btn-primary');
  if(btn) {
    btn.disabled = true;
    btn.textContent = 'Guardando...';
  }

  const fd = new FormData();
  if (id) fd.append('id', id);
  fd.append('nit', document.getElementById('org-nit').value);
  fd.append('nombre', document.getElementById('org-nombre').value);
  
  const poblacionEl = document.getElementById('org-poblacion');
  if (poblacionEl && poblacionEl.value) {
    fd.append('poblacion_tipo_id', poblacionEl.value);
  }
  
  fd.append('rep_legal', document.getElementById('org-rep').value);
  fd.append('email', document.getElementById('org-email').value);
  fd.append('telefono', document.getElementById('org-telefono').value);
  fd.append('direccion', document.getElementById('org-direccion').value);
  fd.append('departamento', document.getElementById('org-depto').value);
  fd.append('municipio', document.getElementById('org-mun').value);
  fd.append('estado', document.getElementById('org-estado').value);

  const endpoint = id ? '/organizaciones/update.php' : '/organizaciones/create.php';
  
  try {
    const res = await API.post(endpoint, fd);
    if (res.success) {
      showToastAdmin(res.message);
      closeModal();
      loadOrganizacionesData();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error de conexión', 'error');
  } finally {
    const btn = document.querySelector('.modal-admin-footer .btn-primary');
    if(btn) {
      btn.disabled = false;
      btn.textContent = 'Guardar Organización';
    }
  }
}

async function eliminarOrganizacion(id) {
  if (!confirm('¿Está seguro de eliminar esta organización?')) return;
  const fd = new FormData();
  fd.append('id', id);
  try {
    const res = await API.post('/organizaciones/delete.php', fd);
    if (res.success) {
      showToastAdmin(res.message);
      loadOrganizacionesData();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al eliminar', 'error');
  }
}
