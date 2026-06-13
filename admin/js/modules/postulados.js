// ================================================================
//  MÓDULO: POSTULADOS Y CONTRATACIÓN
// ================================================================

// ---- VISTA: POSTULADOS ----
async function renderPostulados() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">👤 Postulados</div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalPostulacion()">+ Nueva Postulación</button>
          <button class="btn btn-secondary btn-sm" onclick="exportPostulados()">📥 Exportar</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar por nombre o documento..." id="search-postulados" oninput="filterPostulados(this.value)">
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <select class="btn btn-secondary btn-sm" id="filter-estado" onchange="filterPostulados()">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aplica">Aplica</option>
              <option value="no_aplica">No aplica</option>
              <option value="seleccionado">Seleccionado</option>
            </select>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre completo</th>
                <th>Documento</th>
                <th>Especialidad</th>
                <th>Organización</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="postulados-tbody">
              <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
        <div class="table-pagination">
          <span id="postulados-count">Cargando...</span>
          <div class="pagination-btns" id="pagination-btns"></div>
        </div>
      </div>
    </div>
  `;

  await loadPostuladosData();
}

let allPostulados = [];

async function loadPostuladosData() {
  try {
    const res = await API.get('/postulados/list.php');
    if (res.success) {
      allPostulados = res.data;
      renderPostuladosTable(allPostulados);
    } else {
      document.getElementById('postulados-tbody').innerHTML =
        `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">${res.message}</div></div></td></tr>`;
    }
  } catch (e) {
    document.getElementById('postulados-tbody').innerHTML =
      `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Sin datos aún</div><div class="empty-desc">Aún no hay postulados registrados en el sistema.</div></div></td></tr>`;
  }
}

