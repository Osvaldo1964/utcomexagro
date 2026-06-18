// ================================================================
//  MÓDULO: INFORMES DE BENEFICIARIOS
//  Lógica de exportación y modales para Tipos de Población, Enfoque (Tipos Org), Organizaciones y Beneficiarios
// ================================================================

// ==========================================
// 1. REPORTES: TIPOS DE POBLACIÓN
// ==========================================
window.abrirModalReporteBenTiposPoblacion = function() {
  const html = `
    <form id="form-informe-ben-pob" onsubmit="generarInformeBenTiposPoblacion(event)">
      <div class="form-group">
        <label class="form-label">Formato de Exportación</label>
        <div style="display:flex; gap:1rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-ben-pob-formato" value="pdf" checked> 📄 PDF (Impresión)
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-ben-pob-formato" value="excel"> 📊 Excel (CSV)
          </label>
        </div>
      </div>
      <button type="submit" id="btn-submit-rep-ben-pob" style="display:none"></button>
    </form>
  `;

  showModal('Reporte de Tipos de Población', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-rep-ben-pob').click()">Generar Reporte</button>
  `, true);
};

window.generarInformeBenTiposPoblacion = async function(event) {
  event.preventDefault();
  const formato = document.querySelector('input[name="rep-ben-pob-formato"]:checked').value;

  try {
    Swal.fire({ title: 'Generando Reporte...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const res = await API.get('/beneficiarios/poblacion_tipos.php');
    if (!res.success) throw new Error();

    Swal.close();
    closeModal();

    if (res.data.length === 0) {
      showToastAdmin('No hay tipos de población registrados.', 'info');
      return;
    }

    if (formato === 'excel') exportarBenTiposPoblacionExcel(res.data);
    else exportarBenTiposPoblacionPDF(res.data);
  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarBenTiposPoblacionExcel(data) {
  let csvContent = "ID,Nombre,Total Organizaciones Asociadas,Total Beneficiarios Activos\n";
  data.forEach(t => {
    csvContent += `${t.id},"${t.nombre}",${t.total_organizaciones || 0},${t.total_beneficiarios || 0}\n`;
  });
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Tipos_Poblacion.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarBenTiposPoblacionPDF(data) {
  let trs = '';
  let granTotalOrg = 0;
  let granTotalBen = 0;
  data.forEach(t => {
    granTotalOrg += parseInt(t.total_organizaciones || 0);
    granTotalBen += parseInt(t.total_beneficiarios || 0);
    trs += `
      <tr>
        <td>${t.id}</td>
        <td><strong>${t.nombre}</strong></td>
        <td style="text-align:right">${t.total_organizaciones || 0}</td>
        <td style="text-align:right">${t.total_beneficiarios || 0}</td>
      </tr>
    `;
  });

  generarPDFBase('Reporte de Tipos de Población', '#4f46e5', 
    `<tr><th>ID</th><th>Nombre del Tipo de Población</th><th style="text-align:right">Organizaciones Asociadas</th><th style="text-align:right">Beneficiarios Activos</th></tr>`,
    trs + `<tr><td colspan="2" style="text-align:right; font-weight:bold;">TOTALES</td><td style="text-align:right; font-weight:bold;">${granTotalOrg}</td><td style="text-align:right; font-weight:bold;">${granTotalBen}</td></tr>`
  );
}


// ==========================================
// 2. REPORTES: ENFOQUE POBLACIONAL (Tipos de Org)
// ==========================================
window.abrirModalReporteBenEnfoque = function() {
  const html = `
    <form id="form-informe-ben-enf" onsubmit="generarInformeBenEnfoque(event)">
      <div class="form-group">
        <label class="form-label">Formato de Exportación</label>
        <div style="display:flex; gap:1rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-ben-enf-formato" value="pdf" checked> 📄 PDF (Impresión)
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-ben-enf-formato" value="excel"> 📊 Excel (CSV)
          </label>
        </div>
      </div>
    </form>
  `;

  showModal('Reporte de Enfoque Poblacional (Tipos de Org.)', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformeBenEnfoque()">Generar Reporte</button>
  `, true);
};

