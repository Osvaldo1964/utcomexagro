// ================================================================
//  MÓDULO: CAPACITACIONES (Charlas y Jitsi Meet Embed)
// ================================================================

let jitsiApi = null;

async function renderCapacitaciones() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Capacitaciones' }
  ]);
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div>
          <div class="module-page-title">🎓 Capacitaciones y Charlas</div>
          <p style="color:var(--gray-400);font-size:0.85rem;margin-top:5px;">Programación de eventos en vivo y acceso a grabaciones.</p>
        </div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalCapacitacion()">➕ Nueva Charla</button>
        </div>
      </div>

      <div id="capacitaciones-grid" class="modules-grid">
        <div style="text-align:center;padding:2rem;color:var(--gray-400);grid-column:1/-1;">
          <div class="spinner-inline"></div> Cargando capacitaciones...
        </div>
      </div>
    </div>
  `;

  try {
    const res = await API.capacitaciones.list();
    if (res.success) {
      window.allCapacitaciones = res.data;
      renderCapacitacionesGrid(res.data);
    } else {
      document.getElementById('capacitaciones-grid').innerHTML = 
        `<div style="text-align:center;padding:2rem;color:var(--danger);grid-column:1/-1;">Error al cargar datos.</div>`;
    }
  } catch (err) {
    document.getElementById('capacitaciones-grid').innerHTML = 
      `<div style="text-align:center;padding:2rem;color:var(--danger);grid-column:1/-1;">Error de conexión.</div>`;
  }
}

function renderCapacitacionesGrid(data) {
  const grid = document.getElementById('capacitaciones-grid');
  if (!grid) return;

  if (!data.length) {
    grid.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--gray-400);grid-column:1/-1;">No hay capacitaciones programadas.</div>`;
    return;
  }

  const estadoBadge = {
    'programada': '<span class="badge badge-pendiente">Programada</span>',
    'en_curso': '<span class="badge badge-aplica" style="animation: pulse 2s infinite">En Vivo 🔴</span>',
    'finalizada': '<span class="badge badge-no_aplica">Finalizada</span>'
  };

  grid.innerHTML = data.map(c => {
    const orgs = c.organizaciones_nombres || 'Todas las organizaciones';
    
    let btnAccion = '';
    if (c.estado === 'programada') {
      btnAccion = `
        <button class="btn btn-primary btn-sm" onclick="iniciarCapacitacion(${c.id}, '${c.sala_url}')">Iniciar Sala</button>
        <button class="btn btn-secondary btn-icon btn-sm" onclick="abrirModalCapacitacion(${c.id})" title="Editar">✏️</button>
        <button class="btn btn-secondary btn-icon btn-sm" onclick="eliminarCapacitacion(${c.id})" title="Eliminar"><span style="color:var(--danger)">🗑️</span></button>
      `;
    } else if (c.estado === 'en_curso') {
      btnAccion = `
        <button class="btn btn-secondary btn-sm" style="background:var(--danger);color:white;border-color:var(--danger)" onclick="cerrarSala(${c.id})">Finalizar Evento</button>
        <button class="btn btn-primary btn-sm" onclick="iniciarCapacitacion(${c.id}, '${c.sala_url}')">Entrar</button>
      `;
    } else if (c.estado === 'finalizada') {
      if (c.grabacion_url) {
        btnAccion = `<a href="${c.grabacion_url}" target="_blank" class="btn btn-secondary btn-sm">▶️ Ver Grabación</a>`;
      } else {
        btnAccion = `<button class="btn btn-secondary btn-sm" onclick="solicitarLinkGrabacion(${c.id})">🔗 Subir Grabación</button>`;
      }
    }

    return `
      <div class="module-card" style="display:flex;flex-direction:column;">
        <div class="module-card-header" style="justify-content:space-between">
          <div style="font-weight:bold;font-size:1.1rem;color:var(--gray-800)">${c.titulo}</div>
          <div>${estadoBadge[c.estado]}</div>
        </div>
        <div class="module-desc" style="flex:1;">
          <p style="margin-bottom:.5rem;">${c.descripcion || 'Sin descripción'}</p>
          <div style="font-size:0.8rem;color:var(--gray-500);margin-bottom:.25rem;">📅 ${formatDate(c.fecha_hora)} ${new Date(c.fecha_hora).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</div>
          <div style="font-size:0.8rem;color:var(--gray-500);">🏢 ${orgs}</div>
        </div>
        <div class="module-card-footer" style="display:flex;gap:0.5rem;justify-content:flex-end;border-top:1px solid var(--gray-200);padding-top:1rem;margin-top:1rem;">
          ${btnAccion}
        </div>
      </div>
    `;
  }).join('');
}

