// ============================================================
// MÓDULO: CARGOS OFERTADOS
// ============================================================

async function renderCargos() {
  if (typeof updateBreadcrumb === 'function') {
    updateBreadcrumb([
      { label: '🏠', key: 'dashboard' },
      { label: 'Contratación', key: 'contratacion' },
      { label: 'Cargos Ofertados' }
    ]);
  }

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">💼 Cargos Ofertados</div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalCargo()">+ Nuevo Cargo</button>
          <button class="btn btn-secondary btn-sm" onclick="renderContratacion()">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar cargo..." id="search-cargo" oninput="filterCargos(this.value)">
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="cargos-tbody">
              <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadCargosData();
}

let allCargos = [];

async function loadCargosData() {
  try {
    const res = await API.get('/cargos/list.php'); // Llama a todos (admin)
    if (res.success) {
      allCargos = res.data;
      renderCargosTable(allCargos);
    } else {
      document.getElementById('cargos-tbody').innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger)">${res.message}</td></tr>`;
    }
  } catch (err) {
    document.getElementById('cargos-tbody').innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger)">Error de conexión</td></tr>`;
  }
}

function renderCargosTable(data) {
  const tbody = document.getElementById('cargos-tbody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400)">No hay cargos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(c => `
    <tr>
      <td>${c.id}</td>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.descripcion || '-'}</td>
      <td>
        <span class="badge ${c.activo == 1 ? 'badge-active' : 'badge-inactive'}">
          ${c.activo == 1 ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-secondary btn-sm" onclick='abrirModalCargo(${JSON.stringify(c).replace(/'/g, "&#39;")})'>✏️</button>
          <button class="btn btn-secondary btn-sm" style="color:var(--danger)" onclick="eliminarCargo(${c.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCargos(term) {
  term = term.toLowerCase();
  const filtered = allCargos.filter(c => 
    c.nombre.toLowerCase().includes(term) || 
    (c.descripcion && c.descripcion.toLowerCase().includes(term))
  );
  renderCargosTable(filtered);
}

function abrirModalCargo(cargo = null) {
  const isEdit = !!cargo;
  const title = isEdit ? 'Editar Cargo' : 'Nuevo Cargo';

  const formHtml = `
    <form id="form-cargo" onsubmit="guardarCargo(event, ${isEdit ? cargo.id : 'null'})">
      <div class="form-group">
        <label class="form-label">Nombre del Cargo *</label>
        <input type="text" id="car-nombre" class="form-control" value="${isEdit ? cargo.nombre : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea id="car-descripcion" class="form-control" rows="2">${isEdit ? (cargo.descripcion||'') : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Perfil Requerido</label>
        <textarea id="car-perfil" class="form-control" rows="3">${isEdit ? (cargo.perfil_requerido||'') : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label" style="display:flex;align-items:center;gap:0.5rem">
          <input type="checkbox" id="car-activo" ${!isEdit || cargo.activo == 1 ? 'checked' : ''}>
          Cargo Activo (Disponible para postulación)
        </label>
      </div>
      <button type="submit" style="display:none;" id="btn-save-cargo-hidden"></button>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-save-cargo-hidden').click()">${isEdit ? 'Guardar Cambios' : 'Crear Cargo'}</button>
  `;

  showModal(title, formHtml, footerHtml);
}

async function guardarCargo(e, id) {
  e.preventDefault();
  const btn = document.querySelector('.modal-admin-footer .btn-primary');
  if(btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  const fd = new FormData();
  if (id) fd.append('id', id);
  fd.append('nombre', document.getElementById('car-nombre').value);
  fd.append('descripcion', document.getElementById('car-descripcion').value);
  fd.append('perfil_requerido', document.getElementById('car-perfil').value);
  fd.append('activo', document.getElementById('car-activo').checked ? 1 : 0);

  const url = id ? '/cargos/update.php' : '/cargos/create.php';

  try {
    const res = await API.post(url, fd);
    if (res.success) {
      showToastAdmin(res.message);
      closeModal();
      loadCargosData();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error de conexión', 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
  }
}

async function eliminarCargo(id) {
  if (!confirm('¿Está seguro de eliminar este cargo?')) return;

  const fd = new FormData();
  fd.append('id', id);

  try {
    const res = await API.post('/cargos/delete.php', fd);
    if (res.success) {
      showToastAdmin(res.message);
      loadCargosData();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error de conexión', 'error');
  }
}
