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
        <div class="module-card" onclick="loadOrganizaciones()">
          <div class="module-card-header">
            <div class="module-icon icon-config">🏢</div>
            <div><div class="module-name">Organizaciones</div><span class="badge badge-active">Activo</span></div>
          </div>
          <div class="module-desc">Registrar y gestionar organizaciones, representaciones legales y cupos.</div>
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

// ---- ORGANIZACIONES ----
async function loadOrganizaciones() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Beneficiarios', key: 'beneficiarios' },
    { label: 'Organizaciones' }
  ]);
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page">
      <div class="module-page-header">
        <div class="module-page-title">🏢 Gestión de Organizaciones</div>
        <div class="module-page-actions">
          <button class="btn btn-primary btn-sm" onclick="abrirModalOrganizacion()">➕ Agregar Organización</button>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('beneficiarios')">↩️ Volver</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-search">
            🔍 <input type="text" placeholder="Buscar por nombre, NIT o rep. legal..." id="search-orgs" oninput="filterOrganizaciones()">
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>NIT</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Rep. Legal</th>
                <th>Contacto</th>
                <th>Ubicación</th>
                <th>Beneficiarios (Cupo)</th>
                <th>Fecha Registro</th>
              </tr>
            </thead>
            <tbody id="orgs-tbody">
              <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-400)">
                <div class="spinner-inline"></div> Cargando organizaciones...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await API.beneficiarios.organizaciones.list();
    if (res.success) {
      window.allOrganizaciones = res.data;
      renderOrganizacionesTable(res.data);
    } else {
      document.getElementById('orgs-tbody').innerHTML = 
        `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--danger)">Error: ${res.message}</td></tr>`;
    }
  } catch (err) {
    document.getElementById('orgs-tbody').innerHTML = 
      `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--danger)">Error de conexión con el servidor.</td></tr>`;
  }
}

function renderOrganizacionesTable(data) {
  const tbody = document.getElementById('orgs-tbody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-400)">No se encontraron organizaciones.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(o => {
    const limit = parseInt(o.max_beneficiarios, 10);
    const actual = parseInt(o.total_beneficiarios_actual, 10) || 0;
    const cupoText = limit > 0 ? `${actual} / ${limit}` : `${actual} / Ilimitado`;
    const isFull = limit > 0 && actual >= limit;
    const cupoClass = isFull ? 'badge-no_aplica' : 'badge-aplica';

    return `
      <tr>
        <td><strong>${o.nit}</strong></td>
        <td><strong>${o.nombre}</strong></td>
        <td><span class="badge" style="background:var(--gray-800);border:1px solid var(--gray-700);color:var(--green-300)">${o.tipo_nombre || 'Sin Tipo'}</span></td>
        <td>${o.rep_legal || '–'}</td>
        <td style="font-size:.8rem;text-align:left;">
          📞 ${o.telefono || '–'}<br>
          📧 ${o.email || '–'}<br>
          📍 ${o.direccion || '–'}
        </td>
        <td style="font-size:.8rem">${o.municipio || '–'}, ${o.departamento || '–'}</td>
        <td><span class="badge ${cupoClass}">${cupoText}</span></td>
        <td style="font-size:.78rem;color:var(--gray-400)">${formatDate(o.created_at)}</td>
      </tr>
    `;
  }).join('');
}

function filterOrganizaciones() {
  const search = (document.getElementById('search-orgs')?.value || '').toLowerCase();
  let filtered = window.allOrganizaciones || [];
  if (search) {
    filtered = filtered.filter(o => 
      `${o.nombre} ${o.nit} ${o.rep_legal || ''} ${o.email || ''}`.toLowerCase().includes(search)
    );
  }
  renderOrganizacionesTable(filtered);
}

async function abrirModalOrganizacion() {
  try {
    const resTipos = await API.beneficiarios.tipos.list();
    if (!resTipos.success) {
      showToastAdmin('Error al cargar tipos de organización: ' + resTipos.message, 'error');
      return;
    }
    const tipos = resTipos.data;
    const tiposOpts = tipos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');

    showModal('Crear Nueva Organización', `
      <form id="form-crear-org" onsubmit="guardarOrganizacion(event)" style="display:flex;flex-direction:column;gap:1rem;text-align:left;">
        <div class="form-group">
          <label class="form-label" for="org-nit">NIT *</label>
          <input type="text" class="form-control" id="org-nit" required placeholder="800.123.456-7">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-nombre">Nombre de la Organización *</label>
          <input type="text" class="form-control" id="org-nombre" required placeholder="Asociación de Productores">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-tipo">Tipo de Organización *</label>
          <select class="form-control" id="org-tipo" required style="padding-left:1rem">
            <option value="">Seleccione un tipo...</option>
            ${tiposOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="org-rep">Representante Legal</label>
          <input type="text" class="form-control" id="org-rep" placeholder="Nombre completo">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-dir">Dirección</label>
          <input type="text" class="form-control" id="org-dir" placeholder="Dirección física">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-tel">Teléfono</label>
          <input type="text" class="form-control" id="org-tel" placeholder="Número de contacto">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-email">Correo Electrónico</label>
          <input type="email" class="form-control" id="org-email" placeholder="contacto@organizacion.org">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-dep">Departamento</label>
          <input type="text" class="form-control" id="org-dep" placeholder="Ej: Antioquia">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-mun">Municipio</label>
          <input type="text" class="form-control" id="org-mun" placeholder="Ej: Medellín">
        </div>
        <div class="form-group">
          <label class="form-label" for="org-max">Máximo de Beneficiarios *</label>
          <input type="number" class="form-control" id="org-max" value="50" min="0" required placeholder="0 para ilimitado">
          <small style="color:var(--gray-500);font-size:.75rem">Establece 0 si no hay límite de beneficiarios para esta entidad.</small>
        </div>
        <button type="submit" style="display:none;" id="btn-submit-org-hidden"></button>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="document.getElementById('btn-submit-org-hidden').click()">Guardar Organización</button>
    `);
  } catch (err) {
    showToastAdmin('Error al abrir formulario de organizaciones.', 'error');
  }
}

