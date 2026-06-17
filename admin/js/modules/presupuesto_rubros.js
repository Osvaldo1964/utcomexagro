// ================================================================
//  MÓDULO: PRESUPUESTO JERÁRQUICO
//  admin/js/modules/presupuesto_rubros.js
// ================================================================

async function renderPresupuestoRubros() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Financiero', key: 'presupuesto' },
    { label: 'Planeación Presupuestal', key: 'presupuesto_rubros' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  try {
    const [resTree, resOrgs] = await Promise.all([
      API.get('/presupuesto/tree.php'),
      API.get('/organizaciones/list.php')
    ]);

    window.presupuestoTree = resTree.success ? resTree.data : [];
    window.organizacionesList = resOrgs.success ? resOrgs.data : [];

    content.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">🧮 Planeación Presupuestal</div>
          <div class="module-page-actions">
            <button class="btn btn-primary" onclick="abrirModalRubro(null, 1)">+ Nuevo Rubro Principal</button>
          </div>
        </div>

        <div class="table-card" style="animation: fadeIn .3s ease">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40%">Código / Nombre</th>
                <th>Nivel</th>
                <th style="text-align:right">Valor Asignado</th>
                <th style="text-align:right">Valor Ejecutado</th>
                <th>Organización</th>
                <th style="text-align:right">Acciones</th>
              </tr>
            </thead>
            <tbody id="tb-rubros"></tbody>
          </table>
        </div>
      </div>
    `;
    renderTreeTable(window.presupuestoTree);
  } catch (err) {
    showToastAdmin('Error al cargar presupuesto', 'error');
  }
}

function renderTreeTable(treeData) {
  const tbody = document.getElementById('tb-rubros');
  if (!tbody) return;

  if (treeData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">No hay rubros registrados. Crea el primer nivel.</td></tr>';
    return;
  }

  let html = '';
  const renderNode = (node, depth) => {
    const padding = depth * 2; // 2rem por nivel
    const isLeaf = node.nivel == 4;
    
    // Formatear moneda
    const fmtTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(node.valor_total || 0);
    const fmtEjec = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(node.valor_ejecutado || 0);

    // Color según nivel
    const colors = ['#1e293b', '#334155', '#475569', '#64748b'];
    const fontColor = colors[node.nivel - 1] || '#1e293b';
    const fontWeight = node.nivel < 4 ? '600' : '400';

    html += `
      <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${node.nivel===1 ? '#f8fafc' : 'white'}">
        <td style="padding-left: ${1 + padding}rem; font-weight: ${fontWeight}; color: ${fontColor};">
          <span style="display:inline-block; width: 60px; font-family: monospace; color:var(--primary)">${node.codigo}</span> 
          ${isLeaf ? '📄' : '📁'} ${node.nombre}
        </td>
        <td><span class="badge" style="background:#e2e8f0; color:#475569">Nivel ${node.nivel}</span></td>
        <td style="text-align:right; font-weight:500">${fmtTotal}</td>
        <td style="text-align:right">${fmtEjec}</td>
        <td style="font-size:0.85rem; color:var(--gray-500)">${node.organizacion_nombre || '-'}</td>
        <td style="text-align:right">
          <div style="display:flex; gap:.25rem; justify-content:flex-end">
            ${node.nivel < 4 ? `<button class="btn-icon" onclick="abrirModalRubro(${node.id}, ${parseInt(node.nivel) + 1})" title="Agregar Sub-rubro" style="color:var(--green-600)">➕</button>` : ''}
            <button class="btn-icon" onclick="abrirModalRubroEdit(${node.id})" title="Editar">✏️</button>
            <button class="btn-icon" onclick="eliminarRubro(${node.id})" title="Eliminar" style="color:var(--red-600)">🗑️</button>
          </div>
        </td>
      </tr>
    `;

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => renderNode(child, depth + 1));
    }
  };

  treeData.forEach(root => renderNode(root, 0));
  tbody.innerHTML = html;
}

// Find node recursive
function findNode(tree, id) {
  for (let n of tree) {
    if (n.id == id) return n;
    if (n.children) {
      let found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

window.abrirModalRubro = function(parentId, targetNivel) {
  const isLeaf = targetNivel === 4;
  
  const orgsOpts = window.organizacionesList.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('');

  const html = `
    <form id="form-rubro" onsubmit="guardarRubro(event)">
      <input type="hidden" id="r-parent" value="${parentId || ''}">
      
      <div class="form-group">
        <label class="form-label" for="r-nombre">Nombre del Rubro (Nivel ${targetNivel})</label>
        <input type="text" class="form-control" id="r-nombre" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="r-desc">Descripción (Opcional)</label>
        <textarea class="form-control" id="r-desc" rows="2"></textarea>
      </div>

      ${isLeaf ? `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label" for="r-valor">Valor Asignado ($)</label>
            <input type="number" step="0.01" class="form-control" id="r-valor" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="r-org">Organización Ejecutora (Opcional)</label>
            <select class="form-control" id="r-org">
              <option value="">-- Ninguna --</option>
              ${orgsOpts}
            </select>
          </div>
        </div>
      ` : `
        <div style="padding:1rem; background:#f0f9ff; color:#0369a1; border-radius:4px; font-size:0.9rem;">
          ℹ️ Los rubros de Nivel ${targetNivel} son agrupadores. Su valor se calculará automáticamente con la suma de sus rubros hijos.
        </div>
      `}

      <button type="submit" style="display:none;" id="btn-submit-rubro-hidden"></button>
    </form>
  `;

  showModal(`Agregar Rubro Nivel ${targetNivel}`, html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-rubro-hidden').click()">Guardar</button>
  `, false);
}

