// ================================================================
//  MÓDULO: INFORMES DE ENCUESTAS
//  Lógica de graficación interactiva y exportación de respuestas
// ================================================================

let encuestasList = [];
let currentEncuestaData = null; // Holds questions & responses
let chartInstance = null;

// ==========================================
// 1. DASHBOARD INTERACTIVO DE GRÁFICAS
// ==========================================

window.renderInformeGraficaEncuesta = async function() {
  if (typeof updateBreadcrumb === 'function') {
    updateBreadcrumb([
      { label: '🏠', key: 'dashboard' },
      { label: 'Centro de Informes', key: 'informes' },
      { 
        label: 'Encuestas', 
        action: () => {
          navigateTo('informes');
          const checkTab = setInterval(() => {
            const tabs = document.querySelectorAll('.tab');
            const targetTab = Array.from(tabs).find(t => t.getAttribute('onclick') && t.getAttribute('onclick').includes('tab-encuestas'));
            if (targetTab) {
              clearInterval(checkTab);
              targetTab.click();
            }
          }, 50);
          setTimeout(() => clearInterval(checkTab), 2000);
        }
      },
      { label: 'Gráficas' }
    ]);
  }

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="module-page" style="background: #f4f6f8; min-height: calc(100vh - 60px);">
      <div class="module-page-header" style="background: linear-gradient(90deg, #2563eb, #3b82f6); color: white; border-radius: 8px 8px 0 0; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div class="module-page-title" style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <div style="background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #2563eb;">📊</div>
          GRÁFICAS DE ENCUESTAS
        </div>
        <div class="module-page-actions">
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('informes')" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4);">↩️ Volver a Reportes</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; padding: 1.5rem;">
        
        <!-- SIDEBAR: PARÁMETROS -->
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); align-self: start;">
          <h3 style="margin-top: 0; color: #2563eb; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
            ⚙️ Parámetros
          </h3>

          <div class="form-group">
            <label class="form-label" style="font-weight: 600; color: #475569;">1. Encuesta</label>
            <select id="sel-encuesta-grafica" class="form-control" onchange="cargarPreguntasEncuesta(this.value)">
              <option value="">Cargando encuestas...</option>
            </select>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" style="font-weight: 600; color: #475569;">2. Pregunta a Graficar</label>
            <select id="sel-pregunta-grafica" class="form-control" disabled onchange="if(this.value) generarGrafica()">
              <option value="">Seleccione una encuesta primero</option>
            </select>
          </div>

          <div class="form-group" style="margin-top: 1.5rem;">
            <label class="form-label" style="font-weight: 600; color: #475569;">3. Tipo de Gráfica</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <label style="border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 6px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <input type="radio" name="tipo_grafica" value="bar" checked style="display: none;">
                <span style="font-size: 1.5rem;">📊</span>
                <span style="font-size: 0.75rem; font-weight: 500;">Barras</span>
              </label>
              <label style="border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 6px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <input type="radio" name="tipo_grafica" value="pie" style="display: none;">
                <span style="font-size: 1.5rem;">🥧</span>
                <span style="font-size: 0.75rem; font-weight: 500;">Pastel</span>
              </label>
              <label style="border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 6px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <input type="radio" name="tipo_grafica" value="doughnut" style="display: none;">
                <span style="font-size: 1.5rem;">🍩</span>
                <span style="font-size: 0.75rem; font-weight: 500;">Dona</span>
              </label>
              <label style="border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 6px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <input type="radio" name="tipo_grafica" value="polarArea" style="display: none;">
                <span style="font-size: 1.5rem;">🎯</span>
                <span style="font-size: 0.75rem; font-weight: 500;">Polar</span>
              </label>
            </div>
          </div>

          <button class="btn btn-secondary" style="width: 100%; margin-top: 1.5rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem;" onclick="descargarGrafica()" id="btn-descargar-grafica" disabled>
            📥 Descargar Imagen
          </button>

          <div id="grafica-stats" style="margin-top: 1.5rem; background: linear-gradient(135deg, #4f46e5, #3b82f6); border-radius: 8px; padding: 1.5rem; color: white; text-align: center; display: none;">
            <div style="font-size: 2rem; font-weight: 800; line-height: 1;" id="stat-total-respuestas">0</div>
            <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.25rem;">registros graficados</div>
          </div>
        </div>

        <!-- MAIN AREA: RESULTADOS -->
        <div style="background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); min-height: 500px; display: flex; flex-direction: column;">
          
          <h2 id="titulo-grafica" style="margin-top: 0; color: #1e293b; font-size: 1.4rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            Resultados de la Encuesta
          </h2>

          <div id="grafica-container" style="flex: 1; min-height: 300px; position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="color: #94a3b8; font-size: 1.1rem; text-align: center;">
              ⬅️ Configure los parámetros y genere la gráfica para visualizar los datos.
            </div>
          </div>

          <div id="tabla-detalles-container" style="margin-top: 2rem; display: none;">
            <h4 style="margin: 0 0 1rem 0; color: #475569; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Detalle por Categoría</h4>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                  <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b;">
                    <th style="padding: 0.75rem 0.5rem; text-align: left;">Categoría</th>
                    <th style="padding: 0.75rem 0.5rem; text-align: right;">Cantidad</th>
                    <th style="padding: 0.75rem 0.5rem; text-align: right;">Porcentaje</th>
                  </tr>
                </thead>
                <tbody id="tbody-detalles-grafica">
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  // Estilizar radios seleccionados y auto-generar
  setTimeout(() => {
    const radios = document.querySelectorAll('input[name="tipo_grafica"]');
    radios.forEach(r => {
      r.addEventListener('change', function() {
        radios.forEach(rad => rad.parentElement.style.borderColor = '#e2e8f0');
        radios.forEach(rad => rad.parentElement.style.background = 'white');
        if (this.checked) {
          this.parentElement.style.borderColor = '#2563eb';
          this.parentElement.style.background = '#eff6ff';
          
          // Auto-generar gráfica si hay una pregunta seleccionada
          if (document.getElementById('sel-pregunta-grafica').value) {
            generarGrafica();
          }
        }
      });
      // trigger init
      if (r.checked) {
        r.parentElement.style.borderColor = '#2563eb';
        r.parentElement.style.background = '#eff6ff';
      }
    });

    cargarEncuestasListado();
  }, 100);
};

