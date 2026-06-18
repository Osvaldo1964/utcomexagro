// ================================================================
//  MÓDULO: INFORMES (CENTRAL DE REPORTES)
//  admin/js/modules/informes.js
// ================================================================

function renderInformes() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Informes Centralizados', key: 'informes' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  const user = Auth.getUser();

  const reportModules = MODULES.filter(m => 
    m.key !== 'dashboard' && 
    m.key !== 'configuracion' && 
    m.key !== 'informes' && 
    m.section !== 'hidden' &&
    canSeeModule(m, user)
  );

  setTimeout(() => {
    if (reportModules.length === 0) {
      content.innerHTML = `
        <div class="module-page">
          <div class="module-page-header">
            <div class="module-page-title">📊 Hub de Informes</div>
          </div>
          <div style="padding: 3rem; text-align: center; color: var(--gray-500);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🚫</div>
            No tienes acceso a ningún módulo para visualizar reportes.
          </div>
        </div>
      `;
      return;
    }

    const tabsHtml = reportModules.map((mod, index) => `
      <div class="tab ${index === 0 ? 'active' : ''}" onclick="switchTab(this, 'tab-${mod.key}')" style="display:flex; align-items:center; gap:0.5rem">
        <span>${mod.icon}</span> ${mod.label}
      </div>
    `).join('');

    const tabContentsHtml = reportModules.map((mod, index) => {
      let innerContent = '';
      if (mod.key === 'presupuesto') {
        innerContent = `
          <div class="modules-grid" style="margin-top: 1rem;">
            <div class="module-card" onclick="abrirModalReportePresupuesto()">
              <div class="module-card-header">
                <div class="module-icon icon-budget">📜</div>
                <div>
                  <div class="module-name">Presupuesto Oficial</div>
                  <span class="badge badge-active">Principal</span>
                </div>
              </div>
              <div class="module-desc">Genera el árbol presupuestal (total o parcial) con niveles de agrupamiento. Exportable a PDF y Excel.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteMovimientos()">
              <div class="module-card-header">
                <div class="module-icon icon-budget">💸</div>
                <div>
                  <div class="module-name">Movimientos y Ejecución</div>
                  <span class="badge badge-active">Ejecución</span>
                </div>
              </div>
              <div class="module-desc">Audita los ingresos y egresos diarios. Filtra por fechas, terceros y rubros afectados. Exportable a Excel y PDF.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteTraslados()">
              <div class="module-card-header">
                <div class="module-icon icon-training">🔁</div>
                <div>
                  <div class="module-name">Historial de Traslados</div>
                  <span class="badge badge-active">Auditoría</span>
                </div>
              </div>
              <div class="module-desc">Audita los movimientos internos de dinero entre rubros sin afectar el presupuesto oficial. Exportable a Excel y PDF.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>
          </div>
        `;
      } else if (mod.key === 'inventarios') {
        innerContent = `
          <div class="modules-grid" style="margin-top: 1rem;">
            
            <div class="module-card" onclick="abrirModalReporteInvMovimientos('')">
              <div class="module-card-header">
                <div class="module-icon" style="background:#e0f2fe;color:#0284c7">🔄</div>
                <div>
                  <div class="module-name">Listado de Movimientos</div>
                  <span class="badge" style="background:#e0f2fe;color:#0284c7">General</span>
                </div>
              </div>
              <div class="module-desc">Todos los movimientos del inventario con filtros de fechas, ítems y tipo de operación.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteInvOrdenes()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#f3e8ff;color:#9333ea">🛒</div>
                <div>
                  <div class="module-name">Listado de Órdenes</div>
                  <span class="badge" style="background:#f3e8ff;color:#9333ea">Compras</span>
                </div>
              </div>
              <div class="module-desc">Órdenes de compra generadas, con filtros de fechas y proveedores.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteInvMovimientos('entrada')">
              <div class="module-card-header">
                <div class="module-icon" style="background:#dcfce7;color:#16a34a">📥</div>
                <div>
                  <div class="module-name">Entradas al Almacén</div>
                  <span class="badge" style="background:#dcfce7;color:#16a34a">Ingresos</span>
                </div>
              </div>
              <div class="module-desc">Historial exclusivo de compras, remisiones y ajustes de ingreso al almacén.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteInvMovimientos('salida')">
              <div class="module-card-header">
                <div class="module-icon" style="background:#fee2e2;color:#dc2626">📤</div>
                <div>
                  <div class="module-name">Salidas y Consumos</div>
                  <span class="badge" style="background:#fee2e2;color:#dc2626">Egresos</span>
                </div>
              </div>
              <div class="module-desc">Historial exclusivo de mercancía entregada a empleados, proyectos o salidas por baja.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteInvMovimientos('ajuste')">
              <div class="module-card-header">
                <div class="module-icon" style="background:#fef9c3;color:#ca8a04">⚖️</div>
                <div>
                  <div class="module-name">Ajustes de Inventario</div>
                  <span class="badge" style="background:#fef9c3;color:#ca8a04">Auditoría</span>
                </div>
              </div>
              <div class="module-desc">Historial de correcciones manuales hechas al stock del sistema.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteInvConsolidado(false)">
              <div class="module-card-header">
                <div class="module-icon" style="background:#ffedd5;color:#ea580c">📦</div>
                <div>
                  <div class="module-name">Inventario Consolidado</div>
                  <span class="badge" style="background:#ffedd5;color:#ea580c">Valorizado</span>
                </div>
              </div>
              <div class="module-desc">Saldos actuales de todos los ítems valorizados a su Costo Promedio Ponderado.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteInvConsolidado(true)">
              <div class="module-card-header">
                <div class="module-icon" style="background:#f1f5f9;color:#475569">📝</div>
                <div>
                  <div class="module-name">Informe para Toma Física</div>
                  <span class="badge" style="background:#f1f5f9;color:#475569">Conteo</span>
                </div>
              </div>
              <div class="module-desc">Plantilla del catálogo sin cantidades ni costos, lista para conteo manual en bodega.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

          </div>
        `;
      } else if (mod.key === 'beneficiarios') {
        innerContent = `
          <div class="modules-grid" style="margin-top: 1rem;">
            
            <div class="module-card" onclick="abrirModalReporteBenTiposPoblacion()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#e0e7ff;color:#4f46e5">👥</div>
                <div>
                  <div class="module-name">Tipos de Población</div>
                  <span class="badge" style="background:#e0e7ff;color:#4f46e5">Clasificación</span>
                </div>
              </div>
              <div class="module-desc">Catálogo de los tipos de población (ej. Campesina, Indígena) y conteo de organizaciones asociadas.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteBenEnfoque()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#fae8ff;color:#c026d3">🎯</div>
                <div>
                  <div class="module-name">Enfoque Poblacional</div>
                  <span class="badge" style="background:#fae8ff;color:#c026d3">Tipos Org.</span>
                </div>
              </div>
              <div class="module-desc">Tipos de organizaciones productivas (Acuícola, Agrícola, etc.) y cuántas agrupaciones existen en cada rama.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteBenOrganizaciones()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#dcfce7;color:#16a34a">🏢</div>
                <div>
                  <div class="module-name">Directorio Organizaciones</div>
                  <span class="badge" style="background:#dcfce7;color:#16a34a">Asociaciones</span>
                </div>
              </div>
              <div class="module-desc">Listado detallado de todas las organizaciones, sus representantes legales y datos de contacto.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteBenBeneficiarios()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#ffedd5;color:#ea580c">🧑‍🌾</div>
                <div>
                  <div class="module-name">Padrón de Beneficiarios</div>
                  <span class="badge" style="background:#ffedd5;color:#ea580c">Personas</span>
                </div>
              </div>
              <div class="module-desc">Listado completo de todas las personas registradas, con la opción de filtrar por organización específica.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

          </div>
        `;
      } else if (mod.key === 'encuestas') {
        innerContent = `
          <div class="modules-grid" style="margin-top: 1rem;">
            
            <div class="module-card" onclick="renderInformeGraficaEncuesta()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#dbeafe;color:#2563eb">📊</div>
                <div>
                  <div class="module-name">Graficar Datos</div>
                  <span class="badge" style="background:#dbeafe;color:#2563eb">Interactivo</span>
                </div>
              </div>
              <div class="module-desc">Genera gráficas dinámicas de cualquier pregunta para analizar tendencias.</div>
              <div class="module-card-footer">
                <span class="module-link">Abrir Dashboard <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalListadoEncuestas()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#e0e7ff;color:#4f46e5">📋</div>
                <div>
                  <div class="module-name">Listado de Respuestas</div>
                  <span class="badge" style="background:#e0e7ff;color:#4f46e5">Exportación</span>
                </div>
              </div>
              <div class="module-desc">Tabula todas las respuestas de una encuesta en una matriz de datos para Excel o PDF.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

          </div>
        `;
      } else if (mod.key === 'pqrs') {
        innerContent = `
          <div class="modules-grid" style="margin-top: 1rem;">
            <div class="module-card" onclick="abrirModalReportePQRS()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#fef3c7;color:#d97706">🗣️</div>
                <div>
                  <div class="module-name">Listado de PQRS</div>
                  <span class="badge" style="background:#fef3c7;color:#d97706">Atención</span>
                </div>
              </div>
              <div class="module-desc">Genera un reporte con las peticiones, quejas y reclamos registrados. Filtra por rango de fechas y estado actual de atención.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>
          </div>
        `;
      } else if (mod.key === 'contratacion') {
        innerContent = `
          <div class="modules-grid" style="margin-top: 1rem;">
            
            <div class="module-card" onclick="abrirModalReporteContratacionCargos()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#dbeafe;color:#2563eb">📇</div>
                <div>
                  <div class="module-name">Catálogo de Cargos</div>
                  <span class="badge" style="background:#dbeafe;color:#2563eb">Referencia</span>
                </div>
              </div>
              <div class="module-desc">Listado maestro de los cargos disponibles en la UT, sus perfiles requeridos y descripciones.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteContratacionEmpleados()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#dcfce7;color:#16a34a">🧑‍💼</div>
                <div>
                  <div class="module-name">Listado de Empleados</div>
                  <span class="badge" style="background:#dcfce7;color:#16a34a">Activos</span>
                </div>
              </div>
              <div class="module-desc">Directorio de personal contratado, organizado por cargo, con fechas de inicio e información de contacto.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

            <div class="module-card" onclick="abrirModalReporteContratacionNomina()">
              <div class="module-card-header">
                <div class="module-icon" style="background:#fef3c7;color:#d97706">💵</div>
                <div>
                  <div class="module-name">Impresión de Nómina</div>
                  <span class="badge" style="background:#fef3c7;color:#d97706">Financiero</span>
                </div>
              </div>
              <div class="module-desc">Sábana de pago detallada por empleado, con salarios base y espacios para devengados/deducciones.</div>
              <div class="module-card-footer">
                <span class="module-link">Generar Reporte <span class="module-link-arrow">›</span></span>
              </div>
            </div>

          </div>
        `;
      } else {
        innerContent = `
          <div style="text-align: center; padding: 4rem 2rem; background: var(--gray-50); border-radius: 8px; border: 1px dashed var(--gray-300);">
            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">${mod.icon}</div>
            <h3 style="color: var(--gray-700); margin-bottom: 0.5rem;">Reportes de ${mod.label}</h3>
            <p style="color: var(--gray-500); max-width: 400px; margin: 0 auto;">
              En esta sección se diseñarán e incluirán los gráficos y exportaciones correspondientes al módulo de ${mod.label}.
            </p>
          </div>
        `;
      }

      return `
        <div id="tab-${mod.key}" class="tab-content ${index === 0 ? 'active' : ''}" style="padding: 2rem; flex-direction: column;">
          ${innerContent}
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="module-page" style="height: 100%; display: flex; flex-direction: column;">
        <div class="module-page-header">
          <div class="module-page-title">📊 Hub de Informes Centralizados</div>
        </div>
        
        <div class="tabs-container" style="margin: 0; padding: 0 1.5rem; background: white; border-bottom: 1px solid var(--gray-200);">
          ${tabsHtml}
        </div>
        
        <div style="flex: 1; background: white; overflow-y: auto;">
          ${tabContentsHtml}
        </div>
      </div>
    `;
  }, 200);
}

// ================================================================
// REPORTE: PRESUPUESTO OFICIAL
// ================================================================

window.abrirModalReportePresupuesto = async function() {
  showModal('Cargando...', '<div style="text-align:center">Obteniendo datos del presupuesto...</div>', '', false);
  
  try {
    const [resTree, resOrgs] = await Promise.all([
      API.get('/presupuesto/tree.php'),
      API.get('/organizaciones/list.php')
    ]);
    
    if (!resTree.success) throw new Error();
    
    window.informesTree = resTree.data;
    window.informesOrgs = resOrgs.data || [];

    // Construir opciones de ramas (Nivel 1 y 2) para el filtro
    let ramasOptions = '<option value="">-- Todo el Presupuesto --</option>';
    const buildOptions = (nodes, prefix = '') => {
      nodes.forEach(n => {
        if (n.nivel <= 2) {
          ramasOptions += `<option value="${n.id}">${prefix}${n.codigo} - ${n.nombre}</option>`;
          if (n.children && n.children.length > 0) {
            buildOptions(n.children, prefix + '&nbsp;&nbsp;&nbsp;&nbsp;');
          }
        }
      });
    };
    buildOptions(window.informesTree);

    const orgsOptions = '<option value="">-- Todas --</option>' + 
      window.informesOrgs.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('');

    const html = `
      <form id="form-repo-presupuesto" onsubmit="event.preventDefault(); generarReportePresupuesto()">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div class="form-group">
            <label class="form-label">Nivel de Detalle</label>
            <select class="form-control" id="rep-nivel" required>
              <option value="4">Hasta Nivel 4 (Todo el detalle)</option>
              <option value="3">Hasta Nivel 3</option>
              <option value="2">Hasta Nivel 2</option>
              <option value="1">Solo Nivel 1 (Resumen general)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Filtrar por Rama Específica</label>
            <select class="form-control" id="rep-rama">
              ${ramasOptions}
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Organización Ejecutora</label>
          <select class="form-control" id="rep-org">
            ${orgsOptions}
          </select>
        </div>

        <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin-top:1rem;">
          <input type="checkbox" id="rep-ocultar-ceros" checked style="width:1.2rem; height:1.2rem;">
          <label for="rep-ocultar-ceros" style="margin:0; color:var(--gray-700)">Ocultar rubros con valor $0</label>
        </div>

        <div style="margin-top:2rem; display:flex; gap:1rem; justify-content:flex-end;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="button" class="btn" style="background:#10b981; color:white; border:none;" onclick="generarReportePresupuesto('excel')">Descargar Excel</button>
          <button type="button" class="btn" style="background:#ef4444; color:white; border:none;" onclick="generarReportePresupuesto('pdf')">Exportar PDF</button>
        </div>
      </form>
    `;

    showModal('📜 Reporte: Presupuesto Oficial', html, '', false);

  } catch(e) {
    closeModal();
    showToastAdmin('Error al cargar datos del presupuesto.', 'error');
  }
};

window.generarReportePresupuesto = function(formato) {
  const maxNivel = parseInt(document.getElementById('rep-nivel').value);
  const ramaId = document.getElementById('rep-rama').value;
  const orgId = document.getElementById('rep-org').value;
  const ocultarCeros = document.getElementById('rep-ocultar-ceros').checked;

  // Filtrado
  let data = [];
  
  // 1. Encontrar rama si aplica
  if (ramaId) {
    const node = findNodeDeep(window.informesTree, ramaId);
    if (node) data = [node];
  } else {
    data = window.informesTree;
  }

  // 2. Aplanar el árbol aplicando maxNivel, ocultarCeros y orgId
  let flatData = [];
  const flatten = (nodes) => {
    nodes.forEach(n => {
      // Si ocultar ceros está activo y su total es 0
      if (ocultarCeros && parseFloat(n.valor_total) === 0) return;
      
      // Si excede el nivel requerido
      if (n.nivel > maxNivel) return;

      // Si hay filtro de organización, solo afecta si somos hoja (nivel 4) y no coincide. 
      // Para agrupadores los dejamos si sus hijos pasan. (Implementación básica: omitimos la hoja si no coincide).
      if (orgId && n.nivel == 4 && n.organizacion_id != orgId) return;

      // Pero si somos agrupador y hay filtro de Org, ¿qué pasa?
      // Idealmente, el agrupador debería recalcular su suma ignorando los que no son de esa Org.
      // Para simplificar, en la primera versión mostramos el agrupador con el valor total intacto,
      // o clonamos y recalculamos. Aquí haremos la exportación tal cual, asumiendo que el filtro Org 
      // filtra visualmente las hojas.
      
      flatData.push(n);

      if (n.children && n.children.length > 0) {
        flatten(n.children);
      }
    });
  };
  flatten(data);

  if (flatData.length === 0) {
    showToastAdmin('No hay datos con estos filtros.', 'info');
    return;
  }

  if (formato === 'excel') {
    exportToExcel(flatData);
  } else if (formato === 'pdf') {
    exportToPDF(flatData);
  }
  
  closeModal();
};

function findNodeDeep(tree, id) {
  for (let n of tree) {
    if (n.id == id) return n;
    if (n.children) {
      let found = findNodeDeep(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function exportToExcel(flatData) {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Código,Nombre,Nivel,Organización,Valor Asignado,Valor Ejecutado\n";

  flatData.forEach(r => {
    const org = r.organizacion_nombre ? r.organizacion_nombre.replace(/,/g, '') : '';
    const name = r.nombre.replace(/,/g, '');
    csvContent += `"${r.codigo}","${name}",${r.nivel},"${org}",${r.valor_total},${r.valor_ejecutado}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "Presupuesto_Oficial.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF(flatData) {
  let html = `
    <html>
    <head>
      <title>Presupuesto Oficial - UT COMEXAGRO</title>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #166534; padding-bottom: 10px; }
        .header h1 { color: #166534; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #166534; color: white; }
        .nivel-1 { font-weight: bold; background-color: #f0fdf4; }
        .nivel-2 { font-weight: bold; background-color: #f8fafc; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>UT COMEXAGRO</h1>
        <h3>Reporte Oficial de Presupuesto</h3>
        <p>Fecha de Generación: ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre del Rubro</th>
            <th>Organización</th>
            <th class="text-right">Total Asignado ($)</th>
            <th class="text-right">Total Ejecutado ($)</th>
          </tr>
        </thead>
        <tbody>
  `;

  flatData.forEach(r => {
    const fmtTotal = new Intl.NumberFormat('es-CO').format(r.valor_total);
    const fmtEjec = new Intl.NumberFormat('es-CO').format(r.valor_ejecutado);
    const cls = 'nivel-' + r.nivel;
    const padding = (r.nivel - 1) * 20;

    html += `
      <tr class="${r.nivel <= 2 ? cls : ''}">
        <td>${r.codigo}</td>
        <td style="padding-left: ${padding + 8}px">${r.nombre}</td>
        <td>${r.organizacion_nombre || ''}</td>
        <td class="text-right">${fmtTotal}</td>
        <td class="text-right">${fmtEjec}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  printHTML(html);
}
