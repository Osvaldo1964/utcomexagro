// ================================================================
//  MÓDULO: ENCUESTAS
//  admin/js/modules/encuestas.js
// ================================================================

function renderEncuestas() {
  updateBreadcrumb();
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">📝 Módulo de Encuestas</div>
      </div>
      <div class="modules-grid">
        <div class="module-card" onclick="renderDisenoEncuestas()">
          <div class="module-card-header">
            <div class="module-icon icon-config" style="background:#0F766E">📐</div>
            <div><div class="module-name">Diseño de Encuestas</div></div>
          </div>
          <div class="module-desc">Crear y estructurar formularios de encuestas y caracterización.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>

        <div class="module-card" onclick="renderRegistroEncuestas()">
          <div class="module-card-header">
            <div class="module-icon icon-people">📋</div>
            <div><div class="module-name">Registro de Encuestas</div></div>
          </div>
          <div class="module-desc">Aplicar encuestas, llenar respuestas y consultar resultados.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>
      </div>
    </div>
  `;
}

// ================================================================
// DISEÑO DE ENCUESTAS
// ================================================================
async function renderDisenoEncuestas() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Encuestas', key: 'encuestas' },
    { label: 'Diseño' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  try {
    const res = await API.get('/encuestas/list.php');
    window.allEncuestas = res.success ? res.data : [];
    
    content.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">📐 Diseño de Encuestas</div>
          <div class="module-page-actions">
            <button class="btn btn-primary btn-sm" onclick="abrirModalEncuesta()">➕ Crear Encuesta</button>
            <button class="btn btn-secondary btn-sm" onclick="renderEncuestas()">↩️ Volver</button>
          </div>
        </div>

        <div class="table-card" style="animation: fadeIn .3s ease">
          <div class="table-toolbar">
            <div class="table-search">
              <span>🔍</span>
              <input type="text" id="search-encuestas" placeholder="Buscar encuestas..." onkeyup="filterEncuestas()">
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Preguntas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tb-encuestas"></tbody>
          </table>
          <div class="table-pagination" id="pag-encuestas"></div>
        </div>
      </div>
    `;
    renderEncuestasTable(window.allEncuestas);
  } catch (err) {
    showToastAdmin('Error al cargar encuestas', 'error');
  }
}

