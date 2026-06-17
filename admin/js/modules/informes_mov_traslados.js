// ================================================================
//  MÓDULO: INFORMES DE MOVIMIENTOS Y TRASLADOS
//  Lógica de exportación y modales
// ================================================================

window.abrirModalReporteMovimientos = async function() {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDate = today.toISOString().split('T')[0];

    const [resTree, resTerceros] = await Promise.all([
      API.get('/presupuesto/tree.php'),
      API.get('/terceros/list.php')
    ]);

    let ramasOptions = '';
    if (resTree.success) {
      const buildOpts = (nodes, level = 0) => {
        nodes.forEach(n => {
          const prefix = '&nbsp;&nbsp;'.repeat(level);
          ramasOptions += `<option value="${n.id}">${prefix}${n.codigo} - ${n.nombre}</option>`;
          if (n.children) buildOpts(n.children, level + 1);
        });
      };
      buildOpts(resTree.data);
    }

    let tercerosOptions = '';
    if (resTerceros.success) {
      tercerosOptions = resTerceros.data.map(t => `<option value="${t.id}">${t.numero_documento} - ${t.nombre_razon_social}</option>`).join('');
    }

    const html = `
      <form id="form-informe-movimientos" onsubmit="generarInformeMovimientos(event)">
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Fecha Desde</label>
            <input type="date" class="form-control" id="rep-mov-desde" value="${firstDay}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha Hasta</label>
            <input type="date" class="form-control" id="rep-mov-hasta" value="${currentDate}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tipo de Operación</label>
          <select class="form-control" id="rep-mov-tipo">
            <option value="">-- Todos (Ingresos y Egresos) --</option>
            <option value="Egreso">Solo Egresos (Salidas)</option>
            <option value="Ingreso">Solo Ingresos (Reintegros)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Filtrar por Tercero (Opcional)</label>
          <select class="form-control" id="rep-mov-tercero">
            <option value="">-- Todos los Terceros --</option>
            ${tercerosOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Filtrar por Rama / Rubro (Opcional)</label>
          <select class="form-control" id="rep-mov-rubro">
            <option value="">-- Todo el Presupuesto --</option>
            ${ramasOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Formato de Exportación</label>
          <div style="display:flex; gap:1rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-mov-formato" value="pdf" checked> 📄 PDF (Para imprimir)
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-mov-formato" value="excel"> 📊 Excel (CSV)
            </label>
          </div>
        </div>

        <button type="submit" id="btn-submit-rep-mov-hidden" style="display:none"></button>
      </form>
    `;

    showModal('Reporte de Movimientos Presupuestales', html, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="document.getElementById('btn-submit-rep-mov-hidden').click()">Generar Reporte</button>
    `, true);

  } catch (err) {
    showToastAdmin('Error al cargar datos para el reporte', 'error');
  }
};

window.generarInformeMovimientos = async function(event) {
  event.preventDefault();

  const data = {
    desde: document.getElementById('rep-mov-desde').value,
    hasta: document.getElementById('rep-mov-hasta').value,
    tipo: document.getElementById('rep-mov-tipo').value,
    tercero_id: document.getElementById('rep-mov-tercero').value,
    rubro_id: document.getElementById('rep-mov-rubro').value,
    formato: document.querySelector('input[name="rep-mov-formato"]:checked').value
  };

  try {
    Swal.fire({ title: 'Generando Reporte...', text: 'Por favor espera', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    // Fetch the data. We'll reuse movimientos_list.php, but it doesn't currently filter by date natively, 
    // so we can fetch all and filter in JS, OR better yet, send filters to API if supported.
    // Since we don't have server-side filtering written, we'll do it in JS for simplicity and speed.
    const res = await API.get('/presupuesto/movimientos_list.php');
    if (!res.success) throw new Error();

    let list = res.data.filter(m => m.tipo === 'Egreso' || m.tipo === 'Ingreso');

    // Apply filters
    if (data.desde) list = list.filter(m => m.fecha >= data.desde);
    if (data.hasta) list = list.filter(m => m.fecha <= data.hasta);
    if (data.tipo) list = list.filter(m => m.tipo === data.tipo);
    if (data.tercero_id) list = list.filter(m => m.tercero_id == data.tercero_id);
    
    // Si filtran por rubro, sería ideal filtrar también por descendencia.
    // Para simplificar, filtraremos por coincidencia exacta si es nivel 4.
    if (data.rubro_id) {
      list = list.filter(m => m.rubro_id == data.rubro_id);
    }

    Swal.close();
    closeModal();

    if (list.length === 0) {
      showToastAdmin('No hay movimientos en el rango/filtros seleccionados.', 'info');
      return;
    }

    if (data.formato === 'excel') {
      exportarMovimientosExcel(list, data.desde, data.hasta);
    } else {
      exportarMovimientosPDF(list, data.desde, data.hasta);
    }

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarMovimientosExcel(data, desde, hasta) {
  let csvContent = "Fecha,Comprobante,Tipo,Rubro Afectado,Tercero,Detalle,Valor ($)\n";
  
  data.forEach(m => {
    const rubro = `"${m.rubro_codigo} - ${m.rubro_nombre}"`;
    const tercero = `"${m.tercero_nombre}"`;
    const detalle = `"${m.detalle.replace(/"/g, '""')}"`;
    csvContent += `${m.fecha},${m.comprobante},${m.tipo},${rubro},${tercero},${detalle},${m.valor}\n`;
  });

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Movimientos_${desde}_al_${hasta}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarMovimientosPDF(data, desde, hasta) {
  let trs = '';
  let total = 0;
  data.forEach(m => {
    const fmtValor = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m.valor);
    if (m.tipo === 'Egreso') total -= parseFloat(m.valor);
    if (m.tipo === 'Ingreso') total += parseFloat(m.valor);
    
    const color = m.tipo === 'Egreso' ? '#dc2626' : '#16a34a';

    trs += `
      <tr>
        <td>${m.fecha}</td>
        <td>${m.comprobante}</td>
        <td style="color:${color}">${m.tipo}</td>
        <td>${m.rubro_codigo} - ${m.rubro_nombre}</td>
        <td>${m.tercero_nombre}</td>
        <td>${m.detalle}</td>
        <td style="text-align:right">${fmtValor}</td>
      </tr>
    `;
  });

  const fmtTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total);

  const html = `
    <html>
      <head>
        <title>Reporte de Movimientos</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #166534; padding-bottom: 10px; }
          .header h1 { color: #166534; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #166534; color: white; }
          .total-row td { font-weight: bold; background-color: #f0fdf4; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UT COMEXAGRO</h1>
          <h2>Reporte de Movimientos Presupuestales</h2>
          <p><strong>Periodo:</strong> ${desde} al ${hasta}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Tipo</th>
              <th>Rubro</th>
              <th>Tercero</th>
              <th>Detalle</th>
              <th style="text-align:right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${trs}
            <tr class="total-row">
              <td colspan="6" style="text-align:right">BALANCE NETO (Ingresos - Egresos)</td>
              <td style="text-align:right; color: ${total < 0 ? '#dc2626' : '#16a34a'}">${fmtTotal}</td>
            </tr>
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}


// ================================================================
//  REPORTES: TRASLADOS
// ================================================================

window.abrirModalReporteTraslados = async function() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const currentDate = today.toISOString().split('T')[0];

  const html = `
    <form id="form-informe-traslados" onsubmit="generarInformeTraslados(event)">
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Fecha Desde</label>
          <input type="date" class="form-control" id="rep-tra-desde" value="${firstDay}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Hasta</label>
          <input type="date" class="form-control" id="rep-tra-hasta" value="${currentDate}" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Formato de Exportación</label>
        <div style="display:flex; gap:1rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-tra-formato" value="pdf" checked> 📄 PDF (Para imprimir)
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-tra-formato" value="excel"> 📊 Excel (CSV)
          </label>
        </div>
      </div>

      <button type="submit" id="btn-submit-rep-tra-hidden" style="display:none"></button>
    </form>
  `;

  showModal('Reporte de Traslados Realizados', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="document.getElementById('btn-submit-rep-tra-hidden').click()">Generar Reporte</button>
  `, true);
};

