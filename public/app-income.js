const form = document.querySelector('#expense-form');
const statusEl = document.querySelector('#status');
const previewEl = document.querySelector('#preview');
const button = document.querySelector('#submit-button');
const typeSelect = document.querySelector('#tipo_movimiento');
const amountInput = document.querySelector('#importe');
const monthSelect = document.querySelector('#mes_columna');
const categorySelect = document.querySelector('#categoria');
const conceptSelect = document.querySelector('#concepto');
const fileInput = document.querySelector('#archivo');
const categoryField = categorySelect.closest('label');
const conceptLabel = conceptSelect.closest('label').querySelector('span');

let catalog = { months: [], concepts: [] };

init();

async function init() {
  try {
    await loadConfig();
    const response = await fetch('/api/catalogo');
    catalog = await response.json();
    fillMonths();
    fillCategories();
    fillConcepts();
    updatePreview();
  } catch (error) {
    statusEl.className = 'status error';
    statusEl.textContent = 'No se pudo cargar la app.';
  }
}

async function loadConfig() {
  const response = await fetch('/api/config');
  const config = await response.json();
  const field = document.querySelector('#access-code-field');
  const input = document.querySelector('#codigo_acceso');
  if (config.accessCodeRequired) {
    field.hidden = false;
    input.required = true;
  }
}

function fillMonths() {
  monthSelect.innerHTML = option('', 'Elegir mes') + catalog.months.map((month) => option(month.column, month.label)).join('');
  const currentMonth = new Date().getMonth();
  const current = catalog.months[currentMonth];
  if (current) monthSelect.value = current.column;
}

function fillCategories() {
  const movementType = typeSelect.value || 'EGRESOS';
  const categories = [...new Set(catalog.concepts.filter((item) => (item.type || 'EGRESOS') === movementType).map((item) => item.category))];
  categorySelect.innerHTML = option('', 'Elegir categoria') + categories.map((category) => option(category, category)).join('');
  if (movementType === 'INGRESOS' && categories.length === 1) {
    categorySelect.value = categories[0];
    categoryField.hidden = true;
    categorySelect.required = false;
  } else {
    categoryField.hidden = false;
    categorySelect.required = true;
  }
  fillConcepts();
}

function fillConcepts() {
  const movementType = typeSelect.value || 'EGRESOS';
  const category = categorySelect.value;
  const concepts = catalog.concepts.filter((item) => (item.type || 'EGRESOS') === movementType && item.category === category);
  const label = movementType === 'INGRESOS' ? 'Ingreso' : 'Gasto';
  conceptLabel.textContent = label;
  button.textContent = 'Enviar ' + label.toLowerCase();
  conceptSelect.innerHTML = option('', 'Elegir ' + label.toLowerCase()) + concepts.map((item) => option(item.concept, item.concept)).join('');
  updatePreview();
}

function updatePreview() {
  const movementType = typeSelect.value || 'EGRESOS';
  const label = movementType === 'INGRESOS' ? 'Ingreso' : 'Gasto';
  const month = catalog.months.find((item) => item.column === monthSelect.value);
  const concept = catalog.concepts.find((item) => item.concept === conceptSelect.value && item.category === categorySelect.value && (item.type || 'EGRESOS') === movementType);
  if (!month || !concept) {
    previewEl.textContent = 'Selecciona los datos para ver el destino antes de enviar.';
    return;
  }
  previewEl.textContent = 'Destino sugerido: ' + label + ' > ' + concept.concept + ', fila ' + concept.row + ', ' + month.label + '.';
}

typeSelect.addEventListener('change', fillCategories);
categorySelect.addEventListener('change', fillConcepts);
monthSelect.addEventListener('change', updatePreview);
conceptSelect.addEventListener('change', updatePreview);
fileInput.addEventListener('change', () => {
  updatePreview();
  const file = fileInput.files?.[0];
  if (!file) return;
  previewEl.textContent = previewEl.textContent + ' Comprobante: ' + file.name + ' - ' + formatBytes(file.size) + '.';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const movementType = typeSelect.value || 'EGRESOS';
  const label = movementType === 'INGRESOS' ? 'ingreso' : 'gasto';
  statusEl.className = 'status';
  statusEl.textContent = 'Guardando ' + label + '...';
  button.disabled = true;

  const data = Object.fromEntries(new FormData(form));
  data.persona = 'Mama';

  try {
    const file = fileInput.files?.[0];
    if (file) {
      if (file.size > 1500000) throw new Error('El archivo es muy grande. Usa una foto mas liviana o un PDF menor a 1,5 MB.');
      data.archivo_nombre = file.name;
      data.archivo_tipo = file.type || 'application/octet-stream';
      data.archivo_tamano = file.size;
      data.archivo_base64 = await fileToBase64(file);
    }
    const response = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo guardar');

    statusEl.className = 'status ok';
    statusEl.textContent = capitalize(label) + ' cargado directo en ' + result.destino + '. Nuevo total: $' + formatAmount(result.valorNuevo) + (result.comprobante ? ' con comprobante guardado' : '') + '.';

    const codeInput = document.querySelector('#codigo_acceso');
    const code = codeInput ? codeInput.value : '';
    const selectedType = typeSelect.value;
    form.reset();
    if (codeInput) codeInput.value = code;
    typeSelect.value = selectedType;
    fillMonths();
    fillCategories();
    fillConcepts();
    amountInput.focus();
  } catch (error) {
    statusEl.className = 'status error';
    statusEl.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

function option(value, label) {
  return '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + '</option>';
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('es-AR');
}

function capitalize(value) {
  return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}