function renderPostuladosTable(data) {
  const tbody = document.getElementById('postulados-tbody');
  const count  = document.getElementById('postulados-count');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Sin resultados</div><div class="empty-desc">No se encontraron postulados con los filtros aplicados.</div></div></td></tr>`;
    if (count) count.textContent = '0 resultados';
    return;
  }

  const badgeMap = {
    pendiente: 'badge-pendiente', aplica: 'badge-aplica',
    no_aplica: 'badge-no_aplica', seleccionado: 'badge-seleccionado',
    contratado: 'badge-contratado',
  };

  tbody.innerHTML = data.map(p => `
    <tr>
      <td style="color:var(--gray-400);font-size:.75rem">${p.id}</td>
      <td><strong>${p.p_nombre} ${p.p_apellido}</strong><br><small style="color:var(--gray-400)">${p.email || ''}</small></td>
      <td>${p.tipo_doc} ${p.num_doc}</td>
      <td style="font-size:.8rem">${p.especialidad || '–'}</td>
      <td style="font-size:.8rem">${p.organizacion_nombre || '–'}</td>
      <td><span class="badge ${badgeMap[p.estado_evaluacion] || ''}">${p.estado_evaluacion}</span></td>
      <td style="font-size:.78rem;color:var(--gray-400)">${formatDate(p.created_at)}</td>
      <td>
        <div style="display:flex;gap:.375rem">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="verPostulado(${p.id})" title="Ver detalle">👁️</button>
          ${Auth.can('contratacion','evaluar') ? `<button class="btn btn-primary btn-icon btn-sm" onclick="evaluarPostulado(${p.id},'${p.estado_evaluacion}')" title="Evaluar">✏️</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  if (count) count.textContent = `${data.length} postulado${data.length !== 1 ? 's' : ''}`;
}

function filterPostulados(searchVal) {
  const search = (searchVal || document.getElementById('search-postulados')?.value || '').toLowerCase();
  const estado = document.getElementById('filter-estado')?.value || '';
  let filtered = allPostulados;
  if (search) filtered = filtered.filter(p =>
    `${p.p_nombre} ${p.p_apellido} ${p.num_doc} ${p.email || ''}`.toLowerCase().includes(search)
  );
  if (estado) filtered = filtered.filter(p => p.estado_evaluacion === estado);
  renderPostuladosTable(filtered);
}

async function verPostulado(id) {
  try {
    const res = await API.postulados.get(id);
    if (!res.success) {
      showToastAdmin(res.message, 'error');
      return;
    }
    
    const p = res.data;
    
    const badgeMap = {
      pendiente: 'badge-pendiente', aplica: 'badge-aplica',
      no_aplica: 'badge-no_aplica', seleccionado: 'badge-seleccionado',
      contratado: 'badge-contratado',
    };

    const docItems = p.documentos && p.documentos.length 
      ? p.documentos.map(d => {
          const docUrl = `/utcomexagro/${d.ruta_relativa}`;
          const sizeKb = d.tamano_bytes ? Math.round(d.tamano_bytes / 1024) + ' KB' : '–';
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:.5rem .75rem;margin-bottom:.5rem;">
              <div style="display:flex;align-items:center;gap:.5rem;">
                <span style="font-size:1.2rem">📄</span>
                <div>
                  <div style="font-size:.85rem;font-weight:600;color:var(--white)">${d.tipo_doc.toUpperCase()}</div>
                  <div style="font-size:.7rem;color:var(--gray-500)">${d.nombre_original} (${sizeKb})</div>
                </div>
              </div>
              <a href="${docUrl}" target="_blank" class="btn btn-secondary btn-sm" style="padding:.25rem .5rem;font-size:.75rem">Abrir ↗</a>
            </div>
          `;
        }).join('')
      : '<p style="color:var(--gray-500);font-size:.85rem">No se subieron documentos para este postulado.</p>';

    const bodyHtml = `
      <div style="display:grid;grid-template-columns:1fr;gap:1.5rem;max-height:500px;overflow-y:auto;padding-right:.5rem;text-align:left;">
        
        <!-- Header info -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:.75rem;">
          <div>
            <h3 style="color:var(--white);font-size:1.2rem;margin-bottom:.25rem;">${p.p_nombre} ${p.s_nombre || ''} ${p.p_apellido} ${p.s_apellido || ''}</h3>
            <span style="font-size:.85rem;color:var(--gray-400)">${p.tipo_doc} ${p.num_doc}</span>
          </div>
          <span class="badge ${badgeMap[p.estado_evaluacion] || ''}" style="font-size:.85rem">${p.estado_evaluacion.toUpperCase()}</span>
        </div>

        <!-- 2 Column Grid for details -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1.5rem;">
          
          <!-- Column 1: Info Personal y Ubicación -->
          <div>
            <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-left:3px solid var(--green-500);padding-left:.5rem;">Información Personal</h4>
            <div style="display:grid;gap:.5rem;font-size:.85rem;">
              <div><span style="color:var(--gray-500)">Email:</span> <span style="color:var(--white)">${p.email || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Teléfono:</span> <span style="color:var(--white)">${p.telefono || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Sexo:</span> <span style="color:var(--white)">${p.sexo || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Estado Civil:</span> <span style="color:var(--white)">${p.estado_civil || '–'}</span></div>
              <div><span style="color:var(--gray-500)">RH:</span> <span style="color:var(--white)">${p.rh || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Fecha Nacimiento:</span> <span style="color:var(--white)">${p.fecha_nacimiento ? formatDate(p.fecha_nacimiento) : '–'}</span></div>
              <div><span style="color:var(--gray-500)">Origen:</span> <span style="color:var(--white)">${p.pais_origen || 'Colombia'}</span></div>
              <div><span style="color:var(--gray-500)">Ubicación:</span> <span style="color:var(--white)">${p.municipio || '–'}, ${p.departamento || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Dirección:</span> <span style="color:var(--white)">${p.direccion || '–'}</span></div>
            </div>
          </div>

          <!-- Column 2: Aplicación y Dotación -->
          <div>
            <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-left:3px solid var(--green-500);padding-left:.5rem;">Postulación y Salud</h4>
            <div style="display:grid;gap:.5rem;font-size:.85rem;">
              <div><span style="color:var(--gray-500)">Organización:</span> <strong style="color:var(--white)">${p.organizacion_nombre || 'Ninguna'}</strong></div>
              <div><span style="color:var(--gray-500)">Especialidad:</span> <strong style="color:var(--white)">${p.especialidad || '–'}</strong></div>
              <div style="margin-top:.5rem;"><span style="color:var(--gray-500)">Talla Camisa:</span> <span style="color:var(--white)">${p.talla_camisa || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Talla Pantalón:</span> <span style="color:var(--white)">${p.talla_pantalon || '–'}</span></div>
              <div style="margin-top:.5rem;"><span style="color:var(--gray-500)">EPS:</span> <span style="color:var(--white)">${p.eps || '–'}</span></div>
              <div><span style="color:var(--gray-500)">AFP:</span> <span style="color:var(--white)">${p.afp || '–'}</span></div>
              <div><span style="color:var(--gray-500)">ARL:</span> <span style="color:var(--white)">${p.arl || '–'}</span></div>
              <div><span style="color:var(--gray-500)">Discapacidad:</span> <span style="color:var(--white)">${p.discapacidad || 'Ninguna'}</span></div>
            </div>
          </div>

        </div>

        <!-- Evaluation details if evaluated -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:1rem;">
          <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:.25rem;">Evaluación Interna</h4>
          <div style="display:grid;gap:.5rem;font-size:.85rem;">
            <div><span style="color:var(--gray-500)">Evaluado por:</span> <span style="color:var(--white)">${p.evaluador_nombre ? p.evaluador_nombre + ' ' + (p.evaluador_apellidos || '') : 'Sin evaluar'}</span></div>
            <div><span style="color:var(--gray-500)">Fecha evaluación:</span> <span style="color:var(--white)">${p.fecha_evaluacion ? formatDate(p.fecha_evaluacion) + ' ' + new Date(p.fecha_evaluacion).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'}) : '–'}</span></div>
            <div><span style="color:var(--gray-500)">Observaciones:</span> <p style="color:var(--white);margin-top:.25rem;font-style:italic;line-height:1.4;">"${p.observaciones_evaluacion || 'Sin observaciones.'}"</p></div>
          </div>
        </div>

        <!-- Documents section -->
        <div>
          <h4 style="color:var(--green-300);font-size:.85rem;text-transform:uppercase;margin-bottom:.75rem;border-left:3px solid var(--green-500);padding-left:.5rem;">Documentos Adjuntos</h4>
          ${docItems}
        </div>

      </div>
    `;

    showModal('Detalle del Postulado', bodyHtml);

  } catch (err) {
    showToastAdmin('Error al obtener los detalles del postulado.', 'error');
  }
}