function renderEncuestasTable(data) {
  const tbody = document.getElementById('tb-encuestas');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">No hay encuestas registradas.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(e => {
    const preguntasCount = Array.isArray(e.preguntas) ? e.preguntas.length : 0;
    const badgeClass = parseInt(e.activa) === 1 ? 'badge-contratado' : 'badge-no_aplica';
    const estadoText = parseInt(e.activa) === 1 ? 'Activa' : 'Inactiva';

    return `
      <tr>
        <td style="font-weight:600;color:var(--gray-900)">${e.titulo}</td>
        <td>${formatDate(e.fecha_inicio)}</td>
        <td>${formatDate(e.fecha_fin)}</td>
        <td>${preguntasCount}</td>
        <td><span class="badge ${badgeClass}">${estadoText}</span></td>
        <td>
          <div style="display:flex;gap:.375rem">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="abrirModalEncuesta(${e.id})" title="Editar">✏️</button>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="toggleEstadoEncuesta(${e.id}, ${e.activa})" title="Cambiar Estado">🔄</button>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="eliminarEncuesta(${e.id}, '${e.titulo}')" title="Eliminar" style="color:var(--danger)">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterEncuestas() {
  const q = (document.getElementById('search-encuestas')?.value || '').toLowerCase();
  const filtered = window.allEncuestas.filter(e => e.titulo.toLowerCase().includes(q));
  renderEncuestasTable(filtered);
}

// ================================================================
// BUILDER DE ENCUESTAS (MODAL)
// ================================================================
let currentPreguntas = [];

function abrirModalEncuesta(id = null) {
  const e = id ? window.allEncuestas.find(x => x.id === id) : null;
  const tituloModal = e ? 'Editar Encuesta' : 'Crear Encuesta';

  currentPreguntas = e && Array.isArray(e.preguntas) ? JSON.parse(JSON.stringify(e.preguntas)) : [];

  const html = `
    <form id="form-encuesta" onsubmit="guardarEncuesta(event, ${id || 'null'})" style="text-align:left;">
      <div class="form-group">
        <label class="form-label" for="enc-titulo">Título de la Encuesta *</label>
        <input type="text" class="form-control" id="enc-titulo" required value="${e ? e.titulo : ''}" placeholder="Ej: Encuesta de Satisfacción">
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div class="form-group">
          <label class="form-label" for="enc-inicio">Fecha de Inicio</label>
          <input type="date" class="form-control" id="enc-inicio" value="${e && e.fecha_inicio ? e.fecha_inicio : ''}">
        </div>
        <div class="form-group">
          <label class="form-label" for="enc-fin">Fecha de Fin</label>
          <input type="date" class="form-control" id="enc-fin" value="${e && e.fecha_fin ? e.fecha_fin : ''}">
        </div>
      </div>

      <div style="margin-top:1.5rem;border-top:1px solid var(--gray-200);padding-top:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h4 style="margin:0;color:var(--gray-800);font-size:1.1rem">Preguntas Dinámicas</h4>
          <button type="button" class="btn btn-secondary btn-sm" onclick="agregarPregunta()" id="btn-add-preg">➕ Añadir Pregunta</button>
        </div>
        
        <div id="builder-container" style="display:flex;flex-direction:column;gap:1rem;"></div>
      </div>

      <button type="submit" style="display:none;" id="btn-submit-encuesta-hidden"></button>
    </form>
  `;

  showModal(tituloModal, html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-encuesta-hidden').click()">Guardar Encuesta</button>
  `, true, true); // isLarge = true, preventOutsideClick = true

  renderBuilder();
}

// ==== Lógica del Builder de Preguntas ====
function agregarPregunta() {
  if (currentPreguntas.length >= 10) {
    showToastAdmin('El máximo permitido es de 10 preguntas.', 'info');
    return;
  }
  currentPreguntas.push({
    texto: '',
    tipo: 'texto',
    opciones: ''
  });
  renderBuilder();
}

function eliminarPregunta(index) {
  currentPreguntas.splice(index, 1);
  renderBuilder();
}

function actualizarPregunta(index, key, value) {
  currentPreguntas[index][key] = value;
  if (key === 'tipo') {
    renderBuilder(); // Refresh UI to show/hide options field
  }
}