async function guardarOrganizacion(event) {
  event.preventDefault();

  const nit = document.getElementById('org-nit').value.trim();
  const nombre = document.getElementById('org-nombre').value.trim();
  const tipo_id = document.getElementById('org-tipo').value;
  const rep_legal = document.getElementById('org-rep').value.trim();
  const direccion = document.getElementById('org-dir').value.trim();
  const telefono = document.getElementById('org-tel').value.trim();
  const email = document.getElementById('org-email').value.trim();
  const departamento = document.getElementById('org-dep').value.trim();
  const municipio = document.getElementById('org-mun').value.trim();
  const max_beneficiarios = document.getElementById('org-max').value;

  if (!nit || !nombre || !tipo_id) {
    showToastAdmin('El NIT, Nombre y Tipo de Organización son obligatorios.', 'error');
    return;
  }

  const fd = new FormData();
  fd.append('nit', nit);
  fd.append('nombre', nombre);
  fd.append('tipo_id', tipo_id);
  fd.append('rep_legal', rep_legal);
  fd.append('direccion', direccion);
  fd.append('telefono', telefono);
  fd.append('email', email);
  fd.append('departamento', departamento);
  fd.append('municipio', municipio);
  fd.append('max_beneficiarios', max_beneficiarios);

  try {
    const res = await API.beneficiarios.organizaciones.create(fd);
    if (res.success) {
      showToastAdmin('Organización registrada correctamente.');
      closeModal();
      loadOrganizaciones();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al registrar la organización.', 'error');
  }
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

async function abrirModalBeneficiario() {
  try {
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
      const isFull = limit > 0 && actual >= limit;
      return `<option value="${o.id}" ${isFull ? 'disabled style="color:var(--gray-400);"' : ''}>${o.nombre} ${cupoText}</option>`;
    }).join('');

    const progsOpts = progs.map(p => 
      `<option value="${p.id}">${p.nombre}</option>`
    ).join('');

    showModal('Agregar Nuevo Beneficiario', `
      <form id="form-crear-benef" onsubmit="guardarBeneficiario(event)" style="display:flex;flex-direction:column;gap:1rem;text-align:left;">
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
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="TI">Tarjeta de Identidad (TI)</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-numdoc">Número Documento *</label>
            <input type="text" class="form-control" id="benef-numdoc" required placeholder="Número documento">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div class="form-group">
            <label class="form-label" for="benef-pnombre">Primer Nombre *</label>
            <input type="text" class="form-control" id="benef-pnombre" required placeholder="Primer nombre">
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-snombre">Segundo Nombre</label>
            <input type="text" class="form-control" id="benef-snombre" placeholder="Segundo nombre">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div class="form-group">
            <label class="form-label" for="benef-papellido">Primer Apellido *</label>
            <input type="text" class="form-control" id="benef-papellido" required placeholder="Primer apellido">
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-sapellido">Segundo Apellido</label>
            <input type="text" class="form-control" id="benef-sapellido" placeholder="Segundo apellido">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="benef-email">Correo Electrónico</label>
          <input type="email" class="form-control" id="benef-email" placeholder="beneficiario@correo.com">
        </div>
        <div class="form-group">
          <label class="form-label" for="benef-tel">Teléfono</label>
          <input type="text" class="form-control" id="benef-tel" placeholder="Número de teléfono">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div class="form-group">
            <label class="form-label" for="benef-dep">Departamento</label>
            <input type="text" class="form-control" id="benef-dep" placeholder="Departamento">
          </div>
          <div class="form-group">
            <label class="form-label" for="benef-mun">Municipio</label>
            <input type="text" class="form-control" id="benef-mun" placeholder="Municipio">
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
          <input type="checkbox" id="benef-activo" checked style="width:18px;height:18px;accent-color:var(--green-500)">
          <label for="benef-activo" style="cursor:pointer;font-size:.875rem">Beneficiario activo</label>
        </div>
        <button type="submit" style="display:none;" id="btn-submit-benef-hidden"></button>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="document.getElementById('btn-submit-benef-hidden').click()">Guardar Beneficiario</button>
    `);
  } catch (err) {
    showToastAdmin('Error al inicializar formulario de beneficiarios.', 'error');
  }
}

async function guardarBeneficiario(event) {
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

  if (!orgId || !tipoDoc || !numDoc || !pNombre || !pApellido) {
    showToastAdmin('Por favor complete todos los campos obligatorios.', 'error');
    return;
  }

  const fd = new FormData();
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

  try {
    const res = await API.beneficiarios.beneficiarios.create(fd);
    if (res.success) {
      showToastAdmin('Beneficiario registrado correctamente.');
      closeModal();
      loadBeneficiarios();
    } else {
      showToastAdmin(res.message, 'error');
    }
  } catch (err) {
    showToastAdmin('Error al registrar el beneficiario.', 'error');
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