async function cargarEncuestasListado() {
  try {
    const res = await API.get('/encuestas/list.php');
    if (res.success) {
      encuestasList = res.data;
      const sel = document.getElementById('sel-encuesta-grafica');
      sel.innerHTML = '<option value="">-- Seleccione una Encuesta --</option>' + 
                      encuestasList.map(e => `<option value="${e.id}">${e.titulo}</option>`).join('');
    }
  } catch (e) {
    showToastAdmin('Error cargando encuestas', 'error');
  }
}

window.cargarPreguntasEncuesta = async function(encuestaId) {
  const selPregunta = document.getElementById('sel-pregunta-grafica');
  if (!encuestaId) {
    selPregunta.innerHTML = '<option value="">Seleccione una encuesta primero</option>';
    selPregunta.disabled = true;
    currentEncuestaData = null;
    return;
  }

  selPregunta.innerHTML = '<option value="">Cargando preguntas...</option>';
  selPregunta.disabled = true;

  try {
    const res = await API.get(`/encuestas/respuestas_export.php?id=${encuestaId}`);
    if (res.success) {
      currentEncuestaData = res.data;
      const preguntas = res.data.encuesta.preguntas || [];
      
      // Filtrar preguntas que tengan opciones (eso indica que son de seleccion unica/multiple y se pueden graficar)
      const graficables = preguntas.map((p, i) => ({...p, index: i})).filter(p => p.opciones && p.opciones.trim() !== '');

      if (graficables.length === 0) {
        selPregunta.innerHTML = '<option value="">La encuesta no tiene preguntas graficables</option>';
      } else {
        selPregunta.innerHTML = '<option value="">-- Seleccione Pregunta --</option>' + 
          graficables.map(p => `<option value="${p.index}">${p.texto}</option>`).join('');
        selPregunta.disabled = false;
      }
    }
  } catch (e) {
    selPregunta.innerHTML = '<option value="">Error cargando datos</option>';
  }
};