function renderBuilder() {
  const container = document.getElementById('builder-container');
  const btnAdd = document.getElementById('btn-add-preg');
  if (!container) return;

  if (btnAdd) {
    btnAdd.disabled = currentPreguntas.length >= 10;
  }

  if (currentPreguntas.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--gray-400);border:1px dashed var(--gray-300);border-radius:8px">No hay preguntas agregadas. Clic en "Añadir Pregunta".</div>`;
    return;
  }

  container.innerHTML = currentPreguntas.map((p, i) => {
    const showOpts = (p.tipo === 'opcion' || p.tipo === 'seleccion_multiple');
    return `
      <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:1rem;position:relative;">
        <div style="position:absolute;top:1rem;right:1rem;">
          <button type="button" class="btn btn-danger btn-sm btn-icon" onclick="eliminarPregunta(${i})" title="Eliminar pregunta">🗑️</button>
        </div>
        
        <div style="font-weight:600;margin-bottom:.5rem;color:var(--green-700)">Pregunta ${i + 1}</div>
        
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:1rem;margin-bottom:${showOpts ? '1rem' : '0'}">
          <div>
            <label class="form-label">Texto de la pregunta *</label>
            <input type="text" class="form-control" required placeholder="Ej: ¿Cuál es su experiencia?" value="${p.texto}" oninput="actualizarPregunta(${i}, 'texto', this.value)">
          </div>
          <div>
            <label class="form-label">Tipo de Respuesta</label>
            <select class="form-control" onchange="actualizarPregunta(${i}, 'tipo', this.value)" style="padding-left:1rem">
              <option value="texto" ${p.tipo === 'texto' ? 'selected' : ''}>Texto corto</option>
              <option value="fecha" ${p.tipo === 'fecha' ? 'selected' : ''}>Fecha</option>
              <option value="opcion" ${p.tipo === 'opcion' ? 'selected' : ''}>Opción única (Radio)</option>
              <option value="seleccion_multiple" ${p.tipo === 'seleccion_multiple' ? 'selected' : ''}>Selección Múltiple (Check)</option>
            </select>
          </div>
        </div>

        ${showOpts ? `
          <div>
            <label class="form-label">Opciones de respuesta (Separadas por comas)</label>
            <input type="text" class="form-control" placeholder="Ej: Sí, No, Tal vez" value="${p.opciones || ''}" oninput="actualizarPregunta(${i}, 'opciones', this.value)">
            <small style="color:var(--gray-500)">Escribe las opciones separadas por una coma (,).</small>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ==== Guardado de Encuesta ====
async function guardarEncuesta(event, id) {
  event.preventDefault();

  const titulo = document.getElementById('enc-titulo').value.trim();
  const fecha_inicio = document.getElementById('enc-inicio').value;
  const fecha_fin = document.getElementById('enc-fin').value;

  // Validate questions
  for (let i=0; i<currentPreguntas.length; i++) {
    const p = currentPreguntas[i];
    if (!p.texto.trim()) {
      showToastAdmin(`La pregunta ${i+1} no tiene texto.`, 'error');
      return;
    }
    if ((p.tipo === 'opcion' || p.tipo === 'seleccion_multiple') && (!p.opciones || !p.opciones.trim())) {
      showToastAdmin(`La pregunta ${i+1} requiere opciones de respuesta.`, 'error');
      return;
    }
  }

  const payload = {
    id,
    titulo,
    fecha_inicio,
    fecha_fin,
    preguntas: currentPreguntas
  };

  try {
    const url = id ? '/encuestas/update.php' : '/encuestas/create.php';
    const res = await API.post(url, payload);
    if (res.success) {
      showToastAdmin(res.message);
      closeModal();
      renderDisenoEncuestas();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar la encuesta', 'error');
  }
}

async function toggleEstadoEncuesta(id, currentState) {
  const newState = currentState == 1 ? 0 : 1;
  try {
    const res = await API.post('/encuestas/update.php', { id, activa: newState });
    if (res.success) {
      showToastAdmin('Estado de la encuesta actualizado');
      renderDisenoEncuestas();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (e) {
    showToastAdmin('Error al cambiar estado', 'error');
  }
}

async function eliminarEncuesta(id, nombre) {
  if (confirm(`¿Está seguro de eliminar la encuesta "${nombre}"?`)) {
    try {
      const res = await API.post('/encuestas/delete.php', { id });
      if (res.success) {
        showToastAdmin(res.message);
        renderDisenoEncuestas();
      } else {
        showToastAdmin(res.message, 'error');
      }
    } catch (e) {
      showToastAdmin('Error al eliminar', 'error');
    }
  }
}

// ================================================================
// REGISTRO DE ENCUESTAS (LLENADO)
// ================================================================
async function renderRegistroEncuestas() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Encuestas', key: 'encuestas' },
    { label: 'Registro' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  try {
    const res = await API.get('/encuestas/list.php');
    const encuestasActivas = res.success ? res.data.filter(e => parseInt(e.activa) === 1) : [];

    let options = '<option value="">-- Seleccione una encuesta --</option>';
    encuestasActivas.forEach(e => {
      options += `<option value="${e.id}">${e.titulo}</option>`;
    });

    content.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">📋 Registro de Encuestas</div>
          <div class="module-page-actions">
            <button class="btn btn-secondary btn-sm" onclick="renderEncuestas()">↩️ Volver</button>
          </div>
        </div>

        <div class="card" style="max-width:800px; margin:0 auto; padding:2rem; animation:fadeIn .3s ease">
          <div class="form-group">
            <label class="form-label" style="font-size:1.1rem; color:var(--green-700)">1. Seleccione la Encuesta a diligenciar:</label>
            <select class="form-control" id="encuesta-selector" style="font-size:1.05rem" onchange="seleccionarEncuestaParaRegistro(this.value)">
              ${options}
            </select>
          </div>
          
          <div id="registro-container" style="display:none; margin-top:2rem; border-top:2px dashed var(--gray-200); padding-top:2rem;">
            <!-- Renderizado dinámico del formulario -->
          </div>
        </div>
      </div>
    `;

    // Store active surveys to use later
    window.encuestasActivasRegistro = encuestasActivas;

  } catch (err) {
    showToastAdmin('Error al cargar encuestas para registro', 'error');
  }
}

function seleccionarEncuestaParaRegistro(encuestaId) {
  const container = document.getElementById('registro-container');
  if (!encuestaId) {
    container.style.display = 'none';
    return;
  }

  const encuesta = window.encuestasActivasRegistro.find(e => e.id == encuestaId);
  if (!encuesta) return;

  const preguntas = Array.isArray(encuesta.preguntas) ? encuesta.preguntas : [];

  let formHtml = `
    <form id="form-registro-encuesta" onsubmit="enviarRespuestaEncuesta(event, ${encuesta.id})">
      <h3 style="color:var(--gray-800); margin-top:0">${encuesta.titulo}</h3>
      <p style="color:var(--gray-500); margin-bottom:2rem">Por favor, diligencie todos los campos requeridos.</p>

      <div style="background:var(--gray-50); padding:1.5rem; border-radius:8px; border:1px solid var(--gray-200); margin-bottom:2rem;">
        <h4 style="margin-top:0; color:var(--gray-700); margin-bottom:1rem;">A. Identificación del Encuestado</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Identificación (Cédula/NIT) *</label>
            <input type="text" class="form-control" id="reg-identificacion" required>
          </div>
          <div class="form-group">
            <label class="form-label">Nombres y Apellidos *</label>
            <input type="text" class="form-control" id="reg-nombres" required style="text-transform:uppercase">
          </div>
          <div class="form-group">
            <label class="form-label">Departamento *</label>
            <select class="form-control" id="reg-dep" required onchange="loadMunicipios('reg-dep', 'reg-mun')">
              <option value="">Seleccione Departamento</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Municipio *</label>
            <select class="form-control" id="reg-mun" required>
              <option value="">Seleccione Municipio</option>
            </select>
          </div>
        </div>
      </div>

      <div style="padding:1.5rem; border-radius:8px; border:1px solid var(--gray-200); margin-bottom:2rem;">
        <h4 style="margin-top:0; color:var(--green-700); margin-bottom:1rem;">B. Cuestionario</h4>
        ${preguntas.length === 0 ? '<p>Esta encuesta no tiene preguntas dinámicas.</p>' : ''}
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
  `;

  preguntas.forEach((p, index) => {
    formHtml += renderPreguntaInput(p, index);
  });

  formHtml += `
        </div>
      </div>
      
      <div style="text-align:right">
        <button type="submit" class="btn btn-primary" id="btn-submit-registro">Guardar Respuestas</button>
      </div>
    </form>
  `;

  container.innerHTML = formHtml;
  container.style.display = 'block';

  // Load departamentos
  if (typeof loadDepartamentos === 'function') {
    loadDepartamentos('reg-dep');
  }
}

function renderPreguntaInput(pregunta, index) {
  let inputHtml = '';
  const requiredAttr = 'required';
  const nameAttr = `name="pregunta_${index}"`;

  switch(pregunta.tipo) {
    case 'texto':
      inputHtml = `<input type="text" class="form-control" id="pregunta_${index}" ${requiredAttr}>`;
      break;
    case 'fecha':
      inputHtml = `<input type="date" class="form-control" id="pregunta_${index}" ${requiredAttr}>`;
      break;
    case 'opcion':
      if (pregunta.opciones) {
        const opciones = pregunta.opciones.split(',').map(o => o.trim());
        inputHtml = `<div style="display:flex; flex-direction:column; gap:.5rem; padding-top:.5rem">`;
        opciones.forEach((opt, i) => {
          inputHtml += `
            <label style="display:flex; align-items:center; gap:.5rem; cursor:pointer;">
              <input type="radio" ${nameAttr} value="${opt}" ${requiredAttr}> ${opt}
            </label>
          `;
        });
        inputHtml += `</div>`;
      }
      break;
    case 'seleccion_multiple':
      if (pregunta.opciones) {
        const opciones = pregunta.opciones.split(',').map(o => o.trim());
        inputHtml = `<div style="display:flex; flex-direction:column; gap:.5rem; padding-top:.5rem" id="pregunta_${index}_group">`;
        opciones.forEach((opt, i) => {
          inputHtml += `
            <label style="display:flex; align-items:center; gap:.5rem; cursor:pointer;">
              <input type="checkbox" class="chk-pregunta-${index}" value="${opt}"> ${opt}
            </label>
          `;
        });
        inputHtml += `</div>`;
      }
      break;
  }

  return `
    <div class="form-group" style="margin-bottom:0">
      <label class="form-label" style="font-weight:600; font-size:1.05rem">${index + 1}. ${pregunta.texto} *</label>
      ${inputHtml}
    </div>
  `;
}

async function enviarRespuestaEncuesta(event, encuestaId) {
  event.preventDefault();

  const encuesta = window.encuestasActivasRegistro.find(e => e.id == encuestaId);
  if (!encuesta) return;

  const btn = document.getElementById('btn-submit-registro');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const payload = {
    encuesta_id: encuestaId,
    identificacion: document.getElementById('reg-identificacion').value.trim(),
    nombres: document.getElementById('reg-nombres').value.trim(),
    departamento: document.getElementById('reg-dep').value,
    municipio: document.getElementById('reg-mun').value,
    respuestas: {}
  };

  // Collect answers
  const preguntas = Array.isArray(encuesta.preguntas) ? encuesta.preguntas : [];
  let valid = true;

  for (let i = 0; i < preguntas.length; i++) {
    const p = preguntas[i];
    if (p.tipo === 'texto' || p.tipo === 'fecha') {
      const el = document.getElementById(`pregunta_${i}`);
      payload.respuestas[p.texto] = el.value;
    } else if (p.tipo === 'opcion') {
      const selected = document.querySelector(`input[name="pregunta_${i}"]:checked`);
      payload.respuestas[p.texto] = selected ? selected.value : '';
    } else if (p.tipo === 'seleccion_multiple') {
      const checks = document.querySelectorAll(`.chk-pregunta-${i}:checked`);
      if (checks.length === 0) {
        showToastAdmin(`Debe seleccionar al menos una opción en la pregunta ${i+1}.`, 'error');
        valid = false;
        break;
      }
      payload.respuestas[p.texto] = Array.from(checks).map(c => c.value);
    }
  }

  if (!valid) {
    btn.disabled = false;
    btn.textContent = 'Guardar Respuestas';
    return;
  }

  try {
    const res = await API.post('/encuestas/save_response.php', payload);
    if (res.success) {
      showToastAdmin(res.message);
      
      // Reload the form to allow rapid entry for another person (User's request)
      seleccionarEncuestaParaRegistro(encuestaId);
      
      // Focus on the first field
      setTimeout(() => document.getElementById('reg-identificacion')?.focus(), 100);

    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar la respuesta', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar Respuestas';
  }
}
