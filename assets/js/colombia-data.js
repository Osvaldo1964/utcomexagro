// ============================================================
// assets/js/colombia-data.js
// Departamentos y municipios principales de Colombia
// ============================================================

const COLOMBIA_DEPARTAMENTOS = {
  "Amazonas":              ["Leticia","Puerto Nariño","La Chorrera","La Pedrera"],
  "Antioquia":             ["Medellín","Bello","Itagüí","Envigado","Apartadó","Turbo","Rionegro","Sabaneta","Caucasia","Montería"],
  "Arauca":                ["Arauca","Tame","Saravena","Arauquita","Fortul"],
  "Atlántico":             ["Barranquilla","Soledad","Malambo","Sabanalarga","Baranoa","Puerto Colombia"],
  "Bogotá D.C.":           ["Bogotá D.C."],
  "Bolívar":               ["Cartagena","Magangué","Mompós","Turbaco","Arjona","El Carmen de Bolívar"],
  "Boyacá":                ["Tunja","Duitama","Sogamoso","Chiquinquirá","Paipa","Villa de Leyva","Garagoa"],
  "Caldas":                ["Manizales","Chinchiná","Riosucio","Salamina","La Dorada","Villamaría"],
  "Caquetá":               ["Florencia","San Vicente del Caguán","Puerto Rico","Belén de los Andaquíes"],
  "Casanare":              ["Yopal","Aguazul","Paz de Ariporo","Villanueva","Tauramena","Monterrey"],
  "Cauca":                 ["Popayán","Santander de Quilichao","El Bordo","Patía","Guapi","Timbío"],
  "Cesar":                 ["Valledupar","Aguachica","Agustín Codazzi","Bosconia","Chimichagua"],
  "Chocó":                 ["Quibdó","Istmina","Tadó","Riosucio","Bagadó","Condoto"],
  "Córdoba":               ["Montería","Lorica","Sahagún","Montelíbano","Cereté","Planeta Rica"],
  "Cundinamarca":          ["Soacha","Facatativá","Zipaquirá","Chía","Fusagasugá","Girardot","Madrid","Mosquera","La Mesa","Tocancipá"],
  "Guainía":               ["Inírida","Barrancominas"],
  "Guaviare":              ["San José del Guaviare","El Retorno","Miraflores"],
  "Huila":                 ["Neiva","Pitalito","Garzón","La Plata","Campoalegre","Palermo"],
  "La Guajira":            ["Riohacha","Maicao","Uribia","Manaure","San Juan del Cesar"],
  "Magdalena":             ["Santa Marta","Ciénaga","Fundación","El Banco","Plato","Pivijay"],
  "Meta":                  ["Villavicencio","Acacías","Granada","San Martín","Puerto López","Cumaral"],
  "Nariño":                ["Pasto","Tumaco","Ipiales","Túquerres","La Unión","Samaniego"],
  "Norte de Santander":    ["Cúcuta","Ocaña","Pamplona","Los Patios","Villa del Rosario","El Zulia"],
  "Putumayo":              ["Mocoa","Puerto Asís","Orito","Puerto Caicedo","Valle del Guamuez"],
  "Quindío":               ["Armenia","Calarcá","Montenegro","Quimbaya","La Tebaida","Circasia"],
  "Risaralda":             ["Pereira","Dosquebradas","Santa Rosa de Cabal","La Virginia","Marsella"],
  "San Andrés y Providencia":["San Andrés","Providencia"],
  "Santander":             ["Bucaramanga","Floridablanca","Girón","Piedecuesta","Barrancabermeja","Socorro","San Gil"],
  "Sucre":                 ["Sincelejo","Corozal","Sampués","Morroa","San Marcos","Tolú"],
  "Tolima":                ["Ibagué","Espinal","Melgar","Honda","Líbano","Chaparral","Purificación"],
  "Valle del Cauca":       ["Cali","Buenaventura","Palmira","Tulúa","Buga","Cartago","Jamundí","Yumbo","Candelaria"],
  "Vaupés":                ["Mitú","Carurú","Taraira"],
  "Vichada":               ["Puerto Carreño","La Primavera","Santa Rosalía","Cumaribo"]
};

/**
 * Llena un <select> con los departamentos.
 * @param {string} selectId - ID del elemento select
 */
function loadDepartamentos(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Seleccione departamento --</option>';
  Object.keys(COLOMBIA_DEPARTAMENTOS).sort().forEach(dep => {
    const opt = document.createElement('option');
    opt.value = dep;
    opt.textContent = dep;
    sel.appendChild(opt);
  });
}

/**
 * Llena un <select> de municipios según el departamento seleccionado.
 * @param {string} deptoSelectId - ID del select de departamento
 * @param {string} munSelectId   - ID del select de municipio
 */
function loadMunicipios(deptoSelectId, munSelectId) {
  const depSel = document.getElementById(deptoSelectId);
  const munSel = document.getElementById(munSelectId);
  if (!depSel || !munSel) return;

  depSel.addEventListener('change', () => {
    const dep = depSel.value;
    munSel.innerHTML = '<option value="">-- Seleccione municipio --</option>';
    munSel.disabled = !dep;
    if (!dep) return;
    const munis = COLOMBIA_DEPARTAMENTOS[dep] || [];
    munis.forEach(mun => {
      const opt = document.createElement('option');
      opt.value = mun;
      opt.textContent = mun;
      munSel.appendChild(opt);
    });
  });

  // Deshabilitar municipios al inicio
  munSel.disabled = true;
}

// ============================================================
// ENTIDADES DE SALUD, PENSIÓN Y RIESGOS (EPS, AFP, ARL)
// ============================================================

const EPS_COLOMBIA = [
  "Aliansalud EPS", "Anas Wayuu EPSI", "Asmet Salud", "Capital Salud", 
  "Capresoca", "Comfenalco Valle", "Compensar", "Coosalud", "Cajacopi",
  "Dusakawi", "EPM", "EPS Familiar de Colombia", "EPS Sanitas", "EPS Sura", 
  "Famisanar", "Fuerzas Militares", "Mallamas", "Mutual Ser", "Nueva EPS",
  "Pijaos Salud", "Policía Nacional", "Salud Total", "Savia Salud",
  "Régimen Especial", "Otra"
];

const AFP_COLOMBIA = [
  "Colpensiones",
  "Porvenir",
  "Protección",
  "Colfondos",
  "Skandia",
  "Otra"
];

const ARL_COLOMBIA = [
  "ARL Sura",
  "ARL Bolívar",
  "ARL Positiva",
  "ARL Colmena",
  "ARL Equidad",
  "ARL Alfa",
  "ARL Aurora",
  "Otra"
];

/**
 * Llena un <select> con datos de un arreglo estático.
 * @param {string} selectId - ID del select
 * @param {Array} dataArray - Arreglo de opciones
 * @param {string} placeholder - Texto por defecto
 */
function loadSelectData(selectId, dataArray, placeholder) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = `<option value="">-- ${placeholder} --</option>`;
  dataArray.sort().forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    if (item === 'Otra' || item === 'Régimen Especial') {
      // Put them at the end, wait, sorting is done. Let's just sort natively.
    }
    sel.appendChild(opt);
  });
}

// Helpers
const loadEPS = (id) => loadSelectData(id, EPS_COLOMBIA, 'Seleccione EPS');
const loadAFP = (id) => loadSelectData(id, AFP_COLOMBIA, 'Seleccione AFP');
const loadARL = (id) => loadSelectData(id, ARL_COLOMBIA, 'Seleccione ARL');

