// ============================================================
// assets/js/form_postulacion.js
// Formulario de postulación con Tabs (Compartido: Público y Admin)
// ============================================================

const FormPostulacion = (() => {

  let apiPath = '/utcomexagro/api';
  let orgsData = [];

  // Configurar la ruta de la API (por si estamos en /admin)
  const setApiPath = (path) => { apiPath = path; };

  const getHTML = (mode = 'public') => {
    return `
      <div class="stepper-container" id="postulacion-stepper">
        <div class="stepper-tabs">
          <div class="step-item active" data-step="1">
            <div class="step-circle">1</div>
            <div class="step-label">Datos Personales</div>
          </div>
          <div class="step-item" data-step="2">
            <div class="step-circle">2</div>
            <div class="step-label">Organización</div>
          </div>
          <div class="step-item" data-step="3">
            <div class="step-circle">3</div>
            <div class="step-label">Contacto y Salud</div>
          </div>
          <div class="step-item" data-step="4">
            <div class="step-circle">4</div>
            <div class="step-label">Documentos</div>
          </div>
        </div>

        <form id="form-postulacion" onsubmit="FormPostulacion.submitForm(event, '${mode}')">
          
          <!-- TAB 1: DATOS PERSONALES -->
          <div class="step-content active" id="step-1">
            <h3 class="step-title">Información Personal</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Tipo de Documento *</label>
                <select name="tipo_doc" class="form-control" required>
                  <option value="">Seleccione...</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="PEP">PEP</option>
                  <option value="PPT">PPT</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Número de Documento *</label>
                <input type="text" name="num_doc" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label">Primer Apellido *</label>
                <input type="text" name="p_apellido" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label">Segundo Apellido</label>
                <input type="text" name="s_apellido" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Primer Nombre *</label>
                <input type="text" name="p_nombre" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label">Segundo Nombre</label>
                <input type="text" name="s_nombre" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Fecha de Nacimiento</label>
                <input type="date" name="fecha_nacimiento" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Género</label>
                <select name="sexo" class="form-control">
                  <option value="">Seleccione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                  <option value="No informa">Prefiero no decir</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Estado Civil</label>
                <select name="estado_civil" class="form-control">
                  <option value="">Seleccione...</option>
                  <option value="Soltero(a)">Soltero(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Unión Libre">Unión Libre</option>
                  <option value="Separado(a)">Separado(a)</option>
                  <option value="Viudo(a)">Viudo(a)</option>
                </select>
              </div>
            </div>
            <div class="step-actions">
              <button type="button" class="btn btn-primary" onclick="FormPostulacion.nextStep(2)">Siguiente ›</button>
            </div>
          </div>

          <!-- TAB 2: ORGANIZACIÓN -->
          <div class="step-content" id="step-2">
            <h3 class="step-title">Vinculación y Experiencia</h3>
            <div class="form-grid">
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Organización Autorizada (si pertenece)</label>
                <select name="organizacion_id" class="form-control" id="form-org-select">
                  <option value="">No pertenezco a ninguna organización</option>
                  <!-- Cargado via JS -->
                </select>
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Especialidad o Experticia *</label>
                <input type="text" name="especialidad" class="form-control" placeholder="Ej: Agronomía, Logística, Docencia..." required>
              </div>
            </div>
            <div class="step-actions">
              <button type="button" class="btn btn-secondary" onclick="FormPostulacion.nextStep(1)">‹ Atrás</button>
              <button type="button" class="btn btn-primary" onclick="FormPostulacion.nextStep(3)">Siguiente ›</button>
            </div>
          </div>

          <!-- TAB 3: CONTACTO Y SALUD -->
          <div class="step-content" id="step-3">
            <h3 class="step-title">Datos de Contacto y Afiliaciones</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Correo Electrónico *</label>
                <input type="email" name="email" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono *</label>
                <input type="tel" name="telefono" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" name="direccion" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Departamento</label>
                <input type="text" name="departamento" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Municipio</label>
                <input type="text" name="municipio" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Grupo Sanguíneo (RH)</label>
                <select name="rh" class="form-control">
                  <option value="">Seleccione...</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">EPS</label>
                <input type="text" name="eps" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Fondo de Pensión (AFP)</label>
                <input type="text" name="afp" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">ARL</label>
                <input type="text" name="arl" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Discapacidad</label>
                <input type="text" name="discapacidad" class="form-control" placeholder="Ninguna">
              </div>
              <div class="form-group">
                <label class="form-label">Talla Camisa</label>
                <select name="talla_camisa" class="form-control">
                  <option value="">Seleccione...</option>
                  <option value="XS">XS</option><option value="S">S</option>
                  <option value="M">M</option><option value="L">L</option>
                  <option value="XL">XL</option><option value="XXL">XXL</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Talla Pantalón</label>
                <input type="text" name="talla_pantalon" class="form-control">
              </div>
            </div>
            <div class="step-actions">
              <button type="button" class="btn btn-secondary" onclick="FormPostulacion.nextStep(2)">‹ Atrás</button>
              <button type="button" class="btn btn-primary" onclick="FormPostulacion.nextStep(4)">Siguiente ›</button>
            </div>
          </div>

          <!-- TAB 4: DOCUMENTOS -->
          <div class="step-content" id="step-4">
            <h3 class="step-title">Carga de Documentos</h3>
            <p style="font-size:0.85rem;color:var(--gray-500);margin-bottom:1.5rem">
              Por favor adjunte los documentos en formato PDF o Imagen (JPG, PNG). Máximo 3MB por archivo.
            </p>
            <div class="form-grid">
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Documento de Identidad *</label>
                <input type="file" name="cedula" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Hoja de Vida *</label>
                <input type="file" name="hoja_vida" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
              </div>
              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Certificaciones de Experiencia (Opcional)</label>
                <input type="file" name="cert_experiencia" class="form-control" accept=".pdf,.jpg,.jpeg,.png">
              </div>
              <div class="form-group" style="grid-column:1/-1; margin-top:1rem;">
                <label style="display:flex;align-items:flex-start;gap:0.75rem;cursor:pointer;background:rgba(0,0,0,0.02);padding:1rem;border-radius:8px;border:1px solid rgba(0,0,0,0.05)">
                  <input type="checkbox" name="consentimiento" value="1" required style="margin-top:0.25rem">
                  <span style="font-size:0.85rem;line-height:1.4">
                    <strong>Autorización de Tratamiento de Datos Personales *</strong><br>
                    Autorizo de manera libre, previa, expresa e informada a UT COMEXAGRO para la recolección, 
                    almacenamiento, uso, circulación y supresión de mis datos personales aquí suministrados, 
                    con la finalidad de participar en procesos de postulación, selección y contratación, 
                    conforme a la política de tratamiento de datos de la entidad y la Ley 1581 de 2012.
                  </span>
                </label>
              </div>
            </div>
            <div class="step-actions">
              <button type="button" class="btn btn-secondary" onclick="FormPostulacion.nextStep(3)">‹ Atrás</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-postulacion">
                ${mode === 'public' ? '🚀 Enviar Postulación' : '💾 Guardar Postulado'}
              </button>
            </div>
          </div>

        </form>
      </div>
    `;
  };

  const init = async (containerId, mode = 'public') => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML(mode);
    await loadOrganizaciones();
  };

  const loadOrganizaciones = async () => {
    try {
      const res = await fetch(`${apiPath}/postulados/organizaciones_publicas.php`);
      const json = await res.json();
      if (json.success) {
        orgsData = json.data;
        const select = document.getElementById('form-org-select');
        if (select) {
          orgsData.forEach(org => {
            select.insertAdjacentHTML('beforeend', `<option value="${org.id}">${org.nombre}</option>`);
          });
        }
      }
    } catch (e) { console.error('Error cargando orgs:', e); }
  };

  const nextStep = (step) => {
    // Basic validation before moving
    if (step > 1) {
      const prevStep = step - 1;
      const currentTab = document.getElementById(`step-${prevStep}`);
      const inputs = currentTab.querySelectorAll('[required]');
      let valid = true;
      inputs.forEach(inp => {
        if (!inp.checkValidity()) {
          inp.reportValidity();
          valid = false;
        }
      });
      if (!valid) return;
    }

    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`step-${step}`).classList.add('active');
    
    // Update stepper classes
    for (let i = 1; i <= 4; i++) {
      const item = document.querySelector(`.step-item[data-step="${i}"]`);
      if (i <= step) item.classList.add('active');
    }
  };

  const submitForm = async (e, mode) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-postulacion');
    const form = document.getElementById('form-postulacion');
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const fd = new FormData(form);

    try {
      const res = await fetch(`${apiPath}/postulados/create.php`, {
        method: 'POST',
        body: fd
      });
      const json = await res.json();

      if (json.success) {
        if (mode === 'public') {
          form.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem">
              <div style="font-size:3rem;margin-bottom:1rem">✅</div>
              <h3 style="color:var(--green-700)">¡Postulación enviada exitosamente!</h3>
              <p style="color:var(--gray-600);margin-top:0.5rem">Hemos recibido sus datos y documentos correctamente.<br>Nuestro equipo los revisará y nos pondremos en contacto con usted.</p>
            </div>
          `;
        } else {
          showToastAdmin(json.message);
          closeModal();
          if (typeof loadPostuladosData === 'function') loadPostuladosData();
        }
      } else {
        alert('Error: ' + json.message);
      }
    } catch (err) {
      alert('Error de conexión. Intente nuevamente.');
    } finally {
      if(btn) { btn.disabled = false; btn.textContent = mode === 'public' ? '🚀 Enviar Postulación' : '💾 Guardar Postulado'; }
    }
  };

  return { init, nextStep, submitForm, setApiPath };
})();
