// ================================================================
//  MÓDULO: INFORMES DE CONTRATACIÓN
//  admin/js/modules/informes_contratacion.js
// ================================================================

// ==========================================
// 1. REPORTE DE CARGOS
// ==========================================
window.abrirModalReporteContratacionCargos = function() {
  const html = `
    <form id="form-informe-con-cargos">
      <div style="margin-bottom: 1rem; color: var(--gray-600);">
        Este reporte genera el listado de todos los cargos estructurados en la plataforma, junto con sus perfiles requeridos.
      </div>
    </form>
  `;

  showModal('Catálogo de Cargos', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformeContratacionCargos()">Generar Reporte</button>
  `, true);
};

window.generarInformeContratacionCargos = async function() {
  try {
    Swal.fire({ title: 'Generando Reporte...', text: 'Obteniendo cargos', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const res = await API.get('/cargos/list.php');
    if (!res.success) throw new Error();

    const list = res.data;
    Swal.close();
    closeModal();

    if (!list || list.length === 0) {
      showToastAdmin('No hay cargos registrados.', 'info');
      return;
    }

    let trs = '';
    list.forEach((c) => {
      const activoHtml = c.activo == 1 ? '<span style="color:#16a34a">Activo</span>' : '<span style="color:#dc2626">Inactivo</span>';
      trs += `
        <tr>
          <td><strong>${c.nombre}</strong></td>
          <td>${c.descripcion || '-'}</td>
          <td>${c.perfil_requerido || '-'}</td>
          <td>${activoHtml}</td>
        </tr>
      `;
    });

    const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
      <html>
        <head>
          <title>Catálogo de Cargos</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:10px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
            .header h1 { color: #2563eb; margin: 0; font-size: 16px; }
            .header h2 { margin: 5px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
            th, td { border: 1px solid #ddd; padding: 5px; text-align: left; vertical-align: top; }
            th { background-color: #2563eb; color: white; font-weight: bold; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UT COMEXAGRO</h1>
            <h2>Catálogo de Cargos y Perfiles</h2>
            <p><strong>Fecha de Generación:</strong> ${todayStr}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:20%">Cargo</th>
                <th style="width:35%">Descripción</th>
                <th style="width:35%">Perfil Requerido</th>
                <th style="width:10%">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${trs}
            </tbody>
          </table>
          <script></script>
        </body>
      </html>
    `;
    printHTML(html);

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

// ==========================================
// 2. REPORTE DE EMPLEADOS
// ==========================================
window.abrirModalReporteContratacionEmpleados = function() {
  const html = `
    <form id="form-informe-con-emp">
      <div style="margin-bottom: 1rem; color: var(--gray-600);">
        Genera el listado completo de empleados activos agrupados y ordenados por su cargo asignado.
      </div>
    </form>
  `;

  showModal('Listado de Empleados', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformeContratacionEmpleados()">Generar Reporte</button>
  `, true);
};

window.generarInformeContratacionEmpleados = async function() {
  try {
    Swal.fire({ title: 'Generando Reporte...', text: 'Obteniendo personal', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const res = await API.get('/empleados/list.php');
    if (!res.success) throw new Error();

    const list = res.data;
    Swal.close();
    closeModal();

    if (!list || list.length === 0) {
      showToastAdmin('No hay empleados contratados registrados.', 'info');
      return;
    }

    // Agrupar por cargo
    const porCargo = {};
    list.forEach(e => {
      const c = e.cargo || 'Sin Cargo Asignado';
      if (!porCargo[c]) porCargo[c] = [];
      porCargo[c].push(e);
    });

    let trs = '';
    let totalEmpleados = 0;

    for (const cargo in porCargo) {
      trs += `<tr><td colspan="7" style="background:#f1f5f9; font-weight:bold; font-size:10px; color:#1e293b;">${cargo} (${porCargo[cargo].length} empleados)</td></tr>`;
      
      porCargo[cargo].forEach(e => {
        totalEmpleados++;
        trs += `
          <tr>
            <td>${e.nombres} ${e.apellidos}</td>
            <td>${e.tipo_doc} ${e.num_doc}</td>
            <td>${e.telefono || '-'}</td>
            <td>${e.email || '-'}</td>
            <td>${e.municipio || '-'}</td>
            <td>${e.fecha_inicio || '-'}</td>
            <td><span style="color:#16a34a">${e.estado_contrato || 'Vigente'}</span></td>
          </tr>
        `;
      });
    }

    const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
      <html>
        <head>
          <title>Listado de Empleados</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:9px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #16a34a; padding-bottom: 5px; }
            .header h1 { color: #16a34a; margin: 0; font-size: 16px; }
            .header h2 { margin: 5px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #16a34a; color: white; font-weight: bold; }
            .totals { font-weight: bold; margin-top: 10px; font-size: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UT COMEXAGRO</h1>
            <h2>Directorio de Personal Contratado</h2>
            <p><strong>Fecha de Generación:</strong> ${todayStr}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Municipio</th>
                <th>Fecha Inicio</th>
                <th>Estado Contrato</th>
              </tr>
            </thead>
            <tbody>
              ${trs}
            </tbody>
          </table>
          <div class="totals">Total Empleados Activos: ${totalEmpleados}</div>
          <script></script>
        </body>
      </html>
    `;
    printHTML(html);

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

// ==========================================
// 3. REPORTE DE NÓMINA (SÁBANA)
// ==========================================
window.abrirModalReporteContratacionNomina = function() {
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  const mesActualStr = `${year}-${month.toString().padStart(2, '0')}`;

  const html = `
    <form id="form-informe-con-nom">
      <div style="margin-bottom: 1rem; color: var(--gray-600);">
        Genera la sábana de nómina pre-llenada con el salario base de cada empleado para el mes seleccionado.
      </div>
      <div class="form-group">
        <label class="form-label">Periodo de Nómina (Mes/Año)</label>
        <input type="month" class="form-control" id="rep-nom-periodo" value="${mesActualStr}" required>
      </div>
    </form>
  `;

  showModal('Impresión de Nómina', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformeContratacionNomina()">Generar Reporte</button>
  `, true);
};

window.generarInformeContratacionNomina = async function() {
  const form = document.getElementById('form-informe-con-nom');
  if (form && !form.reportValidity()) return;

  const periodo = document.getElementById('rep-nom-periodo').value;

  try {
    Swal.fire({ title: 'Generando Nómina...', text: 'Calculando salarios base', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const res = await API.get('/empleados/list.php');
    if (!res.success) throw new Error();

    const list = res.data;
    Swal.close();
    closeModal();

    if (!list || list.length === 0) {
      showToastAdmin('No hay empleados registrados para la nómina.', 'info');
      return;
    }

    let trs = '';
    let totalSalarios = 0;

    list.forEach(e => {
      const salarioBase = parseFloat(e.salario || 0);
      totalSalarios += salarioBase;
      const fmtSalario = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(salarioBase);

      trs += `
        <tr>
          <td><strong>${e.nombres} ${e.apellidos}</strong><br><span style="color:#64748b;font-size:7px">${e.tipo_doc} ${e.num_doc}</span></td>
          <td>${e.cargo || '-'}</td>
          <td style="text-align:center">30</td>
          <td style="text-align:right">${fmtSalario}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td style="text-align:right"><strong>${fmtSalario}</strong></td>
          <td></td>
        </tr>
      `;
    });

    const fmtTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalSalarios);

    const html = `
      <html>
        <head>
          <title>Sábana de Nómina</title>
          <style>
            @page { size: landscape; }
            body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:9px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #d97706; padding-bottom: 5px; }
            .header h1 { color: #d97706; margin: 0; font-size: 16px; }
            .header h2 { margin: 5px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; vertical-align: middle; }
            th { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align:center; }
            .totals { background: #fffbeb; font-weight:bold; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UT COMEXAGRO</h1>
            <h2>Planilla de Liquidación de Nómina - Periodo: ${periodo}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:15%">Empleado</th>
                <th style="width:12%">Cargo</th>
                <th style="width:4%">Días Lab.</th>
                <th style="width:9%">Salario Base</th>
                <th style="width:9%">Otros Devengos</th>
                <th style="width:9%">Total Devengado</th>
                <th style="width:9%">Salud / Pensión</th>
                <th style="width:9%">Otras Deduc.</th>
                <th style="width:9%">Neto a Pagar</th>
                <th style="width:15%">Firma de Recibido</th>
              </tr>
            </thead>
            <tbody>
              ${trs}
              <tr class="totals">
                <td colspan="3" style="text-align:right"><strong>TOTALES NÓMINA BASE:</strong></td>
                <td style="text-align:right">${fmtTotal}</td>
                <td colspan="6"></td>
              </tr>
            </tbody>
          </table>
          <script></script>
        </body>
      </html>
    `;
    printHTML(html);

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar la nómina.', 'error');
  }
};
