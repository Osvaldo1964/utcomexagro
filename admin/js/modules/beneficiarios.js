// ================================================================
//  MÓDULO: BENEFICIARIOS Y ORGANIZACIONES
//  admin/js/modules/beneficiarios.js
// ================================================================

function renderBeneficiariosMenu() {
  updateBreadcrumb();
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-title" style="margin-bottom:1.5rem">🤝 Módulo de Beneficiarios y Organizaciones</div>
      <div class="modules-grid">
        <div class="module-card" onclick="loadTipos()">
          <div class="module-card-header">
            <div class="module-icon icon-config" style="background:#0F766E">🏷️</div>
            <div><div class="module-name">Tipos de Org.</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Gestionar categorías de organizaciones (Acuícola, Avícola, Bovinos, etc.).</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>

        <div class="module-card" onclick="loadTiposPoblacion()">
          <div class="module-card-header">
            <div class="module-icon icon-training" style="background:#B45309">🌍</div>
            <div><div class="module-name">Enfoques Poblacionales</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Gestionar tipos de población (Afro, Indígena, Raizal, etc.) para organizaciones.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>

        <div class="module-card" onclick="renderOrganizaciones()">
          <div class="module-card-header">
            <div class="module-icon icon-config">🏢</div>
            <div><div class="module-name">Organizaciones</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Registrar y gestionar organizaciones a las que pertenecen los beneficiarios.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>

        <div class="module-card" onclick="loadBeneficiarios()">
          <div class="module-card-header">
            <div class="module-icon icon-people">👥</div>
            <div><div class="module-name">Beneficiarios</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Registrar y consultar los beneficiarios asociados a cada organización.</div>
          <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
        </div>
      </div>
    </div>
  `;
}



// ---- BENEFICIARIOS ----
async function loadBeneficiarios() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Beneficiarios', key: 'beneficiarios' },
    { label: 'Listado de Beneficiarios' }
  ]);
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">👥 Gestión de Beneficiarios</div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalBeneficiario()">➕ Agregar Beneficiario</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('beneficiarios')">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar por nombre, documento..." id="search-benefs" oninput="filterBeneficiarios()">
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <select class="btn btn-secondary btn-sm" id="filter-org-benef" onchange="filterBeneficiarios()">
              <option value="">Todas las organizaciones</option>
            </select>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre Completo</th>
                <th>Organización</th>
                <th>Programa</th>
                <th>Contacto</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="benefs-tbody">
              <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando beneficiarios...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const [resBenefs, resOrgs] = await Promise.all([
      API.beneficiarios.beneficiarios.list(),
      API.beneficiarios.organizaciones.list()
    ]);

    if (resBenefs.success && resOrgs.success) {
      window.allBeneficiarios = resBenefs.data;
      window.allOrganizaciones = resOrgs.data;

      // Llenar select de filtro de organizaciones
      const filterOrg = document.getElementById('filter-org-benef');
      if (filterOrg) {
        resOrgs.data.forEach(o => {
          const opt = document.createElement('option');
          opt.value = o.nombre;
          opt.textContent = o.nombre;
          filterOrg.appendChild(opt);
        });
      }

      renderBeneficiariosTable(resBenefs.data);
    } else {
      document.getElementById('benefs-tbody').innerHTML = 
        `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--danger)">Error al cargar datos: ${resBenefs.message || resOrgs.message}</td></tr>`;
    }
  } catch (err) {
    document.getElementById('benefs-tbody').innerHTML = 
      `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--danger)">Error de conexión con el servidor.</td></tr>`;
  }
}