window.generarGrafica = function() {
  const preguntaId = document.getElementById('sel-pregunta-grafica').value;
  const tipoGrafica = document.querySelector('input[name="tipo_grafica"]:checked').value;

  if (!currentEncuestaData || !preguntaId) {
    showToastAdmin('Seleccione una encuesta y una pregunta.', 'warning');
    return;
  }

  // 1. Extraer la pregunta
  const preguntas = currentEncuestaData.encuesta.preguntas;
  const pregunta = preguntas[preguntaId]; // is the index
  if (!pregunta) return;

  // 2. Extraer opciones base para asegurar que todas salgan así tengan 0
  const labels = [];
  if (pregunta.opciones) {
    const separador = pregunta.opciones.includes(',') ? ',' : '\\n';
    pregunta.opciones.split(separador).forEach(opt => {
      const cleanOpt = opt.trim();
      if (cleanOpt) labels.push(cleanOpt);
    });
  }

  // 3. Contabilizar respuestas
  const conteos = {};
  labels.forEach(l => conteos[l] = 0); // Inicializar en 0
  
  let totalRespondido = 0;

  const respuestas = currentEncuestaData.respuestas;
  respuestas.forEach(r => {
    const val = r.respuestas[pregunta.texto];
    if (val) {
      // Puede ser array si es checkbox
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (conteos[v] === undefined) conteos[v] = 0;
          conteos[v]++;
          totalRespondido++;
        });
      } else {
        if (conteos[val] === undefined) conteos[val] = 0;
        conteos[val]++;
        totalRespondido++;
      }
    }
  });

  // Si alguien respondió algo que no estaba en las opciones, se agregó a conteos.
  const finalLabels = Object.keys(conteos);
  const finalData = finalLabels.map(l => conteos[l]);

  // Colores Vibrantes Modernos
  const palette = [
    '#6366f1', // Indigo
    '#f43f5e', // Rose
    '#38bdf8', // Light Blue
    '#a855f7', // Purple
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#ef4444'  // Red
  ];

  // 4. Renderizar Gráfica
  document.getElementById('titulo-grafica').innerText = pregunta.texto;
  document.getElementById('grafica-stats').style.display = 'block';
  document.getElementById('stat-total-respuestas').innerText = totalRespondido.toLocaleString();
  document.getElementById('btn-descargar-grafica').disabled = false;
  
  const container = document.getElementById('grafica-container');
  container.innerHTML = '<canvas id="canvas-grafica"></canvas>';
  const ctx = document.getElementById('canvas-grafica').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: tipoGrafica,
    data: {
      labels: finalLabels,
      datasets: [{
        label: 'Cantidad',
        data: finalData,
        backgroundColor: tipoGrafica === 'line' ? 'rgba(99, 102, 241, 0.2)' : palette,
        borderColor: tipoGrafica === 'line' ? '#6366f1' : 'white',
        borderWidth: 2,
        borderRadius: tipoGrafica === 'bar' ? 4 : 0,
        fill: tipoGrafica === 'line'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: tipoGrafica !== 'bar',
          position: 'bottom',
          labels: { font: { family: "'Helvetica', sans-serif" } }
        }
      },
      scales: {
        y: {
          display: tipoGrafica === 'bar' || tipoGrafica === 'line',
          beginAtZero: true,
          ticks: { precision: 0 }
        },
        x: {
          display: tipoGrafica === 'bar' || tipoGrafica === 'line'
        }
      }
    }
  });

  // 5. Renderizar Tabla de Detalles
  document.getElementById('tabla-detalles-container').style.display = 'block';
  const tbody = document.getElementById('tbody-detalles-grafica');
  let trs = '';
  
  // Sort descending by count
  const sortedPairs = finalLabels.map((l, i) => ({ label: l, val: finalData[i], color: palette[i % palette.length] }))
                                 .sort((a, b) => b.val - a.val);

  sortedPairs.forEach(item => {
    const pct = totalRespondido > 0 ? ((item.val / totalRespondido) * 100).toFixed(1) : 0;
    trs += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 0.75rem 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background-color: ${item.color};"></div>
          <strong>${item.label}</strong>
        </td>
        <td style="padding: 0.75rem 0.5rem; text-align: right; font-weight: 600;">${item.val.toLocaleString()}</td>
        <td style="padding: 0.75rem 0.5rem; text-align: right; color: #64748b;">${pct}%</td>
      </tr>
    `;
  });
  tbody.innerHTML = trs;
};

window.descargarGrafica = function() {
  const canvas = document.getElementById('canvas-grafica');
  if (canvas) {
    const link = document.createElement('a');
    link.download = 'grafica_encuesta.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
};


// ==========================================
// 2. LISTADO Y EXPORTACIÓN DE RESPUESTAS
// ==========================================

window.abrirModalListadoEncuestas = async function() {
  try {
    const res = await API.get('/encuestas/list.php');
    let options = '';
    if (res.success && res.data.length > 0) {
      options = res.data.map(e => `<option value="${e.id}">${e.titulo}</option>`).join('');
    } else {
      options = '<option value="">No hay encuestas registradas</option>';
    }

    const html = `
      <form id="form-informe-enc">
        
        <div class="form-group">
          <label class="form-label">Seleccione la Encuesta</label>
          <select class="form-control" id="rep-enc-id" required>
            <option value="">-- Seleccionar --</option>
            ${options}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Formato de Exportación</label>
          <div style="display:flex; gap:1rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-enc-formato" value="pdf" checked> 📄 PDF (Impresión)
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="radio" name="rep-enc-formato" value="excel"> 📊 Excel (CSV)
            </label>
          </div>
        </div>

      </form>
    `;

    showModal('Descargar Respuestas Completas', html, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="generarInformeRespuestasEncuesta()">Generar Reporte</button>
  `, true);

  } catch (err) {
    showToastAdmin('Error al cargar encuestas', 'error');
  }
};

