// ================================================================
//  MÓDULO: INFORMES DE INVENTARIOS
//  Lógica de exportación y modales para Órdenes, Movimientos y Consolidado
// ================================================================

// ==========================================
// 1. REPORTES DE MOVIMIENTOS
// ==========================================
window.abrirModalReporteInvMovimientos = async function(tipoFijo = '') {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDate = today.toISOString().split('T')[0];

    const [resItems] = await Promise.all([
      API.get('/inventario/items/list.php')
    ]);

    let itemsOptions = '';
    if (resItems.success) {
      itemsOptions = resItems.data.map(i => `<option value="${i.id}">${i.codigo ? i.codigo+' - ' : ''}${i.nombre}</option>`).join('');
    }

    let tipoOptions = '';
    if (tipoFijo) {
      tipoOptions = `<input type="hidden" id="rep-inv-mov-tipo" value="${tipoFijo}">
                     <div class="form-control" style="background:#f3f4f6" disabled>${tipoFijo.toUpperCase()}</div>`;
    } else {
      tipoOptions = `
        <select class="form-control" id="rep-inv-mov-tipo">
          <option value="">-- Todos los Movimientos --</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas / Consumos</option>
          <option value="ajuste">Ajustes</option>
        </select>
      `;
    }

    const html = `
      <form id="form-informe-inv-mov">
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Fecha Desde</label>
            <input type="date" class="form-control" id="rep-inv-mov-desde" value="${firstDay}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha Hasta</label>
            <input type="date" class="form-control" id="rep-inv-mov-hasta" value="${currentDate}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tipo de Movimiento</label>
          ${tipoOptions}
        </div>

        <div class="form-group">
          <label class="form-label">Filtrar por Ítem (Opcional)</label>
          <select class="form-control" id="rep-inv-mov-item">
            <option value="">-- Todos los Ítems --</option>
            ${itemsOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Formato de Exportación</label>
          <div style="display:flex; gap:1rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-inv-mov-formato" value="pdf" checked> 📄 PDF (Impresión)
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-inv-mov-formato" value="excel"> 📊 Excel (CSV)
            </label>
          </div>
        </div>

      </form>
    `;

    let titulo = 'Reporte de Movimientos de Inventario';
    if(tipoFijo === 'entrada') titulo = 'Reporte de Entradas a Almacén';
    if(tipoFijo === 'salida') titulo = 'Reporte de Salidas / Consumos';
    if(tipoFijo === 'ajuste') titulo = 'Reporte de Ajustes de Inventario';

    showModal(titulo, html, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn class="btn btn-primary" onclick="generarInformeInvMovimientos('${tipoFijo}')">Generar Reporte</button>
    `, true);

  } catch (err) {
    showToastAdmin('Error al cargar datos para el reporte', 'error');
  }
};

window.generarInformeInvMovimientos = async function(tipoFijo) {
  const form = document.getElementById('form-informe-inv-mov');
  if (form && !form.reportValidity()) return;

  const data = {
    desde: document.getElementById('rep-inv-mov-desde').value,
    hasta: document.getElementById('rep-inv-mov-hasta').value,
    tipo: document.getElementById('rep-inv-mov-tipo').value,
    item_id: document.getElementById('rep-inv-mov-item').value,
    formato: document.querySelector('input[name="rep-inv-mov-formato"]:checked').value
  };

  try {
    Swal.fire({ title: 'Generando Reporte...', text: 'Por favor espera', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const res = await API.get('/inventario/movimientos/list.php');
    if (!res.success) throw new Error();

    let list = res.data;

    // Filter by type
    if (data.tipo) {
      if (data.tipo === 'ajuste') {
        list = list.filter(m => m.tipo === 'ajuste_ingreso' || m.tipo === 'ajuste_egreso');
      } else {
        list = list.filter(m => m.tipo === data.tipo);
      }
    }

    // Filter by dates
    if (data.desde) list = list.filter(m => m.fecha >= data.desde);
    if (data.hasta) list = list.filter(m => m.fecha <= data.hasta);

    // Filter by item (need to check inside m.items array)
    if (data.item_id) {
      list = list.filter(m => m.items && m.items.some(i => i.item_id == data.item_id));
      // Optionally, we could filter the inner items array to ONLY show the requested item
      list = list.map(m => {
        return { ...m, items: m.items.filter(i => i.item_id == data.item_id) };
      });
    }

    Swal.close();
    closeModal();

    if (list.length === 0) {
      showToastAdmin('No hay movimientos en el rango seleccionado.', 'info');
      return;
    }

    if (data.formato === 'excel') {
      exportarInvMovimientosExcel(list, data.desde, data.hasta, data.tipo || 'Todos');
    } else {
      exportarInvMovimientosPDF(list, data.desde, data.hasta, data.tipo || 'Todos');
    }

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarInvMovimientosExcel(data, desde, hasta, tipoLabel) {
  let csvContent = "Fecha,Comprobante,Tipo,Tercero,Item,Cant,Costo Unit,Subtotal\n";
  
  data.forEach(m => {
    const tercero = `"${m.tercero_nombre || '-'}"`;
    m.items.forEach(i => {
      const itemNombre = `"${i.item_nombre}"`;
      const sub = i.cantidad * i.costo_unitario;
      csvContent += `${m.fecha},${m.comprobante_ref || m.id},${m.tipo},${tercero},${itemNombre},${i.cantidad},${i.costo_unitario},${sub}\n`;
    });
  });

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Movimientos_Inventario_${desde}_al_${hasta}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarInvMovimientosPDF(data, desde, hasta, tipoLabel) {
  let trs = '';
  let grantotalEntradas = 0;
  let grantotalSalidas = 0;

  data.forEach(m => {
    m.items.forEach((i, index) => {
      const sub = i.cantidad * i.costo_unitario;
      const fmtUnit = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(i.costo_unitario);
      const fmtSub = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sub);
      
      const isEntrada = (m.tipo === 'entrada' || m.tipo === 'ajuste_ingreso');
      if (isEntrada) grantotalEntradas += sub;
      else grantotalSalidas += sub;

      const colorTipo = isEntrada ? '#16a34a' : '#dc2626';

      trs += `
        <tr>
          ${index === 0 ? `<td rowspan="${m.items.length}">${m.fecha}</td>
                           <td rowspan="${m.items.length}">${m.comprobante_ref || m.id}</td>
                           <td rowspan="${m.items.length}" style="color:${colorTipo}">${m.tipo}</td>
                           <td rowspan="${m.items.length}">${m.tercero_nombre || '-'}</td>` : ''}
          <td>${i.item_nombre}</td>
          <td style="text-align:right">${i.cantidad}</td>
          <td style="text-align:right">${fmtUnit}</td>
          <td style="text-align:right">${fmtSub}</td>
        </tr>
      `;
    });
  });

  const html = `
    <html>
      <head>
        <title>Reporte de Movimientos de Inventario</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:8px; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #166534; padding-bottom: 5px; }
          .header h1 { color: #166534; margin: 0; font-size: 14px; }
          .header h2 { margin: 5px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8px; }
          th, td { border: 1px solid #ddd; padding: 3px; text-align: left; font-size: 8px; }
          th { background-color: #166534; color: white; font-weight: bold; }
          .totals { margin-top: 15px; width: 250px; float: right; border-collapse: collapse; }
          .totals th { background: #f3f4f6; color: #333; text-align: left; border: 1px solid #ddd; font-size: 8px; }
          .totals td { border: 1px solid #ddd; text-align: right; font-size: 8px; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UT COMEXAGRO</h1>
          <h2>Reporte de Movimientos de Inventario (${tipoLabel.toUpperCase()})</h2>
          <p><strong>Periodo:</strong> ${desde} al ${hasta}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Tipo</th>
              <th>Tercero/Origen</th>
              <th>Ítem</th>
              <th style="text-align:right">Cant.</th>
              <th style="text-align:right">Costo Unit.</th>
              <th style="text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${trs}
          </tbody>
        </table>
        
        <table class="totals">
          <tr><th>Total Entradas (Ingresos)</th><td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(grantotalEntradas)}</td></tr>
          <tr><th>Total Salidas (Egresos)</th><td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(grantotalSalidas)}</td></tr>
        </table>
        
        <script></script>
      </body>
    </html>
  `;
  printHTML(html);
}


// ==========================================
// 2. REPORTES DE ÓRDENES
// ==========================================
window.abrirModalReporteInvOrdenes = async function() {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const currentDate = today.toISOString().split('T')[0];

    const [resTerceros] = await Promise.all([
      API.get('/terceros/list.php')
    ]);

    let tercerosOptions = '';
    if (resTerceros.success) {
      tercerosOptions = resTerceros.data.map(t => `<option value="${t.id}">${t.numero_documento} - ${t.nombre_razon_social}</option>`).join('');
    }

    const html = `
      <form id="form-informe-inv-ord">
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Fecha Desde</label>
            <input type="date" class="form-control" id="rep-inv-ord-desde" value="${firstDay}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha Hasta</label>
            <input type="date" class="form-control" id="rep-inv-ord-hasta" value="${currentDate}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Filtrar por Proveedor (Opcional)</label>
          <select class="form-control" id="rep-inv-ord-tercero">
            <option value="">-- Todos los Proveedores --</option>
            ${tercerosOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Formato de Exportación</label>
          <div style="display:flex; gap:1rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-inv-ord-formato" value="pdf" checked> 📄 PDF (Impresión)
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-inv-ord-formato" value="excel"> 📊 Excel (CSV)
            </label>
          </div>
        </div>

      </form>
    `;

    showModal('Reporte de Órdenes de Compra', html, `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="generarInformeInvOrdenes()">Generar Reporte</button>
    `, true);

  } catch (err) {
    showToastAdmin('Error al cargar datos para el reporte', 'error');
  }
};

window.generarInformeInvOrdenes = async function() {
  const form = document.getElementById('form-informe-inv-ord');
  if (form && !form.reportValidity()) return;

  const data = {
    desde: document.getElementById('rep-inv-ord-desde').value,
    hasta: document.getElementById('rep-inv-ord-hasta').value,
    tercero_id: document.getElementById('rep-inv-ord-tercero').value,
    formato: document.querySelector('input[name="rep-inv-ord-formato"]:checked').value
  };

  try {
    Swal.fire({ title: 'Generando Reporte...', text: 'Por favor espera', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const res = await API.get('/inventario/ordenes/list.php');
    if (!res.success) throw new Error();

    let list = res.data;

    // Filters
    if (data.desde) list = list.filter(o => o.fecha >= data.desde);
    if (data.hasta) list = list.filter(o => o.fecha <= data.hasta);
    if (data.tercero_id) list = list.filter(o => o.tercero_id == data.tercero_id);

    Swal.close();
    closeModal();

    if (list.length === 0) {
      showToastAdmin('No hay órdenes de compra en el rango seleccionado.', 'info');
      return;
    }

    if (data.formato === 'excel') {
      exportarInvOrdenesExcel(list, data.desde, data.hasta);
    } else {
      exportarInvOrdenesPDF(list, data.desde, data.hasta);
    }

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarInvOrdenesExcel(data, desde, hasta) {
  let csvContent = "Fecha,No. Orden,Proveedor,Estado,Total ($)\n";
  
  data.forEach(o => {
    const tercero = `"${o.tercero_nombre || '-'}"`;
    csvContent += `${o.fecha},${o.numero},${tercero},${o.estado},${o.total}\n`;
  });

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Ordenes_Compra_${desde}_al_${hasta}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarInvOrdenesPDF(data, desde, hasta) {
  let trs = '';
  let granTotal = 0;

  data.forEach(o => {
    const fmtTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(o.total);
    granTotal += parseFloat(o.total);
    
    trs += `
      <tr>
        <td>${o.fecha}</td>
        <td><strong>${o.numero}</strong></td>
        <td>${o.tercero_nombre || '-'}</td>
        <td>${o.estado}</td>
        <td style="text-align:right">${fmtTotal}</td>
      </tr>
    `;
  });

  const html = `
    <html>
      <head>
        <title>Reporte de Órdenes de Compra</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:8px; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #9333ea; padding-bottom: 5px; }
          .header h1 { color: #9333ea; margin: 0; font-size: 14px; }
          .header h2 { margin: 5px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8px; }
          th, td { border: 1px solid #ddd; padding: 3px; text-align: left; font-size: 8px; }
          th { background-color: #9333ea; color: white; font-weight: bold; }
          .totals { font-weight: bold; background: #f3e8ff; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UT COMEXAGRO</h1>
          <h2>Reporte de Órdenes de Compra</h2>
          <p><strong>Periodo:</strong> ${desde} al ${hasta}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>No. Orden</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${trs}
            <tr class="totals">
              <td colspan="4" style="text-align:right">GRAN TOTAL</td>
              <td style="text-align:right">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(granTotal)}</td>
            </tr>
          </tbody>
        </table>
        <script></script>
      </body>
    </html>
  `;
  printHTML(html);
}


// ==========================================
// 3. INVENTARIO CONSOLIDADO Y TOMA FÍSICA
// ==========================================
window.abrirModalReporteInvConsolidado = function(esTomaFisica) {
  const titulo = esTomaFisica ? 'Generar Plantilla de Toma Física' : 'Generar Reporte de Inventario Consolidado';
  
  const html = `
    <form id="form-informe-inv-cons">
      <div style="margin-bottom: 1rem; color: var(--gray-600);">
        ${esTomaFisica 
          ? 'Este reporte generará un listado del catálogo sin las cantidades actuales ni los costos, ideal para imprimir y hacer conteo manual en bodega.'
          : 'Este reporte generará el listado completo de todos los ítems con su cantidad en stock actual y su valorización contable (Costo Promedio Ponderado).'}
      </div>
      
      <div class="form-group">
        <label class="form-label">Formato de Exportación</label>
        <div style="display:flex; gap:1rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-inv-cons-formato" value="pdf" checked> 📄 PDF (Impresión)
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-inv-cons-formato" value="excel"> 📊 Excel (CSV)
          </label>
        </div>
      </div>

    </form>
  `;

  showModal(titulo, html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformeInvConsolidado(${esTomaFisica})">Generar Documento</button>
  `, true);
};

window.generarInformeInvConsolidado = async function(esTomaFisica) {
  const form = document.getElementById('form-informe-inv-cons');
  if (form && !form.reportValidity()) return;

  const formato = document.querySelector('input[name="rep-inv-cons-formato"]:checked').value;

  try {
    Swal.fire({ title: 'Generando...', text: 'Obteniendo saldos actuales', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const res = await API.get('/inventario/items/list.php');
    if (!res.success) throw new Error();

    const list = res.data;

    Swal.close();
    closeModal();

    if (list.length === 0) {
      showToastAdmin('No hay ítems en el catálogo.', 'info');
      return;
    }

    if (formato === 'excel') {
      exportarInvConsolidadoExcel(list, esTomaFisica);
    } else {
      exportarInvConsolidadoPDF(list, esTomaFisica);
    }

  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarInvConsolidadoExcel(data, esTomaFisica) {
  let csvContent = "";
  
  if (esTomaFisica) {
    csvContent = "Codigo,Categoria,Ubicacion,Item,Unidad,Conteo Fisico\n";
    data.forEach(i => {
      const nom = `"${i.nombre}"`;
      csvContent += `${i.codigo},${i.categoria_nombre},${i.ubicacion},${nom},${i.unidad},\n`;
    });
  } else {
    csvContent = "Codigo,Categoria,Item,Stock Actual,Costo Prom,Valor Total\n";
    data.forEach(i => {
      const nom = `"${i.nombre}"`;
      const valTotal = parseFloat(i.cantidad) * parseFloat(i.costo_promedio || 0);
      csvContent += `${i.codigo},${i.categoria_nombre},${nom},${i.cantidad},${i.costo_promedio || 0},${valTotal}\n`;
    });
  }

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", esTomaFisica ? `Toma_Fisica_Inventario.csv` : `Inventario_Consolidado_Valorizado.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarInvConsolidadoPDF(data, esTomaFisica) {
  let trs = '';
  let granTotal = 0;
  
  const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit' });

  data.forEach(i => {
    if (esTomaFisica) {
      trs += `
        <tr>
          <td>${i.codigo || ''}</td>
          <td>${i.categoria_nombre || '-'}</td>
          <td>${i.ubicacion || '-'}</td>
          <td><strong>${i.nombre}</strong> <small>(${i.unidad || 'Und'})</small></td>
          <td style="width:100px;"></td>
        </tr>
      `;
    } else {
      const cpp = parseFloat(i.costo_promedio || 0);
      const cant = parseFloat(i.cantidad || 0);
      const valTotal = cpp * cant;
      granTotal += valTotal;

      const fmtCpp = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(cpp);
      const fmtTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valTotal);

      trs += `
        <tr>
          <td>${i.codigo || ''}</td>
          <td>${i.categoria_nombre || '-'}</td>
          <td><strong>${i.nombre}</strong></td>
          <td style="text-align:right">${cant}</td>
          <td style="text-align:right">${fmtCpp}</td>
          <td style="text-align:right">${fmtTotal}</td>
        </tr>
      `;
    }
  });

  const thead = esTomaFisica ? 
    `<tr><th>Código</th><th>Categoría</th><th>Ubicación</th><th>Ítem</th><th>Conteo Físico</th></tr>` :
    `<tr><th>Código</th><th>Categoría</th><th>Ítem</th><th style="text-align:right">Stock</th><th style="text-align:right">Costo Prom.</th><th style="text-align:right">Valor Total</th></tr>`;

  const titleStr = esTomaFisica ? 'Plantilla de Toma Física de Inventario' : 'Reporte de Inventario Consolidado Valorizado';
  const colorBase = esTomaFisica ? '#475569' : '#ea580c';

  const html = `
    <html>
      <head>
        <title>${titleStr}</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:8px; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid ${colorBase}; padding-bottom: 5px; }
          .header h1 { color: ${colorBase}; margin: 0; font-size: 14px; }
          .header h2 { margin: 5px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8px; }
          th, td { border: 1px solid #ddd; padding: 3px; text-align: left; font-size: 8px; }
          th { background-color: ${colorBase}; color: white; font-weight: bold; }
          .totals { font-weight: bold; background: #fff7ed; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UT COMEXAGRO</h1>
          <h2>${titleStr}</h2>
          <p><strong>Fecha de Generación:</strong> ${todayStr}</p>
        </div>
        <table>
          <thead>
            ${thead}
          </thead>
          <tbody>
            ${trs}
            ${!esTomaFisica ? `
              <tr class="totals">
                <td colspan="5" style="text-align:right">VALOR TOTAL DEL INVENTARIO</td>
                <td style="text-align:right; color:${colorBase}">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(granTotal)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        
        ${esTomaFisica ? `
          <div style="margin-top: 40px;">
            <p><strong>Firma Responsable Conteo:</strong> ____________________________________</p>
            <p><strong>Firma Auditoría:</strong> ____________________________________</p>
          </div>
        ` : ''}

        <script></script>
      </body>
    </html>
  `;
  printHTML(html);
}
