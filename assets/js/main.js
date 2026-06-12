// ============================================================
// assets/js/main.js
// Lógica principal: Navbar, Partículas, Modales, Stepper,
// Upload de archivos, Validación de formularios, API calls
// ============================================================

const API_BASE = '/utcomexagro/api';

/* ================================================================
   UTILIDADES
   ================================================================ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4500);
}

/* ================================================================
   NAVBAR – scroll & hamburger
   ================================================================ */
(function initNavbar() {
  const navbar    = $('navbar');
  const hamburger = $('hamburger');
  const navLinks  = $('nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const bars = hamburger.querySelectorAll('span');
    bars[0].style.transform = navLinks.classList.contains('open') ? 'rotate(45deg) translate(5px,5px)' : '';
    bars[1].style.opacity   = navLinks.classList.contains('open') ? '0' : '1';
    bars[2].style.transform = navLinks.classList.contains('open') ? 'rotate(-45deg) translate(5px,-5px)' : '';
  });

  // Cerrar menú al clic en enlace
  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
})();

/* ================================================================
   PARTÍCULAS DEL HERO
   ================================================================ */
(function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;
  const count = window.innerWidth < 768 ? 8 : 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    const size = Math.random() * 80 + 20;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 15 + 10}s;
      animation-delay:${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
})();

/* ================================================================
   ANIMACIÓN SCROLL – Intersection Observer
   ================================================================ */
(function initScrollAnim() {
  const els = $$('[data-anim]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('anim-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();

/* ================================================================
   CONTADORES ANIMADOS
   ================================================================ */
(function initCounters() {
  const counters = $$('[data-counter]');
  if (!counters.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseInt(el.dataset.counter, 10);
      const dur = 1800;
      const step = end / (dur / 16);
      let cur = 0;
      const timer = setInterval(() => {
        cur += step;
        if (cur >= end) { cur = end; clearInterval(timer); }
        el.textContent = Math.floor(cur).toLocaleString('es-CO') + (el.dataset.suffix || '');
      }, 16);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
})();

/* ================================================================
   MODAL ENGINE
   ================================================================ */
function openModal(overlayId) {
  const overlay = $(overlayId);
  if (!overlay) return;
  document.body.style.overflow = 'hidden';
  overlay.classList.add('open');
  requestAnimationFrame(() => overlay.classList.add('visible'));
}

function closeModal(overlayId) {
  const overlay = $(overlayId);
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }, 320);
}

// Cerrar al clic fuera del modal
$$('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// Tecla ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal-overlay.open').forEach(o => closeModal(o.id));
  }
});

/* ================================================================
   STEPPER – Formulario de Postulados (5 pasos)
   ================================================================ */
const TOTAL_STEPS = 5;
let currentStep  = 1;
const formData   = {};    // Acumula datos entre pasos

function updateStepper() {
  // Actualizar burbujas
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const item = $(`step-nav-${i}`);
    if (!item) continue;
    item.classList.remove('active', 'done');
    if (i === currentStep) item.classList.add('active');
    if (i  < currentStep) item.classList.add('done');
  }

  // Mostrar panel correcto
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const panel = $(`step-panel-${i}`);
    if (panel) panel.classList.toggle('active', i === currentStep);
  }

  // Barra de progreso
  const bar = $('modal-progress-bar');
  if (bar) bar.style.width = `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`;

  // Contador
  const counter = $('step-counter');
  if (counter) counter.textContent = `Paso ${currentStep} de ${TOTAL_STEPS}`;

  // Botones
  const btnPrev   = $('btn-prev');
  const btnNext   = $('btn-next');
  const btnSubmit = $('btn-submit');

  if (btnPrev)   btnPrev.style.visibility   = currentStep === 1 ? 'hidden' : 'visible';
  if (btnNext)   btnNext.style.display      = currentStep < TOTAL_STEPS ? 'inline-flex' : 'none';
  if (btnSubmit) btnSubmit.style.display    = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
}

// Ir al paso N desde indicador
function goToStep(n) {
  if (n >= 1 && n < currentStep) {
    currentStep = n;
    updateStepper();
  }
}

