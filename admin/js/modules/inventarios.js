const ModInventarios = {
  data: {
    categorias: [],
    items: [],
    terceros: [],
    ordenes: [],
    movimientos: []
  },

  async init() {
    if (typeof updateBreadcrumb === 'function') {
      updateBreadcrumb([
        { label: '🏠', key: 'dashboard' },
        { label: 'Inventarios', key: 'inventarios' }
      ]);
    }
    this.renderLayout();
    await this.loadData();
    // Default is the menu grid, so we don't automatically call showTab
  },

  renderLayout() {
    const container = document.getElementById('content');
    container.innerHTML = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">📦 Inventarios</div>
          <div class="module-page-actions">
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('dashboard')">↩️ Volver al Inicio</button>
          </div>
        </div>
        
        <div class="modules-grid">
          <div class="module-card" onclick="ModInventarios.showTab('categorias')">
            <div class="module-card-header">
              <div class="module-icon" style="background:var(--emerald-100); color:var(--emerald-600)">📂</div>
              <div><div class="module-name">Categorías</div></div>
            </div>
            <div class="module-desc">Clasificación de productos</div>
            <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
          </div>
          
          <div class="module-card" onclick="ModInventarios.showTab('items')">
            <div class="module-card-header">
              <div class="module-icon" style="background:var(--blue-100); color:var(--blue-600)">📦</div>
              <div><div class="module-name">Ítems</div></div>
            </div>
            <div class="module-desc">Catálogo y Stock actual</div>
            <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
          </div>
          
          <div class="module-card" onclick="ModInventarios.showTab('terceros')">
            <div class="module-card-header">
              <div class="module-icon" style="background:var(--yellow-100); color:var(--yellow-600)">🤝</div>
              <div><div class="module-name">Terceros</div></div>
            </div>
            <div class="module-desc">Proveedores y contratistas</div>
            <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
          </div>

          <div class="module-card" onclick="ModInventarios.showTab('ordenes')">
            <div class="module-card-header">
              <div class="module-icon" style="background:var(--purple-100); color:var(--purple-600)">📄</div>
              <div><div class="module-name">Órdenes de Compra</div></div>
            </div>
            <div class="module-desc">Pedidos a proveedores</div>
            <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
          </div>

          <div class="module-card" onclick="ModInventarios.showTab('entradas')">
            <div class="module-card-header">
              <div class="module-icon" style="background:var(--green-100); color:var(--green-600)">📥</div>
              <div><div class="module-name">Entradas</div></div>
            </div>
            <div class="module-desc">Ingreso de almacén</div>
            <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
          </div>

          <div class="module-card" onclick="ModInventarios.showTab('salidas')">
            <div class="module-card-header">
              <div class="module-icon" style="background:var(--red-100); color:var(--red-600)">📤</div>
              <div><div class="module-name">Salidas</div></div>
            </div>
            <div class="module-desc">Despachos de almacén</div>
            <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
          </div>

          <div class="module-card" onclick="ModInventarios.showTab('ajustes')">
            <div class="module-card-header">
              <div class="module-icon" style="background:var(--gray-100); color:var(--gray-600)">⚖️</div>
              <div><div class="module-name">Ajustes</div></div>
            </div>
            <div class="module-desc">Sobrantes o faltantes</div>
            <div class="module-card-footer"><span class="module-link">Gestionar <span class="module-link-arrow">›</span></span></div>
          </div>

        </div>
      </div>
      
      <!-- Modals -->
      <div id="inv-modals-container">
        <div id="modal-inv-categoria" class="modal-backdrop"></div>
        <div id="modal-inv-item" class="modal-backdrop"></div>
        <div id="modal-inv-orden" class="modal-backdrop"></div>
        <div id="modal-inv-movimiento" class="modal-backdrop"></div>
      </div>
    `;
  },

  async loadData() {
    const [resCat, resItems, resTer, resOrd, resMov] = await Promise.all([
      API.get('/inventario/categorias/list.php'),
      API.get('/inventario/items/list.php'),
      API.get('/terceros/list.php'),
      API.get('/inventario/ordenes/list.php'),
      API.get('/inventario/movimientos/list.php')
    ]);

    if (resCat.success) this.data.categorias = resCat.data;
    if (resItems.success) this.data.items = resItems.data;
    if (resTer.success) this.data.terceros = resTer.data;
    if (resOrd.success) this.data.ordenes = resOrd.data;
    if (resMov.success) this.data.movimientos = resMov.data;
  },

  getTabTitle(tab) {
    const titles = {
      categorias: 'Categorías', items: 'Ítems', terceros: 'Terceros',
      ordenes: 'Órdenes de Compra', entradas: 'Entradas',
      salidas: 'Salidas', ajustes: 'Ajustes'
    };
    return titles[tab] || '';
  },

  showTab(tab) {
    if (typeof updateBreadcrumb === 'function') {
      updateBreadcrumb([
        { label: '🏠', key: 'dashboard' },
        { label: 'Inventarios', key: 'inventarios' },
        { label: this.getTabTitle(tab) }
      ]);
    }
    const container = document.getElementById('content');
    
    // We create a wrapper for the sub-view
    const html = `
      <div class="module-page">
        <div class="module-page-header">
          <div class="module-page-title">📦 Inventarios › ${this.getTabTitle(tab)}</div>
          <div class="module-page-actions">
            <button class="btn btn-secondary btn-sm" onclick="ModInventarios.init()">↩️ Volver al Menú</button>
          </div>
        </div>
        <div class="table-card" id="inv-subview-content" style="padding:1.5rem">
        </div>
      </div>
    `;
    
    const modalsContainer = document.getElementById('inv-modals-container');
    container.innerHTML = html + (modalsContainer ? modalsContainer.outerHTML : `
      <div id="inv-modals-container">
        <div id="modal-inv-categoria" class="modal-backdrop"></div>
        <div id="modal-inv-item" class="modal-backdrop"></div>
        <div id="modal-inv-orden" class="modal-backdrop"></div>
        <div id="modal-inv-movimiento" class="modal-backdrop"></div>
      </div>
    `);

    const subContainer = document.getElementById('inv-subview-content');
    switch(tab) {
      case 'categorias': this.renderCategorias(subContainer); break;
      case 'items': this.renderItems(subContainer); break;
      case 'terceros': this.renderTerceros(subContainer); break;
      case 'ordenes': this.renderOrdenes(subContainer); break;
      case 'entradas': this.renderMovimientos(subContainer, 'entrada'); break;
      case 'salidas': this.renderMovimientos(subContainer, 'salida'); break;
      case 'ajustes': this.renderMovimientos(subContainer, 'ajuste'); break;
    }
  },

  // ====================================================================
  // CATEGORÍAS
  // ====================================================================
  renderCategorias(container) {
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="margin:0">Gestión de Categorías</h3>
        <button class="btn btn-primary" onclick="ModInventarios.openCategoriaModal()">+ Nueva Categoría</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${this.data.categorias.map(c => `
              <tr>
                <td><strong>${c.nombre}</strong></td>
                <td>${c.descripcion || '-'}</td>
                <td style="width:100px;">
                  <button class="btn btn-sm" onclick='ModInventarios.openCategoriaModal(${JSON.stringify(c).replace(/'/g, "&apos;")})'>✏️</button>
                </td>
              </tr>
            `).join('')}
            ${!this.data.categorias.length ? '<tr><td colspan="3" class="text-center">No hay categorías registradas</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  openCategoriaModal(cat = null) {
    const modal = document.getElementById('modal-inv-categoria');
    modal.innerHTML = `
      <div class="modal-admin" style="max-width: 500px;">
        <div class="modal-admin-header">
          <h3 class="modal-admin-title">${cat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <button class="modal-admin-close" onclick="document.getElementById('modal-inv-categoria').classList.remove('open')">×</button>
        </div>
        <div class="modal-admin-body">
          <form id="form-inv-cat">
            <input type="hidden" id="cat_id" value="${cat?.id || ''}">
            <div class="form-group">
              <label>Nombre *</label>
              <input type="text" id="cat_nombre" class="form-control" value="${cat?.nombre || ''}" required>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <textarea id="cat_descripcion" class="form-control" rows="3">${cat?.descripcion || ''}</textarea>
            </div>
          </form>
        </div>
        <div class="modal-admin-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-inv-categoria').classList.remove('open')">Cancelar</button>
          <button class="btn btn-primary" onclick="ModInventarios.saveCategoria()">Guardar</button>
        </div>
      </div>
    `;
    modal.classList.add('open');
  },

  async saveCategoria() {
    const id = document.getElementById('cat_id').value;
    const data = {
      id: id,
      nombre: document.getElementById('cat_nombre').value,
      descripcion: document.getElementById('cat_descripcion').value
    };
    if (!data.nombre) return Swal.fire('Error', 'El nombre es obligatorio', 'error');

    const endpoint = id ? '/inventario/categorias/update.php' : '/inventario/categorias/create.php';
    const res = await API.post(endpoint, data);
    if (res.success) {
      document.getElementById('modal-inv-categoria').classList.remove('open');
      await this.loadData();
      this.showTab('categorias');
      Swal.fire('Guardado', 'Categoría guardada con éxito', 'success');
    } else {
      Swal.fire('Error', res.message, 'error');
    }
  },

  // ====================================================================
  // ITEMS
  // ====================================================================
  renderItems(container) {
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="margin:0">Catálogo de Ítems</h3>
        <button class="btn btn-primary" onclick="ModInventarios.openItemModal()">+ Nuevo Ítem</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr><th>Código</th><th>Ítem</th><th>Categoría</th><th>Ubicación</th><th>Stock Actual</th><th>Min.</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${this.data.items.map(i => {
              const stockStatus = parseFloat(i.cantidad) <= parseFloat(i.cantidad_minima) ? 'color:var(--red-600); font-weight:bold;' : 'color:var(--green-700); font-weight:bold;';
              return `
              <tr>
                <td><code>${i.codigo || '-'}</code></td>
                <td>
                  <div style="font-weight:600">${i.nombre}</div>
                  <div style="font-size:0.75rem; color:var(--gray-500)">Unidad: ${i.unidad || 'Unidad'}</div>
                </td>
                <td>${i.categoria_nombre || '-'}</td>
                <td>${i.ubicacion || '-'}</td>
                <td style="${stockStatus}">${i.cantidad}</td>
                <td>${i.cantidad_minima}</td>
                <td style="width:100px;">
                  <button class="btn btn-sm" onclick='ModInventarios.openItemModal(${JSON.stringify(i).replace(/'/g, "&apos;")})'>✏️</button>
                </td>
              </tr>
            `}).join('')}
            ${!this.data.items.length ? '<tr><td colspan="7" class="text-center">No hay ítems registrados</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  openItemModal(item = null) {
    const modal = document.getElementById('modal-inv-item');
    const catOptions = this.data.categorias.map(c => `<option value="${c.id}" ${item?.categoria_id == c.id ? 'selected' : ''}>${c.nombre}</option>`).join('');
    
    modal.innerHTML = `
      <div class="modal-admin" style="max-width: 600px;">
        <div class="modal-admin-header">
          <h3 class="modal-admin-title">${item ? 'Editar Ítem' : 'Nuevo Ítem'}</h3>
          <button class="modal-admin-close" onclick="document.getElementById('modal-inv-item').classList.remove('open')">×</button>
        </div>
        <div class="modal-admin-body">
          <form id="form-inv-item" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <input type="hidden" id="item_id" value="${item?.id || ''}">
            
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Nombre del Ítem *</label>
              <input type="text" id="item_nombre" class="form-control" value="${item?.nombre || ''}" required>
            </div>
            
            <div class="form-group">
              <label>Código o Referencia</label>
              <input type="text" id="item_codigo" class="form-control" value="${item?.codigo || ''}">
            </div>
            
            <div class="form-group">
              <label>Categoría</label>
              <select id="item_categoria_id" class="form-control">
                <option value="">-- Sin categoría --</option>
                ${catOptions}
              </select>
            </div>
            
            <div class="form-group">
              <label>Unidad de Medida</label>
              <select id="item_unidad" class="form-control" required>
                <option value="">-- Seleccione --</option>
                <option value="Unidad" ${item?.unidad === 'Unidad' ? 'selected' : ''}>Unidad (Und)</option>
                <option value="Kilogramo" ${item?.unidad === 'Kilogramo' ? 'selected' : ''}>Kilogramo (Kg)</option>
                <option value="Gramo" ${item?.unidad === 'Gramo' ? 'selected' : ''}>Gramo (g)</option>
                <option value="Litro" ${item?.unidad === 'Litro' ? 'selected' : ''}>Litro (L)</option>
                <option value="Mililitro" ${item?.unidad === 'Mililitro' ? 'selected' : ''}>Mililitro (ml)</option>
                <option value="Metro" ${item?.unidad === 'Metro' ? 'selected' : ''}>Metro (m)</option>
                <option value="Centímetro" ${item?.unidad === 'Centímetro' ? 'selected' : ''}>Centímetro (cm)</option>
                <option value="Galón" ${item?.unidad === 'Galón' ? 'selected' : ''}>Galón (Gal)</option>
                <option value="Bulto" ${item?.unidad === 'Bulto' ? 'selected' : ''}>Bulto (Bto)</option>
                <option value="Caja" ${item?.unidad === 'Caja' ? 'selected' : ''}>Caja (Cja)</option>
                <option value="Paquete" ${item?.unidad === 'Paquete' ? 'selected' : ''}>Paquete (Pqte)</option>
                <option value="Rollo" ${item?.unidad === 'Rollo' ? 'selected' : ''}>Rollo</option>
                <option value="Kit" ${item?.unidad === 'Kit' ? 'selected' : ''}>Kit</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Ubicación Física</label>
              <input type="text" id="item_ubicacion" class="form-control" value="${item?.ubicacion || ''}">
            </div>

            <div class="form-group">
              <label>Stock Actual (Calculado)</label>
              <input type="number" id="item_cantidad" class="form-control" value="${item?.cantidad || '0'}" ${item ? 'disabled title="Se actualiza mediante entradas y salidas"' : ''}>
            </div>
            
            <div class="form-group">
              <label>Stock Mínimo Alerta</label>
              <input type="number" id="item_cantidad_minima" class="form-control" value="${item?.cantidad_minima || '0'}">
            </div>

            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Descripción / Detalles</label>
              <textarea id="item_descripcion" class="form-control" rows="2">${item?.descripcion || ''}</textarea>
            </div>
          </form>
        </div>
        <div class="modal-admin-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-inv-item').classList.remove('open')">Cancelar</button>
          <button class="btn btn-primary" onclick="ModInventarios.saveItem()">Guardar</button>
        </div>
      </div>
    `;
    modal.classList.add('open');
  },

  async saveItem() {
    const id = document.getElementById('item_id').value;
    const data = {
      id: id,
      nombre: document.getElementById('item_nombre').value,
      codigo: document.getElementById('item_codigo').value,
      categoria_id: document.getElementById('item_categoria_id').value || null,
      unidad: document.getElementById('item_unidad').value,
      ubicacion: document.getElementById('item_ubicacion').value,
      cantidad_minima: document.getElementById('item_cantidad_minima').value,
      descripcion: document.getElementById('item_descripcion').value
    };
    
    if (!id) data.cantidad = document.getElementById('item_cantidad').value; // Solo se envía en creación
    
    if (!data.nombre) return Swal.fire('Error', 'El nombre es obligatorio', 'error');

    const endpoint = id ? '/inventario/items/update.php' : '/inventario/items/create.php';
    const res = await API.post(endpoint, data);
    if (res.success) {
      document.getElementById('modal-inv-item').classList.remove('open');
      await this.loadData();
      this.showTab('items');
      Swal.fire('Guardado', 'Ítem guardado con éxito', 'success');
    } else {
      Swal.fire('Error', res.message, 'error');
    }
  },

  // ====================================================================
  // TERCEROS
  // ====================================================================
  renderTerceros(container) {
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h3 style="margin:0">Directorio de Terceros y Proveedores</h3>
          <p style="margin:0; color:var(--gray-500); font-size:0.9rem;">Esta lista está sincronizada con el Módulo de Presupuesto.</p>
        </div>
        <button class="btn btn-primary" onclick="abrirModalTercero()">+ Nuevo Tercero</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr><th>NIT / Doc</th><th>Razón Social</th><th>Celular</th><th>Email</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${this.data.terceros.map(t => `
              <tr>
                <td><code>${t.numero_documento}</code></td>
                <td><strong>${t.nombre_razon_social}</strong></td>
                <td>${t.telefono || '-'}</td>
                <td>${t.email || '-'}</td>
                <td style="width:100px;">
                  <button class="btn btn-sm" onclick="abrirModalTercero(${t.id})">✏️</button>
                </td>
              </tr>
            `).join('')}
            ${!this.data.terceros.length ? '<tr><td colspan="5" class="text-center">No hay terceros</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  // ====================================================================
  // ORDENES DE COMPRA
  // ====================================================================
  renderOrdenes(container) {
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="margin:0">Órdenes de Compra</h3>
        <button class="btn btn-primary" onclick="ModInventarios.openOrdenModal()">+ Nueva Orden</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr><th>Número</th><th>Fecha</th><th>Proveedor</th><th>Estado</th><th>Total</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${this.data.ordenes.map(o => {
              let badgeClass = o.estado === 'Recibida' ? 'badge-green' : (o.estado === 'Aprobada' ? 'badge-blue' : 'badge-gray');
              const totalFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(o.total);
              return `
              <tr>
                <td><strong>${o.numero}</strong></td>
                <td>${o.fecha}</td>
                <td>${o.tercero_nombre || '-'}</td>
                <td><span class="nav-badge" style="padding:4px 8px; font-weight:normal; ${o.estado === 'Recibida' ? 'background:var(--green-600)' : 'background:var(--blue-600)'}">${o.estado}</span></td>
                <td style="text-align:right; font-weight:600;">${totalFmt}</td>
                <td style="width:100px;">
                  <button class="btn btn-sm btn-secondary" onclick='ModInventarios.verOrden(${JSON.stringify(o).replace(/'/g, "&apos;")})'>Ver</button>
                </td>
              </tr>
            `}).join('')}
            ${!this.data.ordenes.length ? '<tr><td colspan="6" class="text-center">No hay órdenes de compra</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  verOrden(orden) {
    const modal = document.getElementById('modal-inv-orden');
    const itemsHtml = orden.items.map(i => {
      const vUnit = new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP'}).format(i.valor_unitario);
      const vTot = new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP'}).format(i.valor_total);
      return `<tr><td>${i.item_nombre}</td><td>${i.cantidad}</td><td>${vUnit}</td><td style="text-align:right">${vTot}</td></tr>`;
    }).join('');
    const totalFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(orden.total);

    modal.innerHTML = `
      <div class="modal-admin" style="max-width: 700px;">
        <div class="modal-admin-header">
          <h3 class="modal-admin-title">Orden de Compra #${orden.numero}</h3>
          <button class="modal-admin-close" onclick="document.getElementById('modal-inv-orden').classList.remove('open')">×</button>
        </div>
        <div class="modal-admin-body">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem; background:#f8fafc; padding:1rem; border-radius:8px;">
            <div><strong>Proveedor:</strong> ${orden.tercero_nombre} (${orden.tercero_nit})</div>
            <div><strong>Fecha:</strong> ${orden.fecha}</div>
            <div><strong>Estado:</strong> ${orden.estado}</div>
            <div><strong>Notas:</strong> ${orden.notas || '-'}</div>
          </div>
          <table class="table" style="font-size:0.85rem;">
            <thead><tr><th>Ítem</th><th>Cant.</th><th>V. Unit.</th><th style="text-align:right">Subtotal</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr><td colspan="3" style="text-align:right"><strong>TOTAL:</strong></td><td style="text-align:right; font-weight:bold; color:var(--emerald-700)">${totalFmt}</td></tr>
            </tfoot>
          </table>
        </div>
        <div class="modal-admin-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-inv-orden').classList.remove('open')">Cerrar</button>
        </div>
      </div>
    `;
    modal.classList.add('open');
  },

  openOrdenModal() {
    const modal = document.getElementById('modal-inv-orden');
    const terOptions = this.data.terceros.map(t => `<option value="${t.id}">${t.nit} - ${t.nombre}</option>`).join('');
    const itemOptions = this.data.items.map(i => `<option value="${i.id}">${i.nombre} (Unid: ${i.unidad})</option>`).join('');
    
    // Generar numero orden OC-YMD-Random
    const d = new Date();
    const numOc = `OC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*1000)}`;

    modal.innerHTML = `
      <div class="modal-admin" style="max-width: 800px;">
        <div class="modal-admin-header">
          <h3 class="modal-admin-title">Crear Orden de Compra</h3>
          <button class="modal-admin-close" onclick="document.getElementById('modal-inv-orden').classList.remove('open')">×</button>
        </div>
        <div class="modal-admin-body">
          <form id="form-inv-orden" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Número OC *</label>
              <input type="text" id="oc_numero" class="form-control" value="${numOc}" required>
            </div>
            <div class="form-group">
              <label>Fecha *</label>
              <input type="date" id="oc_fecha" class="form-control" value="${d.toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Proveedor *</label>
              <select id="oc_tercero_id" class="form-control" required>
                <option value="">Seleccione...</option>
                ${terOptions}
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Agregar Ítem</label>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <select id="oc_item_add" class="form-control" style="flex:2"><option value="">Seleccione ítem...</option>${itemOptions}</select>
                <input type="number" id="oc_cant_add" class="form-control" placeholder="Cant." style="width:100px;">
                <input type="number" id="oc_vunit_add" class="form-control" placeholder="Valor Unit." style="width:150px;">
                <button type="button" class="btn btn-secondary" onclick="ModInventarios.addOrdenItemRow()">Añadir</button>
              </div>
            </div>
          </form>
          
          <table class="table" style="margin-top:1rem; font-size:0.85rem;">
            <thead><tr><th>Ítem</th><th>Cantidad</th><th>Valor Unit.</th><th>Subtotal</th><th></th></tr></thead>
            <tbody id="oc_items_body"></tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align:right"><strong>Total:</strong></td>
                <td colspan="2"><strong style="color:var(--emerald-700)" id="oc_total_label">$ 0</strong></td>
              </tr>
            </tfoot>
          </table>
          <div class="form-group" style="margin-top:1rem;">
            <label>Notas Adicionales</label>
            <textarea id="oc_notas" class="form-control" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-admin-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-inv-orden').classList.remove('open')">Cancelar</button>
          <button class="btn btn-primary" onclick="ModInventarios.saveOrden()">Guardar Orden</button>
        </div>
      </div>
    `;
    modal.classList.add('open');
    this.oc_items_temp = [];
  },

  addOrdenItemRow() {
    const itemSelect = document.getElementById('oc_item_add');
    const cantInput = document.getElementById('oc_cant_add');
    const vUnitInput = document.getElementById('oc_vunit_add');
    
    if(!itemSelect.value || !cantInput.value || !vUnitInput.value) return Swal.fire('Error', 'Complete todos los datos del ítem', 'error');
    
    const itemName = itemSelect.options[itemSelect.selectedIndex].text;
    const subtotal = parseFloat(cantInput.value) * parseFloat(vUnitInput.value);
    
    this.oc_items_temp.push({
      item_id: itemSelect.value,
      nombre: itemName,
      cantidad: parseFloat(cantInput.value),
      valor_unitario: parseFloat(vUnitInput.value),
      valor_total: subtotal
    });
    
    this.renderOcItemsTemp();
    itemSelect.value = ''; cantInput.value = ''; vUnitInput.value = '';
  },

  renderOcItemsTemp() {
    const tbody = document.getElementById('oc_items_body');
    let total = 0;
    tbody.innerHTML = this.oc_items_temp.map((i, idx) => {
      total += i.valor_total;
      return `<tr>
        <td>${i.nombre}</td><td>${i.cantidad}</td><td>$${i.valor_unitario}</td><td>$${i.valor_total}</td>
        <td><button type="button" class="btn btn-sm btn-secondary" onclick="ModInventarios.oc_items_temp.splice(${idx},1); ModInventarios.renderOcItemsTemp();">X</button></td>
      </tr>`;
    }).join('');
    this.oc_total_temp = total;
    document.getElementById('oc_total_label').textContent = new Intl.NumberFormat('es-CO', {style:'currency',currency:'COP'}).format(total);
  },

  async saveOrden() {
    if(this.oc_items_temp.length === 0) return Swal.fire('Error', 'Agregue al menos un ítem a la orden', 'error');
    
    const data = {
      numero: document.getElementById('oc_numero').value,
      fecha: document.getElementById('oc_fecha').value,
      tercero_id: document.getElementById('oc_tercero_id').value,
      estado: 'Aprobada',
      total: this.oc_total_temp,
      notas: document.getElementById('oc_notas').value,
      items: this.oc_items_temp
    };

    if(!data.numero || !data.fecha || !data.tercero_id) return Swal.fire('Error', 'Complete los campos obligatorios', 'error');

    const res = await API.post('/inventario/ordenes/create.php', data);
    if(res.success) {
      document.getElementById('modal-inv-orden').classList.remove('open');
      await this.loadData();
      this.showTab('ordenes');
      Swal.fire('Guardado', 'Orden creada con éxito', 'success');
    } else {
      Swal.fire('Error', res.message, 'error');
    }
  },

  // ====================================================================
  // MOVIMIENTOS (Entradas, Salidas, Ajustes)
  // ====================================================================
  renderMovimientos(container, filterType) {
    let titulo = 'Ajustes de Inventario';
    let btnText = '+ Nuevo Ajuste';
    let tipos = ['ajuste_ingreso', 'ajuste_egreso'];
    
    if (filterType === 'entrada') { titulo = 'Entradas a Almacén'; btnText = '+ Nueva Entrada'; tipos = ['entrada']; }
    if (filterType === 'salida') { titulo = 'Salidas de Almacén'; btnText = '+ Nueva Salida'; tipos = ['salida']; }

    const movs = this.data.movimientos.filter(m => tipos.includes(m.tipo));

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="margin:0">${titulo}</h3>
        <button class="btn btn-primary" onclick="ModInventarios.openMovimientoModal('${filterType}')">${btnText}</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr><th>Fecha</th><th>Tipo</th><th>Ref / Comprobante</th><th>Tercero / Orden</th><th>Ítems Movidos</th><th>Observaciones</th></tr>
          </thead>
          <tbody>
            ${movs.map(m => `
              <tr>
                <td>${m.fecha}</td>
                <td><span class="nav-badge" style="background:${m.tipo.includes('entrada') || m.tipo.includes('ingreso') ? 'var(--green-600)' : 'var(--red-600)'}">${m.tipo.toUpperCase()}</span></td>
                <td><strong>${m.comprobante_ref || '-'}</strong></td>
                <td>${m.tercero_nombre || m.orden_numero || '-'}</td>
                <td>${m.items.length} ítems</td>
                <td><small>${m.observaciones || '-'}</small></td>
              </tr>
            `).join('')}
            ${!movs.length ? `<tr><td colspan="6" class="text-center">No hay registros de ${filterType}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  openMovimientoModal(filterType) {
    const modal = document.getElementById('modal-inv-movimiento');
    const terOptions = this.data.terceros.map(t => `<option value="${t.id}">${t.nit} - ${t.nombre}</option>`).join('');
    const itemOptions = this.data.items.map(i => `<option value="${i.id}">${i.nombre} (Stock: ${i.cantidad})</option>`).join('');
    const ocOptions = this.data.ordenes.filter(o => o.estado !== 'Recibida').map(o => `<option value="${o.id}">${o.numero} - ${o.tercero_nombre}</option>`).join('');
    
    const d = new Date();
    
    let tipoOptions = '';
    let extraFields = '';

    if (filterType === 'entrada') {
      tipoOptions = `<option value="entrada">Entrada a Almacén</option>`;
      extraFields = `
        <div class="form-group" style="grid-column: 1 / -1; background:#e0f2fe; padding:10px; border-radius:8px;">
          <label>¿Viene de una Orden de Compra?</label>
          <select id="mov_orden_id" class="form-control" onchange="ModInventarios.cargarItemsDeOrden(this.value)">
            <option value="">No, entrada manual</option>
            ${ocOptions}
          </select>
        </div>
        <div class="form-group"><label>Proveedor</label><select id="mov_tercero_id" class="form-control"><option value="">Ninguno</option>${terOptions}</select></div>
      `;
    } else if (filterType === 'salida') {
      tipoOptions = `<option value="salida">Salida / Consumo</option>`;
      extraFields = `
        <div class="form-group" style="grid-column: 1 / -1;"><label>Entregado a (Proveedor/Contratista/Empleado)</label><select id="mov_tercero_id" class="form-control"><option value="">Ninguno</option>${terOptions}</select></div>
      `;
    } else {
      tipoOptions = `<option value="ajuste_ingreso">Ajuste Positivo (+)</option><option value="ajuste_egreso">Ajuste Negativo (-)</option>`;
    }

    modal.innerHTML = `
      <div class="modal-admin" style="max-width: 800px;">
        <div class="modal-admin-header">
          <h3 class="modal-admin-title">Registrar Movimiento</h3>
          <button class="modal-admin-close" onclick="document.getElementById('modal-inv-movimiento').classList.remove('open')">×</button>
        </div>
        <div class="modal-admin-body">
          <form id="form-inv-mov" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
            <div class="form-group">
              <label>Tipo de Movimiento</label>
              <select id="mov_tipo" class="form-control">${tipoOptions}</select>
            </div>
            <div class="form-group">
              <label>Fecha *</label>
              <input type="date" id="mov_fecha" class="form-control" value="${d.toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>No. Factura / Remisión / Ref</label>
              <input type="text" id="mov_comprobante" class="form-control">
            </div>
            
            ${extraFields}

            <div class="form-group" style="grid-column: 1 / -1; margin-top:1rem;">
              <label style="color:var(--emerald-700)">Ítems del Movimiento</label>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <select id="mov_item_add" class="form-control" style="flex:2"><option value="">Seleccione ítem...</option>${itemOptions}</select>
                <input type="number" id="mov_cant_add" class="form-control" placeholder="Cant." style="width:120px;">
                <button type="button" class="btn btn-secondary" onclick="ModInventarios.addMovItemRow()">Añadir a lista</button>
              </div>
            </div>
          </form>
          
          <table class="table" style="margin-top:0.5rem; font-size:0.85rem;">
            <thead><tr><th>Ítem</th><th>Cantidad</th><th></th></tr></thead>
            <tbody id="mov_items_body"></tbody>
          </table>
          
          <div class="form-group" style="margin-top:1rem;">
            <label>Observaciones o Motivo</label>
            <textarea id="mov_observaciones" class="form-control" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-admin-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-inv-movimiento').classList.remove('open')">Cancelar</button>
          <button class="btn btn-primary" onclick="ModInventarios.saveMovimiento('${filterType}')">Ejecutar Movimiento</button>
        </div>
      </div>
    `;
    modal.classList.add('open');
    this.mov_items_temp = [];
  },

  cargarItemsDeOrden(orden_id) {
    if(!orden_id) {
      this.mov_items_temp = [];
      this.renderMovItemsTemp();
      return;
    }
    const orden = this.data.ordenes.find(o => o.id == orden_id);
    if(orden) {
      document.getElementById('mov_tercero_id').value = orden.tercero_id;
      document.getElementById('mov_comprobante').value = orden.numero;
      
      this.mov_items_temp = orden.items.map(i => ({
        item_id: i.item_id,
        nombre: i.item_nombre,
        cantidad: i.cantidad,
        costo_unitario: i.valor_unitario
      }));
      this.renderMovItemsTemp();
    }
  },

  addMovItemRow() {
    const itemSelect = document.getElementById('mov_item_add');
    const cantInput = document.getElementById('mov_cant_add');
    
    if(!itemSelect.value || !cantInput.value) return Swal.fire('Error', 'Seleccione un ítem y cantidad', 'error');
    
    this.mov_items_temp.push({
      item_id: itemSelect.value,
      nombre: itemSelect.options[itemSelect.selectedIndex].text,
      cantidad: parseFloat(cantInput.value)
    });
    
    this.renderMovItemsTemp();
    itemSelect.value = ''; cantInput.value = '';
  },

  renderMovItemsTemp() {
    const tbody = document.getElementById('mov_items_body');
    tbody.innerHTML = this.mov_items_temp.map((i, idx) => `
      <tr>
        <td>${i.nombre}</td><td>${i.cantidad}</td>
        <td style="text-align:right"><button type="button" class="btn btn-sm btn-secondary" onclick="ModInventarios.mov_items_temp.splice(${idx},1); ModInventarios.renderMovItemsTemp();">X</button></td>
      </tr>
    `).join('');
  },

  async saveMovimiento(tab) {
    if(this.mov_items_temp.length === 0) return Swal.fire('Error', 'Agregue al menos un ítem al movimiento', 'error');
    
    const data = {
      tipo: document.getElementById('mov_tipo').value,
      fecha: document.getElementById('mov_fecha').value,
      comprobante_ref: document.getElementById('mov_comprobante').value,
      tercero_id: document.getElementById('mov_tercero_id') ? document.getElementById('mov_tercero_id').value : null,
      orden_compra_id: document.getElementById('mov_orden_id') ? document.getElementById('mov_orden_id').value : null,
      observaciones: document.getElementById('mov_observaciones').value,
      items: this.mov_items_temp
    };

    if(!data.fecha || !data.tipo) return Swal.fire('Error', 'Complete la fecha y tipo', 'error');

    const res = await API.post('/inventario/movimientos/create.php', data);
    if(res.success) {
      document.getElementById('modal-inv-movimiento').classList.remove('open');
      await this.loadData();
      this.showTab(tab);
      Swal.fire('Éxito', 'Movimiento registrado. El stock ha sido actualizado.', 'success');
    } else {
      Swal.fire('Error', res.message, 'error');
    }
  }

};

window.ModInventarios = ModInventarios;


