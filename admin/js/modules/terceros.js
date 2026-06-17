// ================================================================
//  MÓDULO: TERCEROS
//  admin/js/modules/terceros.js
// ================================================================

async function renderTerceros() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Financiero', key: 'presupuesto' },
    { label: 'Terceros', key: 'terceros' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  try {
    const res = await API.get('/terceros/list.php');
    window.allTerceros = res.success ? res.data : [];

    content.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">🪪 Gestión de Terceros</div>
          <div class="module-page-actions">
            <button class="btn btn-primary" onclick="abrirModalTercero()">+ Nuevo Tercero</button>
          </div>
        </div>

        <div class="table-card" style="animation: fadeIn .3s ease">
          <div class="table-toolbar">
            <div class="table-search">
              <span>🔍</span>
              <input type="text" id="search-terceros" placeholder="Buscar por documento o nombre..." onkeyup="filterTerceros()">
            </div>
            <div class="table-filters" style="display:flex; gap:.5rem;">
              <select id="filter-tipo" class="form-control" onchange="filterTerceros()">
                <option value="">Todos los Tipos</option>
                <option value="Proveedor">Proveedor</option>
                <option value="Cliente">Cliente</option>
                <option value="Empleado">Empleado</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre / Razón Social</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tb-terceros"></tbody>
          </table>
          <div class="table-pagination" id="pag-terceros"></div>
        </div>
      </div>
    `;
    renderTercerosTable(window.allTerceros);
  } catch (err) {
    showToastAdmin('Error al cargar terceros', 'error');
  }
}

function renderTercerosTable(data) {
  const tbody = document.getElementById('tb-terceros');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">No hay terceros registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(t => {
    let badgeClass = t.estado === 'Activo' ? 'badge-active' : 'badge-inactive';
    return `
      <tr>
        <td style="font-weight:500; color:var(--gray-700)">${t.tipo_documento} ${t.numero_documento}</td>
        <td style="font-weight:600; color:var(--gray-900)">${t.nombre_razon_social}</td>
        <td>${t.tipo_tercero}</td>
        <td>
          <div style="font-size:0.85rem; color:var(--gray-600)">${t.email || '-'}</div>
          <div style="font-size:0.85rem; color:var(--gray-600)">${t.telefono || '-'}</div>
        </td>
        <td><span class="badge ${badgeClass}">${t.estado}</span></td>
        <td>
          <div style="display:flex;gap:.375rem">
            <button class="btn-icon" onclick="abrirModalTercero(${t.id})" title="Editar">✏️</button>
            <button class="btn-icon" onclick="eliminarTercero(${t.id})" title="Eliminar" style="color:var(--red-600)">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTerceros() {
  const q = (document.getElementById('search-terceros')?.value || '').toLowerCase();
  const tipo = document.getElementById('filter-tipo')?.value || '';
  
  const filtered = window.allTerceros.filter(t => {
    const matchesQuery = t.numero_documento.toLowerCase().includes(q) || 
                         t.nombre_razon_social.toLowerCase().includes(q);
    const matchesTipo = tipo === '' || t.tipo_tercero === tipo;
    return matchesQuery && matchesTipo;
  });
  
  renderTercerosTable(filtered);
}

function abrirModalTercero(id = null) {
  let t = null;
  if (id) {
    t = window.allTerceros.find(x => x.id === id);
    if (!t) return;
  }

  const title = t ? 'Editar Tercero' : 'Nuevo Tercero';
  
  const html = `
    <form id="form-tercero" onsubmit="guardarTercero(event, ${id || 'null'})">
      
      <div style="display:grid; grid-template-columns:1fr 2fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label" for="t-tipo-doc">Tipo Documento</label>
          <select class="form-control" id="t-tipo-doc" required>
            <option value="NIT" ${t?.tipo_documento==='NIT'?'selected':''}>NIT</option>
            <option value="CC" ${t?.tipo_documento==='CC'?'selected':''}>Cédula de Ciudadanía (CC)</option>
            <option value="CE" ${t?.tipo_documento==='CE'?'selected':''}>Cédula de Extranjería (CE)</option>
            <option value="RUT" ${t?.tipo_documento==='RUT'?'selected':''}>RUT</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="t-num-doc">Número Documento</label>
          <input type="text" class="form-control" id="t-num-doc" value="${t?.numero_documento || ''}" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="t-nombre">Nombre / Razón Social</label>
        <input type="text" class="form-control" id="t-nombre" value="${t?.nombre_razon_social || ''}" required>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label" for="t-tipo">Tipo de Tercero</label>
          <select class="form-control" id="t-tipo" required>
            <option value="Proveedor" ${t?.tipo_tercero==='Proveedor'?'selected':''}>Proveedor</option>
            <option value="Cliente" ${t?.tipo_tercero==='Cliente'?'selected':''}>Cliente</option>
            <option value="Empleado" ${t?.tipo_tercero==='Empleado'?'selected':''}>Empleado</option>
            <option value="Otro" ${t?.tipo_tercero==='Otro'?'selected':''}>Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="t-estado">Estado</label>
          <select class="form-control" id="t-estado" required>
            <option value="Activo" ${t?.estado==='Activo'?'selected':''}>Activo</option>
            <option value="Inactivo" ${t?.estado==='Inactivo'?'selected':''}>Inactivo</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label" for="t-email">Correo Electrónico</label>
          <input type="email" class="form-control" id="t-email" value="${t?.email || ''}">
        </div>
        <div class="form-group">
          <label class="form-label" for="t-tel">Teléfono</label>
          <input type="text" class="form-control" id="t-tel" value="${t?.telefono || ''}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="t-dir">Dirección</label>
        <input type="text" class="form-control" id="t-dir" value="${t?.direccion || ''}">
      </div>

      <button type="submit" style="display:none;" id="btn-submit-tercero-hidden"></button>
    </form>
  `;

  showModal(title, html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-tercero-hidden').click()">Guardar</button>
  `, false);
}

async function guardarTercero(event, id) {
  event.preventDefault();

  const payload = {
    tipo_documento: document.getElementById('t-tipo-doc').value,
    numero_documento: document.getElementById('t-num-doc').value.trim(),
    nombre_razon_social: document.getElementById('t-nombre').value.trim(),
    tipo_tercero: document.getElementById('t-tipo').value,
    estado: document.getElementById('t-estado').value,
    email: document.getElementById('t-email').value.trim(),
    telefono: document.getElementById('t-tel').value.trim(),
    direccion: document.getElementById('t-dir').value.trim()
  };

  const endpoint = id ? '/terceros/update.php' : '/terceros/create.php';
  if (id) payload.id = id;

  try {
    const res = await API.post(endpoint, payload);
    if (res.success) {
      showToastAdmin(res.message, 'success');
      closeModal();
      renderTerceros(); // recargar
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error en el servidor', 'error');
  }
}

window.eliminarTercero = async function(id) {
  Swal.fire({
    title: '¿Eliminar tercero?',
    text: "Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await API.post('/terceros/delete.php', { id });
        if (res.success) {
          showToastAdmin(res.message, 'success');
          renderTerceros();
        } else {
          showToastAdmin(res.message, 'error');
        }
      } catch (err) {
        showToastAdmin('Error al eliminar tercero', 'error');
      }
    }
  });
}