function renderBeneficiariosTable(data) {
  const tbody = document.getElementById('benefs-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-400)">No se encontraron beneficiarios.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(b => {
    const badgeClass = b.estado === 'activo' ? 'badge-aplica' : 'badge-no_aplica';
    return `
      <tr>
        <td><strong>${b.tipo_doc} ${b.num_doc}</strong></td>
        <td><strong>${b.p_nombre} ${b.s_nombre || ''} ${b.p_apellido} ${b.s_apellido || ''}</strong></td>
        <td><span style="font-weight:600;color:var(--green-700)">${b.organizacion_nombre || 'Sin Organización'}</span></td>
        <td style="font-size:.8rem">${b.programa_nombre || '–'}</td>
        <td style="font-size:.8rem;text-align:left;">
          📞 ${b.telefono || '–'}<br>
          📧 ${b.email || '–'}
        </td>
        <td style="font-size:.8rem">${b.municipio || '–'}, ${b.departamento || '–'}</td>
        <td><span class="badge ${badgeClass}">${b.estado}</span></td>
        <td>
          <div style="display:flex;gap:.375rem">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="abrirModalBeneficiario(${b.id})" title="Editar beneficiario">✏️</button>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="confirmarEliminarBeneficiario(${b.id}, '${b.p_nombre} ${b.p_apellido}')" title="Eliminar beneficiario" style="color:var(--danger)">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterBeneficiarios() {
  const search = (document.getElementById('search-benefs')?.value || '').toLowerCase();
  const org = document.getElementById('filter-org-benef')?.value || '';

  let filtered = window.allBeneficiarios || [];
  if (search) {
    filtered = filtered.filter(b => 
      `${b.p_nombre} ${b.p_apellido} ${b.num_doc} ${b.email || ''}`.toLowerCase().includes(search)
    );
  }
  if (org) {
    filtered = filtered.filter(b => b.organizacion_nombre === org);
  }
  renderBeneficiariosTable(filtered);
}

async function abrirModalBeneficiario(id = null) {
  if (id && typeof id === 'object') id = null; // Prevent Event objects from being used as ID
  try {
    const b = id ? (window.allBeneficiarios || []).find(x => x.id === id) : null;
    const titulo = b ? 'Editar Beneficiario' : 'Agregar Nuevo Beneficiario';

    let orgs = window.allOrganizaciones;
    if (!orgs) {
      const resOrgs = await API.beneficiarios.organizaciones.list();
      orgs = resOrgs.success ? resOrgs.data : [];
      window.allOrganizaciones = orgs;
    }

    const resProgs = await API.get('/postulados/programas.php');
    const progs = resProgs.success ? resProgs.data : [];

    const orgsOpts = orgs.map(o => {
      const limit = parseInt(o.max_beneficiarios, 10);
      const actual = parseInt(o.total_beneficiarios_actual, 10) || 0;
      const cupoText = limit > 0 ? `(Cupo: ${actual}/${limit})` : '(Ilimitado)';
      const isFull = limit > 0 && actual >= limit && (!b || b.organizacion_id !== o.id);
      const sel = (b && b.organizacion_id === o.id) ? 'selected' : '';
      return `<option value="${o.id}" ${sel} ${isFull ? 'disabled style="color:var(--gray-400);"' : ''}>${o.nombre} ${cupoText}</option>`;
    }).join('');

    const progsOpts = progs.map(p => {
      const sel = (b && b.programa_id === p.id) ? 'selected' : '';
      return `<option value="${p.id}" ${sel}>${p.nombre}</option>`;
    }).join('');

    const html = `
      <div class="tabs-container" style="margin-bottom:1rem">
        <div class="tab active" onclick="switchTab(this, 'tab-gen-benef')">Datos Generales</div>
        <div class="tab" onclick="switchTab(this, 'tab-doc-benef')">Documentos</div>
      </div>
      
      <form id="form-crear-benef" onsubmit="guardarBeneficiario(event, ${id || 'null'})" style="text-align:left;">
        
        <!-- TAB 1: DATOS GENERALES -->
        <div id="tab-gen-benef" class="tab-content active" style="display:flex;flex-direction:column;gap:1rem;">
          <div class="form-group">
            <label class="form-label" for="benef-org">Organización Asociada *</label>
            <select class="form-control" id="benef-org" required style="padding-left:1rem">
              <option value="">Seleccione una organización...</option>
              ${orgsOpts}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
              <label class="form-label" for="benef-tipodoc">Tipo Documento *</label>
              <select class="form-control" id="benef-tipodoc" required style="padding-left:1rem">
                <option value="CC" ${b && b.tipo_doc==='CC'?'selected':''}>Cédula de Ciudadanía (CC)</option>
                <option value="CE" ${b && b.tipo_doc==='CE'?'selected':''}>Cédula de Extranjería (CE)</option>
                <option value="TI" ${b && b.tipo_doc==='TI'?'selected':''}>Tarjeta de Identidad (TI)</option>
                <option value="Pasaporte" ${b && b.tipo_doc==='Pasaporte'?'selected':''}>Pasaporte</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="benef-numdoc">Número Documento *</label>
              <input type="text" class="form-control" id="benef-numdoc" required placeholder="Número documento" value="${b ? b.num_doc : ''}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
              <label class="form-label" for="benef-pnombre">Primer Nombre *</label>
              <input type="text" class="form-control" id="benef-pnombre" required placeholder="Primer nombre" value="${b ? b.p_nombre : ''}" oninput="this.value = this.value.toUpperCase()">
            </div>
            <div class="form-group">
              <label class="form-label" for="benef-snombre">Segundo Nombre</label>
              <input type="text" class="form-control" id="benef-snombre" placeholder="Segundo nombre" value="${b && b.s_nombre ? b.s_nombre : ''}" oninput="this.value = this.value.toUpperCase()">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
              <label class="form-label" for="benef-papellido">Primer Apellido *</label>
              <input type="text" class="form-control" id="benef-papellido" required placeholder="Primer apellido" value="${b ? b.p_apellido : ''}" oninput="this.value = this.value.toUpperCase()">
            </div>
            <div class="form-group">
              <label class="form-label" for="benef-sapellido">Segundo Apellido</label>
              <input type="text" class="form-control" id="benef-sapellido" placeholder="Segundo apellido" value="${b && b.s_apellido ? b.s_apellido : ''}" oninput="this.value = this.value.toUpperCase()">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-email">Correo Electrónico</label>
            <input type="email" class="form-control" id="benef-email" placeholder="beneficiario@correo.com" value="${b && b.email ? b.email : ''}" oninput="this.value = this.value.toLowerCase()">
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-tel">Teléfono</label>
            <input type="text" class="form-control" id="benef-tel" placeholder="Número de teléfono" value="${b && b.telefono ? b.telefono : ''}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
              <label class="form-label" for="benef-dep">Departamento</label>
              <select class="form-control" id="benef-dep"></select>
            </div>
            <div class="form-group">
              <label class="form-label" for="benef-mun">Municipio</label>
              <select class="form-control" id="benef-mun"></select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-prog">Programa Asociado</label>
            <select class="form-control" id="benef-prog" style="padding-left:1rem">
              <option value="">Ningún programa...</option>
              ${progsOpts}
            </select>
          </div>
          
          <div class="remember-wrap" style="color:var(--white);margin-top:.5rem">
            <input type="checkbox" id="benef-activo" ${(!b || b.estado === 'activo') ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--green-500)">
            <label for="benef-activo" style="cursor:pointer;font-size:.875rem">Beneficiario activo</label>
          </div>
          <div class="remember-wrap" style="color:var(--white);margin-top:.5rem">
            <input type="checkbox" id="benef-tratamiento" required ${b && b.tratamiento_datos == 1 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--green-500);flex-shrink:0;margin-top:4px">
            <label for="benef-tratamiento" style="cursor:pointer;font-size:.8rem;line-height:1.4;text-align:justify">
              <strong>Autorización de Tratamiento de Datos Personales *</strong><br>
              Autorizo de manera libre, previa, expresa e informada a UT COMEXAGRO para la recolección, almacenamiento, uso, circulación y supresión de mis datos personales aquí suministrados, con la finalidad de participar en procesos de postulación, selección y contratación, conforme a la política de tratamiento de datos de la entidad y la Ley 1581 de 2012.
            </label>
          </div>
        </div>

        <!-- TAB 2: DOCUMENTOS -->
        <div id="tab-doc-benef" class="tab-content" style="display:none;flex-direction:column;gap:1rem;">
          <div class="form-group">
            <label class="form-label" for="benef-doc-file">Documento de Identidad (PDF o Imagen)</label>
            <input type="file" class="form-control" id="benef-doc-file" accept=".pdf,image/*" style="padding: .5rem">
            ${b && b.doc_identidad_file ? `<div style="margin-top:.5rem;font-size:.85rem">✓ <a href="/utcomexagro/uploads/beneficiarios/${b.doc_identidad_file}" target="_blank" style="color:var(--green-600);text-decoration:underline;font-weight:600">Ver Archivo Actual</a></div>` : ''}
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-rut-file">RUT (PDF o Imagen)</label>
            <input type="file" class="form-control" id="benef-rut-file" accept=".pdf,image/*" style="padding: .5rem">
            ${b && b.rut_file ? `<div style="margin-top:.5rem;font-size:.85rem">✓ <a href="/utcomexagro/uploads/beneficiarios/${b.rut_file}" target="_blank" style="color:var(--green-600);text-decoration:underline;font-weight:600">Ver Archivo Actual</a></div>` : ''}
          </div>
        </div>

        <button type="submit" style="display:none;" id="btn-submit-benef-hidden"></button>
      </form>
    `;

    showModal(titulo, html, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="document.getElementById('btn-submit-benef-hidden').click()">Guardar Beneficiario</button>
    `, true); // isLarge = true
    
    if (typeof loadDepartamentos === 'function') {
      loadDepartamentos('benef-dep');
      setTimeout(() => {
        if (b && b.departamento) {
          document.getElementById('benef-dep').value = b.departamento;
          const ev = new Event('change');
          document.getElementById('benef-dep').dispatchEvent(ev);
        }
      }, 300);
      
      loadMunicipios('benef-dep', 'benef-mun');
      setTimeout(() => {
        if (b && b.municipio) {
          document.getElementById('benef-mun').value = b.municipio;
        }
      }, 600);
    }
    
  } catch (err) {
    showToastAdmin('Error al inicializar formulario de beneficiarios.', 'error');
  }
}