// Validar el paso actual
function validateStep(step) {
  const panel = $(`step-panel-${step}`);
  if (!panel) return true;
  let valid = true;

  panel.querySelectorAll('[required]').forEach(field => {
    const group = field.closest('.form-group');
    if (!field.value.trim()) {
      valid = false;
      group?.classList.add('has-error');
      let err = group?.querySelector('.form-error');
      if (!err) {
        err = document.createElement('span');
        err.className = 'form-error';
        group?.appendChild(err);
      }
      err.textContent = 'Este campo es requerido.';
    } else {
      group?.classList.remove('has-error');
    }
  });

  // Validación de email si existe
  const emailField = panel.querySelector('input[type="email"]');
  if (emailField?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
    emailField.closest('.form-group')?.classList.add('has-error');
    valid = false;
  }

  if (!valid) {
    const firstError = panel.querySelector('.has-error [required], .has-error');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return valid;
}

// Avanzar paso
function nextStep() {
  if (!validateStep(currentStep)) return;
  collectStepData(currentStep);
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateStepper();
    $(`step-panel-${currentStep}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Retroceder paso
function prevStep() {
  if (currentStep > 1) { currentStep--; updateStepper(); }
}

// Recoger datos del paso actual en formData
function collectStepData(step) {
  const panel = $(`step-panel-${step}`);
  if (!panel) return;
  panel.querySelectorAll('input, select, textarea').forEach(field => {
    if (field.name) formData[field.name] = field.value;
  });
}

// Init stepper
document.addEventListener('DOMContentLoaded', () => {
  $('btn-prev')?.addEventListener('click', prevStep);
  $('btn-next')?.addEventListener('click', nextStep);
  updateStepper();

  // Cargar departamentos y municipios
  loadDepartamentos('departamento');
  loadMunicipios('departamento', 'municipio');

  // Cargar programas desde API
  loadProgramas();

  // Cargar cargos según programa
  $('programa_id')?.addEventListener('change', e => loadCargos(e.target.value));
});

/* ================================================================
   CARGAR PROGRAMAS DESDE BD
   ================================================================ */
async function loadProgramas() {
  try {
    const res  = await fetch(`${API_BASE}/postulados/programas.php`);
    const json = await res.json();
    const sel  = $('programa_id');
    if (!sel || !json.success) return;

    json.data.forEach(prog => {
      const opt = document.createElement('option');
      opt.value = prog.id;
      opt.textContent = prog.nombre;
      sel.appendChild(opt);
    });
  } catch {
    // Fallback: opciones estáticas
    const sel = $('programa_id');
    if (!sel) return;
    const fallback = [
      [1, 'Programa de Asistencia Técnica Agrícola'],
      [2, 'Programa de Capacitación Técnica Rural'],
      [3, 'Programa de Comercialización Agropecuaria'],
      [4, 'Programa de Investigación y Extensión'],
    ];
    fallback.forEach(([id, nombre]) => {
      const opt = document.createElement('option');
      opt.value = id; opt.textContent = nombre;
      sel.appendChild(opt);
    });
  }
}

async function loadCargos(programaId) {
  const sel = $('cargo_id');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Seleccione cargo --</option>';
  if (!programaId) return;

  try {
    const res  = await fetch(`${API_BASE}/postulados/cargos.php?programa_id=${programaId}`);
    const json = await res.json();
    if (!json.success) return;
    json.data.forEach(cargo => {
      const opt = document.createElement('option');
      opt.value = cargo.id; opt.textContent = cargo.nombre;
      sel.appendChild(opt);
    });
  } catch { /* silencioso */ }
}

/* ================================================================
   FILE UPLOAD – Drag & Drop
   ================================================================ */
document.querySelectorAll('.upload-zone').forEach(zone => {
  const input = zone.querySelector('input[type="file"]');
  if (!input) return;

  // Mostrar nombre al seleccionar
  input.addEventListener('change', () => handleFileSelect(zone, input));

  // Drag & Drop
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      input.files = dt.files;
      handleFileSelect(zone, input);
    }
  });
});

function handleFileSelect(zone, input) {
  const file = input.files[0];
  if (!file) return;

  // Validar tipo
  const allowed = ['application/pdf','image/jpeg','image/png','image/webp'];
  if (!allowed.includes(file.type)) {
    showToast('Solo se permiten PDF, JPG o PNG.', 'error');
    input.value = '';
    return;
  }

  // Validar tamaño (3MB)
  if (file.size > 3 * 1024 * 1024) {
    showToast('El archivo supera el tamaño máximo de 3MB.', 'error');
    input.value = '';
    return;
  }

  zone.classList.add('has-file');
  let nameEl = zone.querySelector('.upload-filename');
  if (!nameEl) {
    nameEl = document.createElement('p');
    nameEl.className = 'upload-filename';
    zone.appendChild(nameEl);
  }
  nameEl.textContent = `📎 ${file.name}`;

  const hint = zone.querySelector('.upload-hint');
  if (hint) hint.textContent = `${(file.size / 1024).toFixed(0)} KB`;
}

/* ================================================================
   ENVÍO FORMULARIO POSTULADOS
   ================================================================ */
$('form-postulados')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!validateStep(TOTAL_STEPS)) return;
  collectStepData(TOTAL_STEPS);

  const btn = $('btn-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Enviando...';

  try {
    const fd = new FormData(this);

    const res  = await fetch(`${API_BASE}/postulados/create.php`, {
      method: 'POST', body: fd
    });
    const json = await res.json();

    if (json.success) {
      showSuccessState('postulado', json.data);
    } else {
      showToast(json.message || 'Error al enviar. Intente nuevamente.', 'error');
      btn.disabled = false;
      btn.innerHTML = '✅ Enviar Registro';
    }
  } catch (err) {
    showToast('Error de conexión. Verifique su internet.', 'error');
    btn.disabled = false;
    btn.innerHTML = '✅ Enviar Registro';
  }
});

/* ================================================================
   ENVÍO FORMULARIO PQR
   ================================================================ */
$('form-pqr')?.addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validar campos requeridos
  let valid = true;
  this.querySelectorAll('[required]').forEach(f => {
    const g = f.closest('.form-group');
    if (!f.value.trim()) {
      valid = false;
      g?.classList.add('has-error');
    } else {
      g?.classList.remove('has-error');
    }
  });
  if (!valid) return;

  const btn = $('btn-pqr-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Radicando...';

  try {
    const fd = new FormData(this);
    const res  = await fetch(`${API_BASE}/pqrs/create.php`, {
      method: 'POST', body: fd
    });
    const json = await res.json();

    if (json.success) {
      showSuccessStatePQR(json.data);
    } else {
      showToast(json.message || 'Error al radicar. Intente nuevamente.', 'error');
      btn.disabled = false;
      btn.innerHTML = '📤 Radicar PQR';
    }
  } catch {
    showToast('Error de conexión. Verifique su internet.', 'error');
    btn.disabled = false;
    btn.innerHTML = '📤 Radicar PQR';
  }
});

/* ================================================================
   ESTADOS DE ÉXITO
   ================================================================ */
function showSuccessState(type, data) {
  const formEl    = $('form-postulados');
  const stepperEl = document.querySelector('.stepper-nav');
  const footerEl  = document.querySelector('#overlay-postulados .modal-footer');
  const successEl = $('success-postulado');

  if (formEl)    formEl.style.display    = 'none';
  if (stepperEl) stepperEl.style.display = 'none';
  if (footerEl)  footerEl.style.display  = 'none';

  if (successEl) {
    successEl.classList.add('visible');
    const nameEl = successEl.querySelector('.success-name');
    if (nameEl) nameEl.textContent = data.nombre || '';
    const docEl = successEl.querySelector('.success-doc');
    if (docEl)  docEl.textContent = data.num_doc || '';
  }
}

function showSuccessStatePQR(data) {
  const formEl    = $('form-pqr');
  const footerEl  = document.querySelector('#overlay-pqr .modal-footer');
  const successEl = $('success-pqr');

  if (formEl)   formEl.style.display   = 'none';
  if (footerEl) footerEl.style.display = 'none';

  if (successEl) {
    successEl.classList.add('visible');
    const radEl = successEl.querySelector('.success-radicado');
    if (radEl) radEl.textContent = data.radicado || '';
    const fechaEl = successEl.querySelector('.success-fecha');
    if (fechaEl) fechaEl.textContent = data.fecha || '';
  }
}

/* ================================================================
   RESET AL CERRAR MODAL
   ================================================================ */
function resetPostuladosModal() {
  currentStep = 1;
  updateStepper();
  $('form-postulados')?.reset();
  const successEl = $('success-postulado');
  if (successEl) successEl.classList.remove('visible');
  const formEl    = $('form-postulados');
  if (formEl) formEl.style.display = '';
  const stepperEl = document.querySelector('.stepper-nav');
  if (stepperEl) stepperEl.style.display = '';
  const footerEl  = document.querySelector('#overlay-postulados .modal-footer');
  if (footerEl) footerEl.style.display = '';
  $$('.upload-zone').forEach(z => z.classList.remove('has-file'));
  $$('.form-group').forEach(g => g.classList.remove('has-error'));
}

function resetPQRModal() {
  $('form-pqr')?.reset();
  const successEl = $('success-pqr');
  if (successEl) successEl.classList.remove('visible');
  const formEl = $('form-pqr');
  if (formEl) formEl.style.display = '';
  const footerEl = document.querySelector('#overlay-pqr .modal-footer');
  if (footerEl) footerEl.style.display = '';
}

/* ================================================================
   SMOOTH SCROLL para links de nav
   ================================================================ */
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