async function evaluarPostulado(id, estadoActual) {
  const estados = ['pendiente','aplica','no_aplica','seleccionado'];
  const opcionesBtns = estados.map(e =>
    `<button class="btn ${e === estadoActual ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setEvaluacion(${id},'${e}')">${estadoIcons[e]} ${e}</button>`
  ).join('');

  showModal('Evaluar Postulado', `
    <p style="margin-bottom:1rem;color:var(--gray-500)">Seleccione el estado de evaluación:</p>
    <div style="display:flex;flex-wrap:wrap;gap:.5rem">${opcionesBtns}</div>
    <div class="form-group" style="margin-top:1rem">
      <label class="form-label">Observaciones</label>
      <textarea class="form-control" id="eval-obs" rows="3" placeholder="Notas adicionales..."></textarea>
    </div>
  `);
}

const estadoIcons = { pendiente:'⏳', aplica:'✅', no_aplica:'❌', seleccionado:'⭐' };

async function setEvaluacion(id, estado) {
  const obs = document.getElementById('eval-obs')?.value || '';
  const fd  = new FormData();
  fd.append('postulado_id', id);
  fd.append('estado', estado);
  fd.append('observaciones', obs);
  const res = await API.post('/contratacion/evaluar.php', fd);
  closeModal();
  if (res.success) { showToastAdmin('Evaluación guardada.'); loadPostuladosData(); }
  else showToastAdmin(res.message || 'Error al evaluar.', 'error');
}

function exportPostulados() {
  alert('Exportación a Excel – Próximamente disponible.');
}

// ---- VISTA: CONTRATACIÓN ----
function renderContratacion() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-title" style="margin-bottom:1.5rem">📋 Contratación</div>
      <div class="modules-grid">
        <div class="module-card" onclick="window.location.hash='postulados'">
          <div class="module-card-header">
            <div class="module-icon icon-people">✅</div>
            <div><div class="module-name">Evaluación de Postulados</div></div>
          </div>
          <div class="module-desc">Revisar y marcar postulados como Aplica / No Aplica / Seleccionado.</div>
          <div class="module-card-footer"><span class="module-link">Ir a Postulados <span class="module-link-arrow">›</span></span></div>
        </div>
        <div class="module-card" onclick="alert('Próximamente')">
          <div class="module-card-header">
            <div class="module-icon icon-contract">📄</div>
            <div><div class="module-name">Generación de Contratos</div><span class="badge badge-dev">En desarrollo</span></div>
          </div>
          <div class="module-desc">Generar contratos automáticos en PDF a partir de minutas predefinidas.</div>
          <div class="module-card-footer"><span class="module-link">Próximamente <span class="module-link-arrow">›</span></span></div>
        </div>
        <div class="module-card" onclick="alert('Próximamente')">
          <div class="module-card-header">
            <div class="module-icon icon-budget">💵</div>
            <div><div class="module-name">Nómina</div><span class="badge badge-dev">En desarrollo</span></div>
          </div>
          <div class="module-desc">Gestión de períodos de nómina, liquidaciones y desprendibles.</div>
          <div class="module-card-footer"><span class="module-link">Próximamente <span class="module-link-arrow">›</span></span></div>
        </div>
      </div>
    </div>
  `;
}

// ---- MODAL NUEVA POSTULACIÓN ----
function abrirModalPostulacion() {
  const modalHtml = `<div id="form-admin-postulacion-container"></div>`;
  // Usamos el isLarge=true para modal amplio
  showModal('Nueva Postulación', modalHtml, '<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>', true);
  
  setTimeout(() => {
    if (typeof FormPostulacion !== 'undefined') {
      FormPostulacion.setApiPath('/utcomexagro/api');
      FormPostulacion.init('form-admin-postulacion-container', 'admin');
    } else {
      console.error('FormPostulacion component not loaded.');
      showToastAdmin('Error al cargar el formulario.', 'error');
    }
  }, 100);
}
