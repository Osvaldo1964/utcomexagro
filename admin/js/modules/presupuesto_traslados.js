// ================================================================
//  MÓDULO: TRASLADOS PRESUPUESTALES
//  admin/js/modules/presupuesto_traslados.js
// ================================================================

async function renderPresupuestoTraslados() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Financiero', key: 'presupuesto' },
    { label: 'Traslados', key: 'presupuesto_traslados' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  try {
    const [resTree, resList] = await Promise.all([
      API.get('/presupuesto/tree.php'),
      API.get('/presupuesto/traslados_list.php')
    ]);
    
    window.treeData = resTree.success ? resTree.data : [];
    window.trasladosList = resList.success ? resList.data : [];

    // Extraer solo Nivel 4 del árbol para los selects
    window.rubrosHoja = [];
    const extractLeaves = (nodes) => {
      nodes.forEach(n => {
        if (n.nivel == 4) window.rubrosHoja.push(n);
        if (n.children && n.children.length > 0) extractLeaves(n.children);
      });
    };
    extractLeaves(window.treeData);

    content.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">🔁 Traslados Presupuestales</div>
          <div class="module-page-actions">
            <button class="btn btn-primary" onclick="abrirModalTraslado()">+ Registrar Traslado</button>
          </div>
        </div>

        <div class="table-card" style="animation: fadeIn .3s ease">
          <div class="table-toolbar">
            <div class="table-search">
              <span>🔍</span>
              <input type="text" id="search-traslado" placeholder="Buscar por comprobante, rubro o detalle..." onkeyup="filterTraslados()">
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Comprobante</th>
                <th>Rubro Origen (Cede)</th>
                <th>Rubro Destino (Recibe)</th>
                <th>Motivo / Detalle</th>
                <th style="text-align:right">Valor ($)</th>
                <th style="text-align:right">Acciones</th>
              </tr>
            </thead>
            <tbody id="tb-traslados"></tbody>
          </table>
        </div>
      </div>
    `;

    renderTrasladosTable(window.trasladosList);

  } catch (err) {
    showToastAdmin('Error al cargar datos del presupuesto', 'error');
  }
}

function renderTrasladosTable(data) {
  const tbody = document.getElementById('tb-traslados');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-400)">No hay traslados registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(t => {
    const fmtValor = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(t.valor);
    
    return `
      <tr>
        <td style="color:var(--gray-500)">${t.fecha}</td>
        <td style="font-family:monospace; font-weight:bold; color:var(--blue-700)">${t.comprobante}</td>
        <td style="color:var(--red-700); font-size:0.85rem">🔴 ${t.origen || 'No definido'}</td>
        <td style="color:var(--green-700); font-size:0.85rem">🟢 ${t.destino || 'No definido'}</td>
        <td style="font-size:0.9rem">${t.detalle}</td>
        <td style="text-align:right; font-weight:bold;">${fmtValor}</td>
        <td style="text-align:right">
          <button class="btn-icon" onclick="eliminarTraslado(${t.id_principal})" title="Revertir Traslado" style="color:var(--red-600)">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTraslados() {
  const q = (document.getElementById('search-traslado')?.value || '').toLowerCase();
  const filtered = window.trasladosList.filter(t => {
    return (t.comprobante || '').toLowerCase().includes(q) || 
           (t.detalle || '').toLowerCase().includes(q) || 
           (t.origen || '').toLowerCase().includes(q) ||
           (t.destino || '').toLowerCase().includes(q);
  });
  renderTrasladosTable(filtered);
}

window.abrirModalTraslado = function() {
  const rubrosOpts = window.rubrosHoja.map(r => {
    const disp = r.valor_total - r.valor_ejecutado;
    const fmtDisp = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits:0 }).format(disp);
    return `<option value="${r.id}">${r.codigo} - ${r.nombre} (Disp: ${fmtDisp})</option>`;
  }).join('');

  const today = new Date().toISOString().split('T')[0];

  const html = `
    <form id="form-traslado" onsubmit="guardarTraslado(event)">
      
      <div style="background: #e0f2fe; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; color: #0369a1; font-size: 0.9rem;">
        Un traslado mueve disponibilidad presupuestal entre rubros, inyectando dos movimientos compensatorios sin alterar el Presupuesto Inicial aprobado.
      </div>

      <div class="form-group">
        <label class="form-label">Fecha del Traslado</label>
        <input type="date" class="form-control" id="t-fecha" value="${today}" required>
      </div>

      <div class="form-group" style="background: #fef2f2; padding: 1rem; border-radius: 6px; border: 1px solid #fecaca;">
        <label class="form-label" style="color: var(--red-700)">🔴 Rubro Origen (Cede dinero)</label>
        <select class="form-control" id="t-origen" required style="border-color: #fca5a5;">
          <option value="">-- Seleccione rubro origen --</option>
          ${rubrosOpts}
        </select>
      </div>

      <div class="form-group" style="background: #f0fdf4; padding: 1rem; border-radius: 6px; border: 1px solid #bbf7d0;">
        <label class="form-label" style="color: var(--green-700)">🟢 Rubro Destino (Recibe dinero)</label>
        <select class="form-control" id="t-destino" required style="border-color: #86efac;">
          <option value="">-- Seleccione rubro destino --</option>
          ${rubrosOpts}
        </select>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 2fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Valor a Trasladar ($)</label>
          <input type="number" step="0.01" min="1" class="form-control" id="t-valor" required style="font-weight: bold; color: var(--blue-700);">
        </div>
        <div class="form-group">
          <label class="form-label">Motivo del Traslado</label>
          <input type="text" class="form-control" id="t-detalle" placeholder="Ej: Cubrir déficit..." required>
        </div>
      </div>

      <button type="submit" id="btn-submit-traslado-hidden" style="display:none"></button>
    </form>
  `;

  showModal('🔁 Nuevo Traslado', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-traslado-hidden').click()">Ejecutar Traslado</button>
  `, true);
};

window.guardarTraslado = async function(event) {
  event.preventDefault();

  const data = {
    fecha: document.getElementById('t-fecha').value,
    origen_id: document.getElementById('t-origen').value,
    destino_id: document.getElementById('t-destino').value,
    valor: document.getElementById('t-valor').value,
    detalle: document.getElementById('t-detalle').value.trim()
  };

  if (data.origen_id === data.destino_id) {
    showToastAdmin('El rubro origen y destino no pueden ser el mismo.', 'error');
    return;
  }

  Swal.fire({
    title: '¿Confirmar Traslado?',
    text: `Se trasladarán $${new Intl.NumberFormat('es-CO').format(data.valor)} del origen al destino.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#166534',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, ejecutar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await API.post('/presupuesto/traslados_save.php', data);
        if (res.success) {
          showToastAdmin(res.message, 'success');
          closeModal();
          renderPresupuestoTraslados(); 
        } else {
          Swal.fire('Error', res.message, 'error');
        }
      } catch (err) {
        showToastAdmin('Error al procesar traslado', 'error');
      }
    }
  });
};

window.eliminarTraslado = async function(id) {
  Swal.fire({
    title: '¿Revertir Traslado?',
    text: "Se eliminará este traslado (restando al destino y devolviendo al origen) y se recalculará el presupuesto.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, revertir',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Usamos el mismo endpoint de movimientos, pues internamente maneja si es traslado por el comprobante
        const res = await API.post('/presupuesto/movimientos_delete.php', { id });
        if (res.success) {
          showToastAdmin(res.message, 'success');
          renderPresupuestoTraslados();
        } else {
          showToastAdmin(res.message, 'error');
        }
      } catch (err) {
        showToastAdmin('Error al eliminar', 'error');
      }
    }
  });
}
