// ================================================================
//  MÓDULO: PRESUPUESTO (FINANCIERO)
//  admin/js/modules/presupuesto.js
// ================================================================

function renderPresupuesto() {
  updateBreadcrumb([
    { label: '🏠', key: 'dashboard' },
    { label: 'Financiero', key: 'presupuesto' }
  ]);

  const content = document.getElementById('content');
  showSkeletonLoader();

  // Simulamos una mínima carga para la transición
  setTimeout(() => {
    content.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">💰 Financiero (Presupuesto)</div>
          <div class="module-page-actions"></div>
        </div>

        <div class="modules-grid">
          
          <!-- Tarjeta: Terceros -->
          <div class="module-card" onclick="window.location.hash='terceros'">
            <div class="module-card-header">
              <div class="module-icon icon-people">🪪</div>
              <div>
                <div class="module-name">Terceros</div>
              </div>
            </div>
            <div class="module-desc">Proveedores y Clientes</div>
            <div class="module-card-footer">
              <span class="module-link">Ingresar <span class="module-link-arrow">›</span></span>
            </div>
          </div>

          <!-- Tarjeta: Presupuesto -->
          <div class="module-card" onclick="window.location.hash='presupuesto_rubros'">
            <div class="module-card-header">
              <div class="module-icon icon-budget">🧮</div>
              <div>
                <div class="module-name">Presupuesto</div>
              </div>
            </div>
            <div class="module-desc">Planeación Financiera</div>
            <div class="module-card-footer">
              <span class="module-link">Ingresar <span class="module-link-arrow">›</span></span>
            </div>
          </div>

          <!-- Tarjeta: Movimientos -->
          <div class="module-card" onclick="window.location.hash='presupuesto_movimientos'">
            <div class="module-card-header">
              <div class="module-icon icon-inventory">⇅</div>
              <div>
                <div class="module-name">Movimientos</div>
              </div>
            </div>
            <div class="module-desc">Ingresos y Gastos</div>
            <div class="module-card-footer">
              <span class="module-link">Ingresar <span class="module-link-arrow">›</span></span>
            </div>
          </div>

          <!-- Tarjeta: Traslados -->
          <div class="module-card" onclick="window.location.hash='presupuesto_traslados'">
            <div class="module-card-header">
              <div class="module-icon icon-training">↩️</div>
              <div>
                <div class="module-name">Traslados</div>
              </div>
            </div>
            <div class="module-desc">Movimientos Internos</div>
            <div class="module-card-footer">
              <span class="module-link">Ingresar <span class="module-link-arrow">›</span></span>
            </div>
          </div>

        </div>
      </div>
    `;
  }, 200);
}
