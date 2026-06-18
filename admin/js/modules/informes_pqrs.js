// ================================================================
//  MÓDULO: INFORMES DE PQRS
//  Lógica para exportación de listados de Peticiones, Quejas, etc.
// ================================================================

window.abrirModalReportePQRS = function() {
  const today = new Date();
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  const todayStr = today.toISOString().split('T')[0];
  const last30Str = last30.toISOString().split('T')[0];

  const html = `
    <form id="form-informe-pqrs">
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Fecha Desde</label>
          <input type="date" id="rep-pqrs-desde" class="form-control" value="${last30Str}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Hasta</label>
          <input type="date" id="rep-pqrs-hasta" class="form-control" value="${todayStr}" required>
        </div>
      </div>

      <div class="form-group" style="margin-top:1rem;">
        <label class="form-label">Estado de la PQR</label>
        <select id="rep-pqrs-estado" class="form-control">
          <option value="todos">Todos los estados</option>
          <option value="recibido">Recibido (Sin atender)</option>
          <option value="en_proceso">En Proceso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>

      <div class="form-group" style="margin-top:1rem;">
        <label class="form-label">Formato de Exportación</label>
        <div style="display:flex; gap:1rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-pqrs-formato" value="pdf" checked> 📄 PDF (Impresión)
          </label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="radio" name="rep-pqrs-formato" value="excel"> 📊 Excel (CSV)
          </label>
        </div>
      </div>

    </form>
  `;

  showModal('Generar Reporte de PQRS', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformePQRS()">Descargar Listado</button>
  `, true);
};

window.generarInformePQRS = async function() {
  const form = document.getElementById('form-informe-pqrs');
  if (form && !form.reportValidity()) return;
  
  const desde = document.getElementById('rep-pqrs-desde').value;
  const hasta = document.getElementById('rep-pqrs-hasta').value;
  const estado = document.getElementById('rep-pqrs-estado').value;
  const formato = document.querySelector('input[name="rep-pqrs-formato"]:checked').value;

  try {
    Swal.fire({ title: 'Generando informe...', text: 'Por favor espera', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    
    const res = await API.get('/pqrs/list.php');
    if (!res.success) throw new Error();

    let data = res.data;

    data = data.filter(p => {
      const pDate = p.created_at.split(' ')[0];
      return pDate >= desde && pDate <= hasta;
    });

    if (estado !== 'todos') {
      data = data.filter(p => p.estado === estado);
    }
    
    Swal.close();
    closeModal();

    if (data.length === 0) {
      showToastAdmin('No hay registros de PQRS en ese rango y estado.', 'info');
      return;
    }

    if (formato === 'excel') {
      exportarPQRSExcel(data, desde, hasta, estado);
    } else {
      exportarPQRSPDF(data, desde, hasta, estado);
    }
  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
  }
};

function exportarPQRSExcel(data, desde, hasta, estado) {
  let csvContent = "Radicado,Tipo,Fecha Registro,Nombre,Documento,Telefono,Email,Estado,Fecha Gestion\n";
  data.forEach(p => {
    csvContent += `="${p.radicado}","${p.tipo}","${p.created_at}","${p.nombre || ''}","="${p.documento || ''}"","${p.telefono || ''}","${p.email || ''}","${p.estado}","${p.fecha_gestion || ''}"\n`;
  });
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Reporte_PQRS_${desde}_al_${hasta}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarPQRSPDF(data, desde, hasta, estado) {
  const estadoLabel = estado === 'todos' ? 'Todos los estados' : estado.toUpperCase();
  const subtitulo = `Del ${desde} al ${hasta} | Estado: ${estadoLabel}`;

  let trs = '';
  data.forEach(p => {
    let colorEstado = '#9ca3af';
    if (p.estado === 'recibido') colorEstado = '#f59e0b';
    else if (p.estado === 'en_proceso') colorEstado = '#3b82f6';
    else if (p.estado === 'resuelto') colorEstado = '#10b981';
    else if (p.estado === 'cerrado') colorEstado = '#64748b';

    trs += `
      <tr>
        <td style="font-weight:bold;">${p.radicado}</td>
        <td>${p.tipo}</td>
        <td>${p.created_at.split(' ')[0]}</td>
        <td>${p.nombre}</td>
        <td>${p.documento || '-'}</td>
        <td style="color:${colorEstado}; font-weight:bold; text-transform:uppercase;">${p.estado.replace('_', ' ')}</td>
      </tr>
    `;
  });

  generarPDFBase(`Listado de PQRS<br><span style="font-size:10px;color:#666">${subtitulo}</span>`, '#f59e0b', 
    `<tr><th>Radicado</th><th>Tipo</th><th>Fecha Registro</th><th>Solicitante</th><th>Documento</th><th>Estado</th></tr>`,
    trs
  );
}