window.generarInformeBenEnfoque = async function() {
  const form = document.getElementById('form-informe-ben-enf');
  if (form && !form.reportValidity()) return;
  const formato = document.querySelector('input[name="rep-ben-enf-formato"]:checked').value;

  try {
    Swal.fire({ title: 'Generando Reporte...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const res = await API.get('/beneficiarios/tipos.php');
    if (!res.success) throw new Error();

    Swal.close();
    closeModal();

    if (res.data.length === 0) {
      showToastAdmin('No hay enfoques/tipos de organización registrados.', 'info');
      return;
    }

    if (formato === 'excel') exportarBenEnfoqueExcel(res.data);
    else exportarBenEnfoquePDF(res.data);
  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarBenEnfoqueExcel(data) {
  let csvContent = "ID,Nombre,Descripcion,Total Organizaciones Asociadas,Total Beneficiarios Activos\n";
  data.forEach(t => {
    csvContent += `${t.id},"${t.nombre}","${t.descripcion || ''}",${t.total_organizaciones || 0},${t.total_beneficiarios || 0}\n`;
  });
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Enfoque_Poblacional.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarBenEnfoquePDF(data) {
  let trs = '';
  let granTotalOrg = 0;
  let granTotalBen = 0;
  data.forEach(t => {
    granTotalOrg += parseInt(t.total_organizaciones || 0);
    granTotalBen += parseInt(t.total_beneficiarios || 0);
    trs += `
      <tr>
        <td>${t.id}</td>
        <td><strong>${t.nombre}</strong></td>
        <td>${t.descripcion || '-'}</td>
        <td style="text-align:right">${t.total_organizaciones || 0}</td>
        <td style="text-align:right">${t.total_beneficiarios || 0}</td>
      </tr>
    `;
  });

  generarPDFBase('Reporte de Enfoque Poblacional (Tipos de Organización)', '#c026d3', 
    `<tr><th>ID</th><th>Enfoque / Tipo</th><th>Descripción</th><th style="text-align:right">Organizaciones Asociadas</th><th style="text-align:right">Beneficiarios Activos</th></tr>`,
    trs + `<tr><td colspan="3" style="text-align:right; font-weight:bold;">TOTALES</td><td style="text-align:right; font-weight:bold;">${granTotalOrg}</td><td style="text-align:right; font-weight:bold;">${granTotalBen}</td></tr>`
  );
}


// ==========================================
// 3. REPORTES: ORGANIZACIONES
// ==========================================
window.abrirModalReporteBenOrganizaciones = function() {
  const html = `
    <form id="form-informe-ben-org">
      <div class="form-group">
        <label class="form-label">Formato de Exportación</label>
        <div style="display:flex; gap:1rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-ben-org-formato" value="pdf" checked> 📄 PDF (Impresión)
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-ben-org-formato" value="excel"> 📊 Excel (CSV)
          </label>
        </div>
      </div>
    </form>
  `;

  showModal('Directorio de Organizaciones', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformeBenOrganizaciones()">Generar Reporte</button>
  `, true);
};

window.generarInformeBenOrganizaciones = async function() {
  const form = document.getElementById('form-informe-ben-org');
  if (form && !form.reportValidity()) return;
  const formato = document.querySelector('input[name="rep-ben-org-formato"]:checked').value;

  try {
    Swal.fire({ title: 'Generando Reporte...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const res = await API.get('/beneficiarios/organizaciones.php');
    if (!res.success) throw new Error();

    Swal.close();
    closeModal();

    if (res.data.length === 0) {
      showToastAdmin('No hay organizaciones registradas.', 'info');
      return;
    }

    if (formato === 'excel') exportarBenOrganizacionesExcel(res.data);
    else exportarBenOrganizacionesPDF(res.data);
  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarBenOrganizacionesExcel(data) {
  let csvContent = "NIT,Nombre,Municipio,Tipo Organizacion,Tipo Poblacion,Rep. Legal,Telefono,Email\n";
  data.forEach(o => {
    csvContent += `="${o.nit}","${o.nombre}","${o.municipio || ''}","${o.tipo_nombre || ''}","${o.poblacion_tipo_nombre || ''}","${o.rep_legal_nombre || ''}","${o.telefono || ''}","${o.email || ''}"\n`;
  });
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Directorio_Organizaciones.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarBenOrganizacionesPDF(data) {
  let trs = '';
  data.forEach(o => {
    trs += `
      <tr>
        <td>${o.nit}</td>
        <td><strong>${o.nombre}</strong><br><span style="font-size:7px; color:#6b7280">${o.municipio || ''}</span></td>
        <td>${o.tipo_nombre || '-'}</td>
        <td>${o.poblacion_tipo_nombre || '-'}</td>
        <td>${o.rep_legal_nombre || '-'}</td>
        <td>${o.telefono || '-'}</td>
      </tr>
    `;
  });

  generarPDFBase('Directorio General de Organizaciones', '#16a34a', 
    `<tr><th>NIT</th><th>Nombre y Ubicación</th><th>Enfoque (Tipo)</th><th>Población</th><th>Representante Legal</th><th>Teléfono</th></tr>`,
    trs
  );
}


// ==========================================
// 4. REPORTES: PADRÓN DE BENEFICIARIOS
// ==========================================
window.abrirModalReporteBenBeneficiarios = async function() {
  try {
    const [resOrgs] = await Promise.all([
      API.get('/organizaciones/list.php')
    ]);

    let orgsOptions = '';
    if (resOrgs.success) {
      orgsOptions = resOrgs.data.map(o => `<option value="${o.id}">${o.nit} - ${o.nombre}</option>`).join('');
    }

    const html = `
      <form id="form-informe-ben-padr">
        
        <div class="form-group">
          <label class="form-label">Filtrar por Organización (Opcional)</label>
          <select class="form-control" id="rep-ben-padr-org">
            <option value="">-- Todas las Organizaciones --</option>
            ${orgsOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" id="rep-ben-padr-estado">
            <option value="">-- Todos los Estados --</option>
            <option value="activo" selected>Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Formato de Exportación</label>
          <div style="display:flex; gap:1rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-ben-padr-formato" value="pdf" checked> 📄 PDF (Impresión)
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-ben-padr-formato" value="excel"> 📊 Excel (CSV)
            </label>
          </div>
        </div>

      </form>
    `;

    showModal('Padrón de Beneficiarios', html, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="generarInformeBenBeneficiarios()">Generar Reporte</button>
    `, true);

  } catch (err) {
    showToastAdmin('Error al cargar datos para el reporte', 'error');
  }
};

window.generarInformeBenBeneficiarios = async function() {
  const form = document.getElementById('form-informe-ben-padr');
  if (form && !form.reportValidity()) return;
  
  const org_id = document.getElementById('rep-ben-padr-org').value;
  const estado = document.getElementById('rep-ben-padr-estado').value;
  const formato = document.querySelector('input[name="rep-ben-padr-formato"]:checked').value;

  try {
    const btn = document.getElementById('btn-submit-ben-padr');
    if (btn) btn.disabled = true;

    const res = await API.get('/beneficiarios/beneficiarios.php');
    if (btn) btn.disabled = false;
    
    if (!res.success) throw new Error();

    let list = res.data;

    // Filters
    if (org_id) list = list.filter(b => b.organizacion_id == org_id);
    if (estado) list = list.filter(b => b.estado === estado);

    if (list.length === 0) {
      showToastAdmin('No hay beneficiarios que coincidan con los filtros.', 'info');
      return;
    }

    setTimeout(() => {
      if (formato === 'excel') exportarBenBeneficiariosExcel(list);
      else exportarBenBeneficiariosPDF(list);
    }, 150);
  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarBenBeneficiariosExcel(data) {
  // Sort data by organization name
  data.sort((a, b) => {
    const orgA = (a.organizacion_nombre || 'Sin Organización').toLowerCase();
    const orgB = (b.organizacion_nombre || 'Sin Organización').toLowerCase();
    if (orgA < orgB) return -1;
    if (orgA > orgB) return 1;
    return 0;
  });

  let csvContent = "Organizacion,No.,Documento,Nombres,Apellidos,Estado,Municipio,Telefono,Programa\n";
  let currentOrg = null;
  let counter = 1;

  data.forEach(b => {
    const org = b.organizacion_nombre || 'Sin Organización';
    if (currentOrg !== org) {
      currentOrg = org;
      counter = 1;
    }
    const nom = `"${b.p_nombre} ${b.s_nombre || ''}"`;
    const ape = `"${b.p_apellido} ${b.s_apellido || ''}"`;
    csvContent += `"${org}",${counter},="${b.num_doc}",${nom},${ape},${b.estado},"${b.municipio || ''}","${b.telefono || ''}","${b.programa_nombre || ''}"\n`;
    counter++;
  });
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Padron_Beneficiarios.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarBenBeneficiariosPDF(data) {
  // Group by Organization
  const grupos = {};
  data.forEach(b => {
    const org = b.organizacion_nombre || 'Sin Organización';
    if (!grupos[org]) grupos[org] = [];
    grupos[org].push(b);
  });

  // Sort organization names alphabetically
  const orgNames = Object.keys(grupos).sort((a, b) => a.localeCompare(b));

  let trs = '';
  let granTotal = 0;

  orgNames.forEach(org => {
    const beneficiarios = grupos[org];
    granTotal += beneficiarios.length;

    // Header row for the organization
    trs += `
      <tr style="background-color: #fff7ed;">
        <td colspan="6" style="font-size: 10px; padding: 6px;">
          <strong style="color: #ea580c;">🏢 ORGANIZACIÓN: ${org.toUpperCase()}</strong>
        </td>
      </tr>
    `;

    // Beneficiaries rows
    beneficiarios.forEach((b, index) => {
      const colorEstado = b.estado === 'inactivo' ? '#dc2626' : '#16a34a';
      trs += `
        <tr>
          <td style="text-align:center; width: 30px;">${index + 1}</td>
          <td>${b.tipo_doc} ${b.num_doc}</td>
          <td><strong>${b.p_nombre} ${b.s_nombre || ''} ${b.p_apellido} ${b.s_apellido || ''}</strong></td>
          <td>${b.municipio || '-'}</td>
          <td style="color:${colorEstado}">${b.estado}</td>
          <td>${b.telefono || '-'}</td>
        </tr>
      `;
    });

    // Subtotal row for the organization
    trs += `
      <tr>
        <td colspan="6" style="text-align:right; font-weight:bold; background-color: #fafaf9; border-bottom: 2px solid #ea580c;">
          Subtotal Beneficiarios (${org}): ${beneficiarios.length}
        </td>
      </tr>
    `;
  });

  // Gran Total Row
  trs += `
    <tr>
      <td colspan="6" style="text-align:right; font-size: 11px; font-weight:bold; background-color: #fed7aa; color: #9a3412; padding: 6px;">
        GRAN TOTAL DE BENEFICIARIOS: ${granTotal}
      </td>
    </tr>
  `;

  generarPDFBase('Padrón Oficial de Beneficiarios', '#ea580c', 
    `<tr><th style="width: 30px; text-align:center;">No.</th><th>Documento</th><th>Nombre Completo</th><th>Municipio</th><th>Estado</th><th>Teléfono</th></tr>`,
    trs
  );
}

// ==========================================
// FUNCIÓN UTILITARIA (Plantilla Base PDF)
// ==========================================
function generarPDFBase(titulo, colorBase, theadHtml, tbodyHtml) {
  const windowTitle = titulo.replace(/<[^>]*>?/gm, '');
  const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit' });
  const html = `
    <html>
      <head>
        <title>${windowTitle}</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:8px; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid ${colorBase}; padding-bottom: 5px; }
          .header h1 { color: ${colorBase}; margin: 0; font-size: 14px; }
          .header h2 { margin: 5px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8px; }
          th, td { border: 1px solid #ddd; padding: 3px; text-align: left; font-size: 8px; }
          th { background-color: ${colorBase}; color: white; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UT COMEXAGRO</h1>
          <h2>${titulo}</h2>
          <p><strong>Fecha de Generación:</strong> ${todayStr}</p>
        </div>
        <table>
          <thead>${theadHtml}</thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
        <script></script>
      </body>
    </html>
  `;
  printHTML(html);
}
