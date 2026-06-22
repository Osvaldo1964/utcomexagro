// ================================================================
//  MÓDULO: CONCEPTOS DE NÓMINA (CRUD)
// ================================================================

async function renderConceptosNomina() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Contratación', key: 'contratacion' },
    { label: 'Conceptos Nómina' }
  ]);
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div>
          <div class="module-page-title">Conceptos de Nómina</div>
          <p style="color:var(--gray-400);font-size:0.85rem;margin-top:5px;">Gestión de tipos de pagos (devengados) y descuentos (deducciones).</p>
        </div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalConceptoNomina()">➕ Nuevo Concepto</button>
          <button class="btn btn-secondary btn-sm" onclick="renderContratacion()">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>NOMBRE DEL CONCEPTO</th>
                <th>TIPO</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody id="conceptos-nomina-tbody">
              <tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando conceptos...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await API.contratacion.conceptosNomina.list();
    if (res.success) {
      window.allConceptosNomina = res.data;
      renderConceptosNominaTable(res.data);
    } else {
      document.getElementById('conceptos-nomina-tbody').innerHTML = 
        `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--danger)">Error al cargar datos.</td></tr>`;
    }
  } catch (err) {
    document.getElementById('conceptos-nomina-tbody').innerHTML = 
      `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--danger)">Error de conexión con el servidor.</td></tr>`;
  }
}

function renderConceptosNominaTable(data) {
  const tbody = document.getElementById('conceptos-nomina-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--gray-400)">No hay conceptos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => {
    const estadoBadge = p.estado == 1 ? '<span style="color:#16a34a;font-weight:bold;font-size:0.8rem">ACTIVO</span>' : '<span style="color:var(--danger);font-weight:bold;font-size:0.8rem">INACTIVO</span>';
    const tipoBadge = p.tipo === 'DEVENGADO' 
      ? '<span style="color:#16a34a;font-weight:bold;font-size:0.85rem">⊕ DEVENGADO</span>' 
      : '<span style="color:var(--danger);font-weight:bold;font-size:0.85rem">⊖ DEDUCCIÓN</span>';
    
    return `
      <tr>
        <td><strong>${p.nombre}</strong></td>
        <td>${tipoBadge}</td>
        <td>${estadoBadge}</td>
        <td>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="abrirModalConceptoNomina(${p.id})" title="Editar Concepto">
            <span style="color:#3b82f6">✏️</span>
          </button>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="eliminarConceptoNomina(${p.id})" title="Eliminar Concepto">
            <span style="color:var(--danger)">🗑️</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function abrirModalConceptoNomina(id = null) {
  let param = { nombre: '', tipo: 'DEVENGADO', estado: 1 };
  if (id) {
    param = window.allConceptosNomina.find(p => p.id == id) || param;
  }

  const title = id ? 'Editar Concepto' : 'Nuevo Concepto';
  
  showModal(title, `
    <form id="form-concepto-nomina" onsubmit="guardarConceptoNomina(event, ${id || 'null'})" style="display:flex;flex-direction:column;gap:1rem">
      <div class="form-group">
        <label class="form-label" for="cn-nombre">NOMBRE DEL CONCEPTO</label>
        <input type="text" class="form-control" id="cn-nombre" required placeholder="Ej: Bonificación Especial" value="${param.nombre}">
      </div>
      <div class="form-group">
        <label class="form-label" for="cn-tipo">TIPO DE CONCEPTO</label>
        <select class="form-control" id="cn-tipo" required>
          <option value="DEVENGADO" ${param.tipo === 'DEVENGADO' ? 'selected' : ''}>Devengado (+)</option>
          <option value="DEDUCCION" ${param.tipo === 'DEDUCCION' ? 'selected' : ''}>Deducción (-)</option>
        </select>
      </div>
      <div class="remember-wrap" style="color:var(--white);margin-top:.5rem">
        <input type="checkbox" id="cn-estado" ${param.estado == 1 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--green-500)">
        <label for="cn-estado" style="cursor:pointer;font-size:.85rem">Concepto Activo</label>
      </div>
      <button type="submit" style="display:none;" id="btn-submit-cn-hidden"></button>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-cn-hidden').click()">Guardar</button>
  `);
}

async function guardarConceptoNomina(event, id) {
  event.preventDefault();
  
  const fd = new FormData();
  if (id) fd.append('id', id);
  fd.append('nombre', document.getElementById('cn-nombre').value);
  fd.append('tipo', document.getElementById('cn-tipo').value);
  fd.append('estado', document.getElementById('cn-estado').checked ? 1 : 0);

  try {
    const res = await API.contratacion.conceptosNomina.save(fd);
    if (res.success) {
      showToastAdmin(res.message);
      closeModal();
      renderConceptosNomina();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar.', 'error');
  }
}

async function eliminarConceptoNomina(id) {
  const result = await Swal.fire({
    title: '¿Eliminar concepto?',
    text: "El concepto ya no estará disponible para la nómina.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: 'var(--danger)',
    cancelButtonColor: 'var(--gray-600)',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    const fd = new FormData();
    fd.append('id', id);
    fd.append('action', 'delete');
    
    try {
      const res = await API.contratacion.conceptosNomina.save(fd);
      if (res.success) {
        showToastAdmin('Concepto eliminado.');
        renderConceptosNomina();
      } else {
        showToastAdmin(res.message, 'error');
      }
    } catch (err) {
      showToastAdmin('Error al eliminar.', 'error');
    }
  }
}