async function abrirModalCapacitacion(id = null) {
  let param = { titulo: '', descripcion: '', fecha_hora: '', organizaciones: [] };
  if (id) {
    param = window.allCapacitaciones.find(p => p.id == id) || param;
    if (param.fecha_hora) param.fecha_hora = param.fecha_hora.replace(' ', 'T').slice(0, 16);
  }

  // Cargar organizaciones
  let orgOptions = '<option value="">Cargando organizaciones...</option>';
  try {
    const resOrg = await API.beneficiarios.organizaciones.list();
    if (resOrg.success) {
      orgOptions = resOrg.data.map(o => `<option value="${o.id}" ${param.organizaciones.includes(o.id.toString()) ? 'selected' : ''}>${o.nombre}</option>`).join('');
    }
  } catch (e) {}

  const title = id ? 'Editar Charla' : 'Nueva Charla';
  
  showModal(title, `
    <form id="form-capacitacion" onsubmit="guardarCapacitacion(event, ${id || 'null'})" style="display:flex;flex-direction:column;gap:1rem">
      <div class="form-group">
        <label class="form-label" for="cap-titulo">TÍTULO</label>
        <input type="text" class="form-control" id="cap-titulo" required value="${param.titulo}">
      </div>
      <div class="form-group">
        <label class="form-label" for="cap-desc">DESCRIPCIÓN</label>
        <textarea class="form-control" id="cap-desc" rows="3">${param.descripcion}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="cap-fecha">FECHA Y HORA</label>
        <input type="datetime-local" class="form-control" id="cap-fecha" required value="${param.fecha_hora}">
      </div>
      <div class="form-group">
        <label class="form-label" for="cap-orgs">ORGANIZACIONES INVITADAS (Ctrl+Clic para varias)</label>
        <select class="form-control" id="cap-orgs" multiple style="height:100px;">
          ${orgOptions}
        </select>
        <small style="color:var(--gray-400)">Si no seleccionas ninguna, será una charla abierta.</small>
      </div>
      <button type="submit" style="display:none;" id="btn-submit-cap-hidden"></button>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-cap-hidden').click()">Guardar</button>
  `);
}