window.abrirModalRubroEdit = function(id) {
  const node = findNode(window.presupuestoTree, id);
  if (!node) return;

  const isLeaf = node.nivel == 4;
  const orgsOpts = window.organizacionesList.map(o => `<option value="${o.id}" ${node.organizacion_id==o.id?'selected':''}>${o.nombre}</option>`).join('');

  const html = `
    <form id="form-rubro" onsubmit="guardarRubro(event, ${id})">
      
      <div class="form-group">
        <label class="form-label" for="r-nombre">Nombre del Rubro</label>
        <input type="text" class="form-control" id="r-nombre" value="${node.nombre}" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="r-desc">Descripción (Opcional)</label>
        <textarea class="form-control" id="r-desc" rows="2">${node.descripcion || ''}</textarea>
      </div>

      ${isLeaf ? `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label" for="r-valor">Valor Asignado ($)</label>
            <input type="number" step="0.01" class="form-control" id="r-valor" value="${node.valor_total}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="r-org">Organización Ejecutora (Opcional)</label>
            <select class="form-control" id="r-org">
              <option value="">-- Ninguna --</option>
              ${orgsOpts}
            </select>
          </div>
        </div>
      ` : `
        <div style="padding:1rem; background:#f0f9ff; color:#0369a1; border-radius:4px; font-size:0.9rem;">
          ℹ️ Los rubros de Nivel ${node.nivel} son agrupadores. Su valor es calculado automáticamente.
        </div>
      `}

      <button type="submit" style="display:none;" id="btn-submit-rubro-hidden"></button>
    </form>
  `;

  showModal(`Editar Rubro: ${node.codigo}`, html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-rubro-hidden').click()">Guardar Cambios</button>
  `, false);
}

window.guardarRubro = async function(event, editId = null) {
  event.preventDefault();

  const payload = {
    nombre: document.getElementById('r-nombre').value.trim(),
    descripcion: document.getElementById('r-desc').value.trim(),
    activo: 1
  };

  if (editId) {
    payload.id = editId;
    const isLeaf = document.getElementById('r-valor') != null;
    if (isLeaf) {
      payload.valor_total = document.getElementById('r-valor').value;
      payload.organizacion_id = document.getElementById('r-org').value || null;
    }
  } else {
    const parentId = document.getElementById('r-parent').value;
    if (parentId) payload.parent_id = parentId;
    
    const isLeaf = document.getElementById('r-valor') != null;
    if (isLeaf) {
      payload.valor_total = document.getElementById('r-valor').value;
      payload.organizacion_id = document.getElementById('r-org').value || null;
    }
  }

  try {
    const res = await API.post('/presupuesto/save_rubro.php', payload);
    if (res.success) {
      showToastAdmin(res.message, 'success');
      closeModal();
      renderPresupuestoRubros();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error en el servidor', 'error');
  }
}

window.eliminarRubro = async function(id) {
  Swal.fire({
    title: '¿Eliminar rubro?',
    text: "Se eliminará el rubro y toda su descendencia si es un agrupador.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await API.post('/presupuesto/delete_rubro.php', { id });
        if (res.success) {
          showToastAdmin(res.message, 'success');
          renderPresupuestoRubros();
        } else {
          showToastAdmin(res.message, 'error');
        }
      } catch(e) {
        showToastAdmin('Error al eliminar', 'error');
      }
    }
  });
};