async function guardarBeneficiario(event, id = null) {
  event.preventDefault();

  const orgId = document.getElementById('benef-org').value;
  const tipoDoc = document.getElementById('benef-tipodoc').value;
  const numDoc = document.getElementById('benef-numdoc').value.trim();
  const pNombre = document.getElementById('benef-pnombre').value.trim();
  const sNombre = document.getElementById('benef-snombre').value.trim();
  const pApellido = document.getElementById('benef-papellido').value.trim();
  const sApellido = document.getElementById('benef-sapellido').value.trim();
  const email = document.getElementById('benef-email').value.trim();
  const telefono = document.getElementById('benef-tel').value.trim();
  const departamento = document.getElementById('benef-dep').value.trim();
  const municipio = document.getElementById('benef-mun').value.trim();
  const progId = document.getElementById('benef-prog').value;
  const activo = document.getElementById('benef-activo').checked ? 'activo' : 'inactivo';
  const tratamiento = document.getElementById('benef-tratamiento').checked ? '1' : '0';

  if (!orgId || !tipoDoc || !numDoc || !pNombre || !pApellido || !tratamiento) {
    showToastAdmin('Por favor complete todos los campos obligatorios.', 'error');
    return;
  }

  const fd = new FormData();
  if (id) fd.append('id', id);
  fd.append('organizacion_id', orgId);
  fd.append('tipo_doc', tipoDoc);
  fd.append('num_doc', numDoc);
  fd.append('p_nombre', pNombre);
  fd.append('s_nombre', sNombre);
  fd.append('p_apellido', pApellido);
  fd.append('s_apellido', sApellido);
  fd.append('email', email);
  fd.append('telefono', telefono);
  fd.append('departamento', departamento);
  fd.append('municipio', municipio);
  fd.append('programa_id', progId);
  fd.append('estado', activo);
  fd.append('tratamiento_datos', tratamiento);

  const docFile = document.getElementById('benef-doc-file').files[0];
  if (docFile) fd.append('doc_identidad_file', docFile);

  const rutFile = document.getElementById('benef-rut-file').files[0];
  if (rutFile) fd.append('rut_file', rutFile);

  try {
    const url = id ? '/beneficiarios/update.php' : '/beneficiarios/beneficiarios.php';
    const res = await API.post(url, fd);
    
    if (res.success) {
      showToastAdmin(id ? 'Beneficiario actualizado correctamente.' : 'Beneficiario registrado correctamente.');
      closeModal();
      loadBeneficiarios();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar el beneficiario.', 'error');
  }
}

async function confirmarEliminarBeneficiario(id, nombre) {
  if (confirm(`¿Está seguro de inactivar al beneficiario ${nombre}?`)) {
    try {
      const res = await API.post('/beneficiarios/delete.php', { id });
      if (res.success) {
        showToastAdmin('Beneficiario inactivado con éxito.');
        loadBeneficiarios();
      } else {
        showToastAdmin(res.message, 'error');
      }
    } catch (err) {
      showToastAdmin('Error de conexión al inactivar.', 'error');
    }
  }
}

// ================================================================
//  GESTIÓN DE TIPOS DE ORGANIZACIÓN
// ================================================================
async function loadTipos() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Beneficiarios', key: 'beneficiarios' },
    { label: 'Tipos de Organización' }
  ]);
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">🏷️ Gestión de Tipos de Organización</div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalTipo()">➕ Agregar Tipo</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('beneficiarios')">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar por nombre o descripción..." id="search-tipos" oninput="filterTipos()">
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Org. Asociadas</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tipos-tbody">
              <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando tipos...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await API.beneficiarios.tipos.list();
    if (res.success) {
      window.allTipos = res.data;
      renderTiposTable(res.data);
    } else {
      document.getElementById('tipos-tbody').innerHTML = 
        `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--danger)">Error: ${res.message}</td></tr>`;
    }
  } catch (err) {
    document.getElementById('tipos-tbody').innerHTML = 
      `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--danger)">Error de conexión con el servidor.</td></tr>`;
  }
}

