// ================================================================
//  MÓDULO: PQRS
//  admin/js/modules/pqrs.js
// ================================================================

async function renderPqrs() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'PQRS', key: 'pqrs' }
  ]);

  showSkeletonLoader();

  try {
    const res = await API.get('/pqrs/list.php');
    window.allPqrs = res.success ? res.data : [];
    
    content.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">🗣️ Control y Seguimiento PQRS</div>
          <div class="module-page-actions">
            <!-- PQRS enter the system from the public site, admins mostly respond -->
          </div>
        </div>

        <div class="table-card" style="animation: fadeIn .3s ease">
          <div class="table-toolbar">
            <div class="table-search">
              <span>🔍</span>
              <input type="text" id="search-pqrs" placeholder="Buscar por radicado, nombre o documento..." onkeyup="filterPqrs()">
            </div>
            <div class="table-filters" style="display:flex; gap:.5rem;">
              <select id="filter-estado" class="form-control" onchange="filterPqrs()">
                <option value="">Todos los Estados</option>
                <option value="recibido">Recibido</option>
                <option value="en_proceso">En Proceso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Radicado</th>
                <th>Fecha Ingreso</th>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tb-pqrs"></tbody>
          </table>
          <div class="table-pagination" id="pag-pqrs"></div>
        </div>
      </div>
    `;
    renderPqrsTable(window.allPqrs);
  } catch (err) {
    showToastAdmin('Error al cargar PQRS', 'error');
  }
}

function renderPqrsTable(data) {
  const tbody = document.getElementById('tb-pqrs');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">No hay PQRS registradas que coincidan.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(p => {
    let badgeClass = 'badge-active'; // received
    let estadoText = 'Recibido';
    
    switch(p.estado) {
      case 'recibido':   badgeClass = 'badge-dev'; estadoText = 'Recibido'; break;
      case 'en_proceso': badgeClass = 'badge-pendiente'; estadoText = 'En Proceso'; break;
      case 'resuelto':   badgeClass = 'badge-contratado'; estadoText = 'Resuelto'; break;
      case 'cerrado':    badgeClass = 'badge-no_aplica'; estadoText = 'Cerrado'; break;
    }

    return `
      <tr>
        <td style="font-weight:600;color:var(--gray-900)">${p.radicado}</td>
        <td>${formatDate(p.created_at)}</td>
        <td>${p.tipo}</td>
        <td>${p.nombre}</td>
        <td><span class="badge ${badgeClass}">${estadoText}</span></td>
        <td>
          <div style="display:flex;gap:.375rem">
            <button class="btn btn-primary btn-sm" onclick="abrirModalPqr(${p.id})" title="Ver y Gestionar">Ver / Responder</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterPqrs() {
  const q = (document.getElementById('search-pqrs')?.value || '').toLowerCase();
  const st = document.getElementById('filter-estado')?.value || '';
  
  const filtered = window.allPqrs.filter(p => {
    const matchesQuery = p.radicado.toLowerCase().includes(q) || 
                         p.nombre.toLowerCase().includes(q) || 
                         (p.documento && p.documento.toLowerCase().includes(q));
    const matchesState = st === '' || p.estado === st;
    return matchesQuery && matchesState;
  });
  
  renderPqrsTable(filtered);
}

function abrirModalPqr(id) {
  const pqr = window.allPqrs.find(x => x.id === id);
  if (!pqr) return;

  const adjuntoHtml = pqr.adjunto 
    ? `<div style="margin-top:1rem; padding:1rem; background:var(--gray-50); border:1px solid var(--gray-200); border-radius:6px; display:flex; align-items:center; gap:.5rem;">
         <span>📎</span> 
         <a href="../uploads/pqrs/${pqr.adjunto}" target="_blank" style="color:var(--green-700); font-weight:500;">Ver Archivo Adjunto</a>
       </div>` 
    : `<p style="color:var(--gray-500); font-size:0.9rem; margin-top:1rem;">No hay archivos adjuntos.</p>`;

  const html = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; text-align:left;">
      
      <!-- Lado Izquierdo: Información del PQR -->
      <div>
        <h4 style="margin-top:0; color:var(--gray-800); border-bottom:1px solid var(--gray-200); padding-bottom:.5rem;">Detalles del PQR</h4>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
          <div>
            <span style="font-size:0.8rem; color:var(--gray-500); display:block;">Radicado</span>
            <strong>${pqr.radicado}</strong>
          </div>
          <div>
            <span style="font-size:0.8rem; color:var(--gray-500); display:block;">Tipo</span>
            <strong>${pqr.tipo}</strong>
          </div>
          <div>
            <span style="font-size:0.8rem; color:var(--gray-500); display:block;">Nombre</span>
            <span>${pqr.nombre}</span>
          </div>
          <div>
            <span style="font-size:0.8rem; color:var(--gray-500); display:block;">Documento</span>
            <span>${pqr.documento || 'No provisto'}</span>
          </div>
          <div>
            <span style="font-size:0.8rem; color:var(--gray-500); display:block;">Email</span>
            <span>${pqr.email || 'No provisto'}</span>
          </div>
          <div>
            <span style="font-size:0.8rem; color:var(--gray-500); display:block;">Teléfono</span>
            <span>${pqr.telefono || 'No provisto'}</span>
          </div>
        </div>

        <div style="margin-top:1.5rem;">
          <span style="font-size:0.8rem; color:var(--gray-500); display:block; margin-bottom:.25rem;">Descripción</span>
          <div style="background:var(--gray-100); padding:1rem; border-radius:6px; max-height:200px; overflow-y:auto; font-size:0.95rem;">
            ${pqr.descripcion.replace(/\n/g, '<br>')}
          </div>
        </div>

        ${adjuntoHtml}
      </div>

      <!-- Lado Derecho: Gestión y Respuesta -->
      <form id="form-pqr-respuesta" onsubmit="guardarPqrRespuesta(event, ${pqr.id})">
        <h4 style="margin-top:0; color:var(--green-700); border-bottom:1px solid var(--gray-200); padding-bottom:.5rem;">Gestión y Respuesta</h4>
        
        <div class="form-group">
          <label class="form-label" for="pqr-estado">Estado del Trámite</label>
          <select class="form-control" id="pqr-estado" required>
            <option value="recibido" ${pqr.estado==='recibido'?'selected':''}>Recibido</option>
            <option value="en_proceso" ${pqr.estado==='en_proceso'?'selected':''}>En Proceso</option>
            <option value="resuelto" ${pqr.estado==='resuelto'?'selected':''}>Resuelto</option>
            <option value="cerrado" ${pqr.estado==='cerrado'?'selected':''}>Cerrado</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="pqr-respuesta">Mensaje de Respuesta / Notas Internas</label>
          <textarea class="form-control" id="pqr-respuesta" rows="6" placeholder="Escriba la respuesta al ciudadano o sus notas de gestión...">${pqr.respuesta || ''}</textarea>
        </div>

        ${pqr.email ? `
        <div style="background:#e0f2fe; padding:1rem; border-radius:6px; border:1px solid #bae6fd; margin-bottom:1rem; display:flex; gap:1rem; align-items:flex-start;">
          <input type="checkbox" id="pqr-enviar-correo" style="width:18px; height:18px; margin-top:2px;" checked>
          <label for="pqr-enviar-correo" style="cursor:pointer; font-size:0.95rem; color:#0284c7; font-weight:500;">
            Enviar actualización por correo electrónico al usuario (${pqr.email}). Se enviará el mensaje escrito arriba.
          </label>
        </div>
        ` : `
        <div style="background:var(--gray-100); padding:1rem; border-radius:6px; margin-bottom:1rem; font-size:0.9rem; color:var(--gray-500);">
          El usuario no dejó correo electrónico, por lo que las notas se guardarán solo como registro interno.
        </div>
        `}

        <button type="submit" style="display:none;" id="btn-submit-pqr-hidden"></button>
      </form>
    </div>
  `;

  showModal(`Radicado: ${pqr.radicado}`, html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-pqr-hidden').click()">Guardar Gestión</button>
  `, true, true);
}

async function guardarPqrRespuesta(event, id) {
  event.preventDefault();

  const estado = document.getElementById('pqr-estado').value;
  const respuesta = document.getElementById('pqr-respuesta').value.trim();
  const checkboxEmail = document.getElementById('pqr-enviar-correo');
  const enviar_correo = checkboxEmail ? checkboxEmail.checked : false;

  const payload = {
    id,
    estado,
    respuesta,
    enviar_correo
  };

  try {
    const res = await API.post('/pqrs/responder.php', payload);
    if (res.success) {
      let msg = res.message;
      if (enviar_correo) {
        if (res.data && res.data.email_enviado) {
          msg += ' El correo fue enviado exitosamente.';
        } else {
          msg += ' Sin embargo, falló el envío del correo.';
          console.error(res.data ? res.data.email_error : 'Error desconocido');
        }
      }
      showToastAdmin(msg, (res.data && res.data.email_enviado === false) && enviar_correo ? 'warning' : 'success');
      closeModal();
      renderPqrs(); // recargar tabla
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al actualizar PQR', 'error');
  }
}
