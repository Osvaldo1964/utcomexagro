// ================================================================
//  MÓDULO: MOVIMIENTOS PRESUPUESTALES
//  admin/js/modules/presupuesto_movimientos.js
// ================================================================

async function renderPresupuestoMovimientos() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Financiero', key: 'presupuesto' },
    { label: 'Ejecución y Movimientos', key: 'presupuesto_movimientos' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  try {
    const [resMovs, resTree, resTerceros] = await Promise.all([
      API.get('/presupuesto/movimientos_list.php'),
      API.get('/presupuesto/tree.php'),
      API.get('/terceros/list.php')
    ]);

    window.movimientos = resMovs.success ? resMovs.data : [];
    window.treeData = resTree.success ? resTree.data : [];
    window.tercerosList = resTerceros.success ? resTerceros.data : [];

    // Extraer solo Nivel 4 del árbol para el select
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
          <div class="module-page-title">💸 Ejecución y Movimientos</div>
          <div class="module-page-actions">
            <button class="btn btn-primary" onclick="abrirModalMovimiento()">+ Registrar Movimiento</button>
          </div>
        </div>

        <div class="table-card" style="animation: fadeIn .3s ease">
          <div class="table-toolbar">
            <div class="table-search">
              <span>🔍</span>
              <input type="text" id="search-mov" placeholder="Buscar por comprobante, detalle o tercero..." onkeyup="filterMovimientos()">
            </div>
            <div class="table-filters" style="display:flex; gap:.5rem;">
              <select id="filter-tipo" class="form-control" onchange="filterMovimientos()">
                <option value="">Todos los Tipos</option>
                <option value="Egreso">Solo Egresos</option>
                <option value="Ingreso">Solo Ingresos</option>
              </select>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Comprobante</th>
                <th>Rubro Afectado</th>
                <th>Tercero</th>
                <th style="text-align:right">Valor ($)</th>
                <th>Soporte</th>
                <th style="text-align:right">Acciones</th>
              </tr>
            </thead>
            <tbody id="tb-movimientos"></tbody>
          </table>
        </div>
      </div>
    `;
    renderMovimientosTable(window.movimientos);
  } catch (err) {
    showToastAdmin('Error al cargar movimientos', 'error');
  }
}

function renderMovimientosTable(data) {
  const tbody = document.getElementById('tb-movimientos');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray-400)">No hay movimientos registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(m => {
    const isEgreso = m.tipo === 'Egreso';
    const colorTipo = isEgreso ? 'color:var(--red-600); background:#fef2f2' : 'color:var(--green-600); background:#f0fdf4';
    const fmtValor = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m.valor);
    const signo = isEgreso ? '-' : '+';
    
    let soporteHtml = '-';
    if (m.soporte_pdf) {
      soporteHtml = `<a href="../${m.soporte_pdf}" target="_blank" class="badge" style="background:#e0f2fe; color:#0369a1; text-decoration:none">📄 Ver PDF</a>`;
    }

    return `
      <tr>
        <td style="color:var(--gray-500)">${m.fecha}</td>
        <td><span class="badge" style="${colorTipo}">${m.tipo}</span></td>
        <td style="font-family:monospace; font-weight:bold; color:var(--gray-700)">${m.comprobante || '-'}</td>
        <td style="font-size:0.85rem">
          <div style="font-weight:bold; color:var(--gray-800)">${m.rubro_codigo}</div>
          <div style="color:var(--gray-500)">${m.rubro_nombre}</div>
        </td>
        <td style="font-size:0.85rem">
          <div style="font-weight:bold; color:var(--gray-800)">${m.tercero_documento}</div>
          <div style="color:var(--gray-500)">${m.tercero_nombre}</div>
        </td>
        <td style="text-align:right; font-weight:600; ${isEgreso?'color:var(--red-600)':'color:var(--green-600)'}">${signo} ${fmtValor}</td>
        <td>${soporteHtml}</td>
        <td style="text-align:right">
          <div style="display:flex; gap:.25rem; justify-content:flex-end">
            <button class="btn-icon" onclick="eliminarMovimiento(${m.id})" title="Revertir y Eliminar" style="color:var(--red-600)">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterMovimientos() {
  const q = (document.getElementById('search-mov')?.value || '').toLowerCase();
  const tipo = document.getElementById('filter-tipo')?.value || '';
  
  const filtered = window.movimientos.filter(m => {
    const matchesQuery = 
      (m.comprobante || '').toLowerCase().includes(q) || 
      (m.detalle || '').toLowerCase().includes(q) || 
      (m.tercero_nombre || '').toLowerCase().includes(q) ||
      (m.tercero_documento || '').toLowerCase().includes(q);
    const matchesTipo = tipo === '' || m.tipo === tipo;
    return matchesQuery && matchesTipo;
  });
  
  renderMovimientosTable(filtered);
}

window.abrirModalMovimiento = function() {
  const rubrosOpts = window.rubrosHoja.map(r => `<option value="${r.id}">${r.codigo} - ${r.nombre} (Disp: $${r.valor_total - r.valor_ejecutado})</option>`).join('');
  const tercerosOpts = window.tercerosList.map(t => `<option value="${t.id}">${t.numero_documento} - ${t.nombre_razon_social}</option>`).join('');

  const today = new Date().toISOString().split('T')[0];

  const html = `
    <form id="form-movimiento" onsubmit="guardarMovimiento(event)">
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Fecha de Movimiento</label>
          <input type="date" class="form-control" id="m-fecha" value="${today}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Operación</label>
          <select class="form-control" id="m-tipo" required>
            <option value="Egreso">Egreso (Salida/Gasto)</option>
            <option value="Ingreso">Ingreso (Reintegro/Abono)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Rubro Afectado (Solo Nivel 4)</label>
        <select class="form-control" id="m-rubro" required>
          <option value="">-- Seleccione un rubro --</option>
          ${rubrosOpts}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Tercero (Proveedor/Cliente)</label>
        <select class="form-control" id="m-tercero" required>
          <option value="">-- Seleccione un tercero --</option>
          ${tercerosOpts}
        </select>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Factura / Cuenta Cobro (Opcional)</label>
          <input type="text" class="form-control" id="m-comprobante" placeholder="Ej: FV-1020">
        </div>
        <div class="form-group">
          <label class="form-label">Valor del Movimiento ($)</label>
          <input type="number" step="0.01" class="form-control" id="m-valor" required min="1">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Detalle u Observación</label>
        <textarea class="form-control" id="m-detalle" rows="2" required></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Soporte PDF (Opcional)</label>
        <input type="file" class="form-control" id="m-soporte" accept=".pdf">
      </div>

      <button type="submit" style="display:none;" id="btn-submit-mov-hidden"></button>
    </form>
  `;

  showModal('Registrar Ejecución Presupuestal', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-mov-hidden').click()">Guardar y Ejecutar</button>
  `, true);
};

window.guardarMovimiento = async function(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append('fecha', document.getElementById('m-fecha').value);
  formData.append('tipo', document.getElementById('m-tipo').value);
  formData.append('rubro_id', document.getElementById('m-rubro').value);
  formData.append('tercero_id', document.getElementById('m-tercero').value);
  formData.append('comprobante', document.getElementById('m-comprobante').value.trim());
  formData.append('valor', document.getElementById('m-valor').value);
  formData.append('detalle', document.getElementById('m-detalle').value.trim());

  const fileInput = document.getElementById('m-soporte');
  if (fileInput.files.length > 0) {
    formData.append('soporte', fileInput.files[0]);
  }

  try {
    const token = Auth.getToken();
    const response = await fetch('../api/presupuesto/movimientos_save.php', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      body: formData
    });
    
    const res = await response.json();
    if (res.success) {
      showToastAdmin(res.message, 'success');
      closeModal();
      renderPresupuestoMovimientos();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error en el servidor al enviar archivo', 'error');
  }
};

window.eliminarMovimiento = async function(id) {
  Swal.fire({
    title: '¿Revertir movimiento?',
    text: "Se eliminará este movimiento y se recalculará el presupuesto.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, revertir',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await API.post('/presupuesto/movimientos_delete.php', { id });
        if (res.success) {
          showToastAdmin(res.message, 'success');
          renderPresupuestoMovimientos();
        } else {
          showToastAdmin(res.message, 'error');
        }
      } catch (err) {
        showToastAdmin('Error al eliminar', 'error');
      }
    }
  });
}