function renderTiposTable(data) {
  const tbody = document.getElementById('tipos-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-400)">No se encontraron tipos de organización.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(t => {
    return `
      <tr>
        <td style="color:var(--gray-400);font-size:.75rem">${t.id}</td>
        <td><strong>${t.nombre}</strong></td>
        <td>${t.descripcion || '–'}</td>
        <td><span class="badge badge-active" style="background:var(--gray-800);border:1px solid var(--gray-700)">${t.total_organizaciones || 0} orgs</span></td>
        <td style="font-size:.78rem;color:var(--gray-400)">${formatDate(t.created_at)}</td>
        <td>
          <div style="display:flex;gap:.375rem">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="abrirModalTipo(${t.id})" title="Editar tipo">✏️</button>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="confirmarEliminarTipo(${t.id}, '${t.nombre}', ${t.total_organizaciones || 0})" title="Eliminar tipo" style="color:var(--danger)">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTipos() {
  const search = (document.getElementById('search-tipos')?.value || '').toLowerCase();
  let filtered = window.allTipos || [];
  if (search) {
    filtered = filtered.filter(t => 
      `${t.nombre} ${t.descripcion || ''}`.toLowerCase().includes(search)
    );
  }
  renderTiposTable(filtered);
}

function abrirModalTipo(id = null) {
  const tipo = id ? (window.allTipos || []).find(t => t.id === id) : null;
  const titulo = tipo ? 'Editar Tipo de Organización' : 'Crear Nuevo Tipo de Organización';
  
  showModal(titulo, `
    <form id="form-crear-tipo" onsubmit="guardarTipo(event, ${id || 'null'})" style="display:flex;flex-direction:column;gap:1rem;text-align:left;">
      <div class="form-group">
        <label class="form-label" for="tipo-nombre">Nombre del Tipo *</label>
        <input type="text" class="form-control" id="tipo-nombre" required placeholder="Ej: Porcino" value="${tipo ? tipo.nombre : ''}">
      </div>
      <div class="form-group">
        <label class="form-label" for="tipo-desc">Descripción</label>
        <textarea class="form-control" id="tipo-desc" rows="3" placeholder="Descripción de las actividades de este sector...">${tipo ? tipo.descripcion || '' : ''}</textarea>
      </div>
      <button type="submit" style="display:none;" id="btn-submit-tipo-hidden"></button>
    </form>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-tipo-hidden').click()">Guardar Tipo</button>
  `);
}

async function guardarTipo(event, id = null) {
  event.preventDefault();

  const nombre = document.getElementById('tipo-nombre').value.trim();
  const descripcion = document.getElementById('tipo-desc').value.trim();

  if (!nombre) {
    showToastAdmin('El nombre es obligatorio.', 'error');
    return;
  }

  const fd = new FormData();
  fd.append('nombre', nombre);
  fd.append('descripcion', descripcion);
  if (id) fd.append('id', id);

  try {
    let res;
    if (id) {
      res = await API.beneficiarios.tipos.update(id, fd);
    } else {
      res = await API.beneficiarios.tipos.create(fd);
    }

    if (res.success) {
      showToastAdmin(id ? 'Tipo de organización actualizado correctamente.' : 'Tipo de organización creado correctamente.');
      closeModal();
      loadTipos();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al guardar el tipo de organización.', 'error');
  }
}

function confirmarEliminarTipo(id, nombre, count) {
  let warningMsg = '';
  if (count > 0) {
    warningMsg = `
      <div style="background:rgba(220,38,38,0.1);border:1px solid var(--danger);border-radius:8px;padding:1rem;color:#FCA5A5;margin-bottom:1.5rem;font-size:0.875rem;line-height:1.4;">
        ⚠️ <strong>¡ADVERTENCIA CRÍTICA!</strong><br>
        Existen <strong>${count} organizaciones</strong> asociadas a este tipo. Si eliminas este tipo, <strong>todas esas organizaciones se eliminarán permanentemente en cascada</strong>. Los beneficiarios pertenecientes a esas organizaciones perderán su asociación (su organizacion_id se establecerá en NULL).
      </div>
    `;
  }

  showModal('Eliminar Tipo de Organización', `
    ${warningMsg}
    <p style="color:var(--white);font-size:0.95rem;margin-bottom:1rem">
      ¿Estás seguro de que deseas eliminar el tipo de organización <strong>"${nombre}"</strong>?
    </p>
    <p style="color:var(--gray-400);font-size:0.85rem">
      Esta acción no se puede deshacer.
    </p>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" style="background:var(--danger);border-color:var(--danger)" onclick="ejecutarEliminarTipo(${id})">Sí, Eliminar</button>
  `);
}

async function ejecutarEliminarTipo(id) {
  try {
    const res = await API.beneficiarios.tipos.delete(id);
    closeModal();
    if (res.success) {
      showToastAdmin('Tipo de organización eliminado correctamente.');
      loadTipos();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al eliminar el tipo de organización.', 'error');
  }
}

// ================================================================
// TIPOS DE POBLACIÓN (ENFOQUES)
// ================================================================

async function loadTiposPoblacion() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Beneficiarios', key: 'beneficiarios' },
    { label: 'Enfoques Poblacionales' }
  ]);

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">🌍 Enfoques Poblacionales</div>
        <div class="module-page-actions">
          <button class="btn btn-secondary btn-sm" onclick="renderBeneficiariosMenu()">↩️ Volver</button>
        </div>
      </div>
      <div class="table-card" style="max-width:800px; margin:0 auto;">
        <div class="table-toolbar">
          <h3 style="margin:0; font-size:1.1rem; color:var(--gray-700);">Registrar Nuevo Enfoque</h3>
        </div>
        <div style="padding:1.5rem; display:flex; gap:1rem; align-items:flex-end; border-bottom:1px solid var(--gray-200);">
          <div class="form-group" style="margin:0; flex:1">
            <label class="form-label">Nombre del Enfoque (Ej: Afrodescendiente, Indígena)</label>
            <input type="text" id="nuevo-poblacion-nombre" class="form-control" placeholder="Nombre...">
          </div>
          <button class="btn btn-primary" onclick="guardarTipoPoblacion()">💾 Guardar Enfoque</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre del Enfoque</th>
              <th>Organizaciones Asociadas</th>
              <th style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody id="poblacion-tbody">
            <tr><td colspan="3" style="text-align:center"><div class="spinner-inline"></div> Cargando...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  try {
    const res = await API.get('/beneficiarios/poblacion_tipos.php');
    const tbody = document.getElementById('poblacion-tbody');
    if (res.success) {
      if (res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--gray-500)">No hay enfoques registrados.</td></tr>';
      } else {
        tbody.innerHTML = res.data.map(t => `
          <tr>
            <td style="font-weight:bold">${t.nombre}</td>
            <td>${t.total_organizaciones} organizaciones</td>
            <td style="text-align:right">
              <button class="btn-icon" onclick="eliminarTipoPoblacion(${t.id})" title="Eliminar" style="color:var(--red-600)">🗑️</button>
            </td>
          </tr>
        `).join('');
      }
    } else {
      tbody.innerHTML = '<tr><td colspan="3" style="color:red;text-align:center">Error al cargar datos.</td></tr>';
    }
  } catch(e) {
    showToastAdmin('Error de conexión', 'error');
  }
}

window.guardarTipoPoblacion = async function() {
  const input = document.getElementById('nuevo-poblacion-nombre');
  const nombre = input.value.trim();
  if (!nombre) {
    showToastAdmin('El nombre es obligatorio.', 'error');
    return;
  }
  try {
    const res = await API.post('/beneficiarios/poblacion_tipos.php', { nombre });
    if (res.success) {
      showToastAdmin(res.message, 'success');
      loadTiposPoblacion();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch(e) {
    showToastAdmin('Error de red', 'error');
  }
};

window.eliminarTipoPoblacion = async function(id) {
  Swal.fire({
    title: '¿Eliminar enfoque?',
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
        const res = await API.post('/beneficiarios/poblacion_tipos.php', { action: 'delete', id });
        if (res.success) {
          showToastAdmin(res.message, 'success');
          loadTiposPoblacion();
        } else {
          showToastAdmin(res.message, 'error');
        }
      } catch(e) {
        showToastAdmin('Error al eliminar', 'error');
      }
    }
  });
};