async function guardarCapacitacion(event, id) {
  event.preventDefault();
  
  const orgsSelect = document.getElementById('cap-orgs');
  const orgs = Array.from(orgsSelect.selectedOptions).map(opt => opt.value);

  const fd = new FormData();
  if (id) fd.append('id', id);
  fd.append('titulo', document.getElementById('cap-titulo').value);
  fd.append('descripcion', document.getElementById('cap-desc').value);
  // Reemplazar T por espacio para mysql
  fd.append('fecha_hora', document.getElementById('cap-fecha').value.replace('T', ' ') + ':00');
  fd.append('organizaciones', JSON.stringify(orgs));

  try {
    const res = await API.capacitaciones.save(fd);
    if (res.success) {
      showToastAdmin(res.message);
      closeModal();
      renderCapacitaciones();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar.', 'error');
  }
}

async function eliminarCapacitacion(id) {
  if (!confirm('¿Seguro que deseas eliminar esta capacitación?')) return;
  const fd = new FormData();
  fd.append('id', id);
  const res = await API.capacitaciones.delete(fd);
  if (res.success) { showToastAdmin('Eliminada'); renderCapacitaciones(); }
}

// ---- INTEGRACIÓN JITSI ----
async function iniciarCapacitacion(id, salaUrl) {
  // Cambiar estado a 'en_curso' en DB si no lo estaba
  const cap = window.allCapacitaciones.find(c => c.id == id);
  if (cap && cap.estado === 'programada') {
    const fd = new FormData();
    fd.append('id', id);
    fd.append('estado', 'en_curso');
    await API.capacitaciones.state(fd);
  }

  const content = document.getElementById('content');
  content.innerHTML = `
    <div style="height:100%; display:flex; flex-direction:column; background:#000;">
      <div style="padding:1rem; display:flex; justify-content:space-between; align-items:center; background:#111; color:white;">
        <div style="font-weight:bold;">🔴 Sala En Vivo: ${cap ? cap.titulo : salaUrl}</div>
        <div>
          <button class="btn btn-secondary btn-sm" onclick="destruirJitsi(); renderCapacitaciones();">← Salir (Dejar Abierta)</button>
          <button class="btn btn-primary btn-sm" style="background:var(--danger);border-color:var(--danger)" onclick="cerrarSala(${id})">Finalizar Evento para Todos</button>
        </div>
      </div>
      <div id="jitsi-container" style="flex:1;"></div>
    </div>
  `;

  const user = Auth.getUser();
  const domain = 'meet.jit.si';
  const options = {
      roomName: salaUrl,
      width: '100%',
      height: '100%',
      parentNode: document.querySelector('#jitsi-container'),
      lang: 'es',
      userInfo: {
          email: user.email || 'admin@utcomexagro.com',
          displayName: user.nombre || 'Administrador'
      },
      configOverwrite: { 
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        prejoinPageEnabled: false
      },
      interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
      }
  };

  try {
    jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
  } catch (e) {
    showToastAdmin('Error al cargar Jitsi. Revisa tu conexión.', 'error');
  }
}

function destruirJitsi() {
  if (jitsiApi) {
    jitsiApi.dispose();
    jitsiApi = null;
  }
}

async function cerrarSala(id) {
  destruirJitsi();
  
  // Modal para pedir enlace de grabación
  showModal('Finalizar Capacitación', `
    <p style="margin-bottom:1rem;">La capacitación ha finalizado. Si grabaste la sesión, pega el enlace de Dropbox, YouTube o Drive a continuación para que los asistentes puedan verla después.</p>
    <div class="form-group">
      <label class="form-label" for="cap-grabacion">Enlace de Grabación (Opcional)</label>
      <input type="url" class="form-control" id="cap-grabacion" placeholder="https://youtube.com/...">
    </div>
  `, `
    <button class="btn btn-primary" onclick="guardarGrabacionYFinalizar(${id})">Guardar y Finalizar</button>
  `);
}

async function guardarGrabacionYFinalizar(id) {
  const url = document.getElementById('cap-grabacion').value;
  const fd = new FormData();
  fd.append('id', id);
  fd.append('estado', 'finalizada');
  if (url) fd.append('grabacion_url', url);

  const res = await API.capacitaciones.state(fd);
  closeModal();
  if (res.success) {
    showToastAdmin('Evento finalizado correctamente.');
    renderCapacitaciones();
  } else {
    showToastAdmin(res.message, 'error');
  }
}

async function solicitarLinkGrabacion(id) {
  showModal('Subir Grabación', `
    <div class="form-group">
      <label class="form-label" for="cap-grabacion-upd">Enlace de Grabación</label>
      <input type="url" class="form-control" id="cap-grabacion-upd" placeholder="https://youtube.com/...">
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarGrabacionYFinalizar(${id})">Guardar</button>
  `);
}