window.generarInformeTraslados = async function(event) {
  event.preventDefault();

  const data = {
    desde: document.getElementById('rep-tra-desde').value,
    hasta: document.getElementById('rep-tra-hasta').value,
    formato: document.querySelector('input[name="rep-tra-formato"]:checked').value
  };

  try {
    Swal.fire({ title: 'Generando Reporte...', text: 'Por favor espera', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const res = await API.get('/presupuesto/traslados_list.php');
    if (!res.success) throw new Error();

    let list = res.data;

    // Apply filters
    if (data.desde) list = list.filter(m => m.fecha >= data.desde);
    if (data.hasta) list = list.filter(m => m.fecha <= data.hasta);

    Swal.close();
    closeModal();

    if (list.length === 0) {
      showToastAdmin('No hay traslados en el rango seleccionado.', 'info');
      return;
    }

    if (data.formato === 'excel') {
      exportarTrasladosExcel(list, data.desde, data.hasta);
    } else {
      exportarTrasladosPDF(list, data.desde, data.hasta);
    }

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarTrasladosExcel(data, desde, hasta) {
  let csvContent = "Fecha,Comprobante,Origen (Cede),Destino (Recibe),Motivo,Valor ($)\n";
  
  data.forEach(t => {
    const origen = `"${t.origen || ''}"`;
    const destino = `"${t.destino || ''}"`;
    const detalle = `"${t.detalle.replace(/"/g, '""')}"`;
    csvContent += `${t.fecha},${t.comprobante},${origen},${destino},${detalle},${t.valor}\n`;
  });

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Traslados_${desde}_al_${hasta}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarTrasladosPDF(data, desde, hasta) {
  let trs = '';
  data.forEach(t => {
    const fmtValor = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(t.valor);
    trs += `
      <tr>
        <td>${t.fecha}</td>
        <td>${t.comprobante}</td>
        <td style="color:#dc2626">${t.origen}</td>
        <td style="color:#16a34a">${t.destino}</td>
        <td>${t.detalle}</td>
        <td style="text-align:right">${fmtValor}</td>
      </tr>
    `;
  });

  const html = `
    <html>
      <head>
        <title>Reporte de Traslados</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0369a1; padding-bottom: 10px; }
          .header h1 { color: #0369a1; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #0369a1; color: white; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UT COMEXAGRO</h1>
          <h2>Reporte de Traslados Presupuestales Internos</h2>
          <p><strong>Periodo:</strong> ${desde} al ${hasta}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Origen (Cede)</th>
              <th>Destino (Recibe)</th>
              <th>Motivo</th>
              <th style="text-align:right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${trs}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