window.generarInformeRespuestasEncuesta = async function() {
  const form = document.getElementById('form-informe-enc');
  if (form && !form.reportValidity()) return;

  const encId = document.getElementById('rep-enc-id').value;
  const formato = document.querySelector('input[name="rep-enc-formato"]:checked').value;

  if (!encId) return;

  try {
    const btn = document.getElementById('btn-submit-rep-encuestas');
    if (btn) btn.disabled = true;

    const res = await API.get(`/encuestas/respuestas_export.php?id=${encId}`);
    if (btn) btn.disabled = false;
    
    if (!res.success) throw new Error();

    if (res.data.respuestas.length === 0) {
      showToastAdmin('La encuesta aún no tiene respuestas.', 'info');
      return;
    }

    setTimeout(() => {
      if (formato === 'excel') exportarListadoEncuestaExcel(res.data);
      else exportarListadoEncuestaPDF(res.data);
    }, 150);
  } catch(e) {
    Swal.fire('Error', 'No se pudo generar el listado.', 'error');
  }
};

function exportarListadoEncuestaExcel(data) {
  const enc = data.encuesta;
  const respuestas = data.respuestas;
  const preguntasObj = enc.preguntas || [];
  
  // Headers
  let headers = ['Fecha', 'Identificacion', 'Nombres', 'Departamento', 'Municipio'];
  preguntasObj.forEach(p => headers.push(p.texto));
  
  let csvContent = headers.map(h => `"${h}"`).join(',') + "\n";

  respuestas.forEach(r => {
    let row = [
      `"${r.created_at}"`,
      `="${r.identificacion || ''}"`,
      `"${r.nombres || ''}"`,
      `"${r.departamento || ''}"`,
      `"${r.municipio || ''}"`
    ];
    
    preguntasObj.forEach(p => {
      let val = r.respuestas[p.texto];
      if (Array.isArray(val)) val = val.join(', ');
      val = val || '';
      row.push(`"${String(val).replace(/"/g, '""')}"`);
    });

    csvContent += row.join(',') + "\n";
  });

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Respuestas_${enc.titulo.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarListadoEncuestaPDF(data) {
  const enc = data.encuesta;
  const respuestas = data.respuestas;
  const preguntasObj = enc.preguntas || [];

  // Limit questions to fit in PDF horizontally (max 4-5)
  const maxPreguntasPDF = Math.min(preguntasObj.length, 5);
  const preguntasPDF = preguntasObj.slice(0, maxPreguntasPDF);

  let ths = `<th>Fecha</th><th>Usuario</th>`;
  preguntasPDF.forEach(p => ths += `<th>${p.texto.substring(0, 30)}...</th>`);

  let trs = '';
  respuestas.forEach(r => {
    let tdUser = r.identificacion ? `<strong>${r.nombres}</strong><br><span style="font-size:7px;color:#666">${r.identificacion}</span>` : 'Anónimo';
    trs += `<tr><td>${r.created_at.split(' ')[0]}</td><td>${tdUser}</td>`;
    
    preguntasPDF.forEach(p => {
      let val = r.respuestas[p.texto];
      if (Array.isArray(val)) val = val.join(', ');
      val = val || '-';
      trs += `<td>${String(val).substring(0, 40)}</td>`;
    });
    trs += `</tr>`;
  });

  const todayStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit' });
  const html = `
    <html>
      <head>
        <title>Listado de Respuestas - ${enc.titulo}</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 10px; color: #333; font-size:7px; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 14px; }
          .header h2 { margin: 5px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 7px; }
          th, td { border: 1px solid #ddd; padding: 3px; text-align: left; font-size: 7px; }
          th { background-color: #2563eb; color: white; font-weight: bold; }
          .disclaimer { font-size: 6px; color: #999; margin-top: 10px; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UT COMEXAGRO</h1>
          <h2>Respuestas de Encuesta: ${enc.titulo.toUpperCase()}</h2>
          <p><strong>Fecha de Generación:</strong> ${todayStr}</p>
        </div>
        <table>
          <thead><tr>${ths}</tr></thead>
          <tbody>${trs}</tbody>
        </table>
        ${preguntasObj.length > 5 ? '<div class="disclaimer">Nota: Debido a limitaciones de espacio, el PDF solo muestra las primeras 5 preguntas. Para ver la matriz completa, exporte en formato Excel (CSV).</div>' : ''}
        <script></script>
      </body>
    </html>
  `;
  printHTML(html);
}
