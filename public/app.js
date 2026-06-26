const form = document.querySelector('#expense-form');
const statusEl = document.querySelector('#status');
const previewEl = document.querySelector('#preview');
const button = document.querySelector('#submit-button');
const amountInput = document.querySelector('#importe');
const monthSelect = document.querySelector('#mes_columna');
const categorySelect = document.querySelector('#categoria');
const conceptSelect = document.querySelector('#concepto');

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
  const categories = [...new Set(catalog.concepts.map((item) => item.category))];
  categorySelect.innerHTML = option('', 'Elegir categoria') + categories.map((category) => option(category, category)).join('');
}

function fillConcepts() {
  const category = categorySelect.value;
  const concepts = catalog.concepts.filter((item) => item.category === category);
  conceptSelect.innerHTML = option('', 'Elegir gasto') + concepts.map((item) => option(item.concept, item.concept)).join('');
  updatePreview();
}

function updatePreview() {
  const month = catalog.months.find((item) => item.column === monthSelect.value);
  const concept = catalog.concepts.find((item) => item.concept === conceptSelect.value && item.category === categorySelect.value);
  if (!month || !concept) {
    previewEl.textContent = '';
    return;
  }
  previewEl.textContent = 'Se va a sumar en ' + concept.category + ' > ' + concept.concept + ', mes ' + month.label + '.';
}

categorySelect.addEventListener('change', fillConcepts);
monthSelect.addEventListener('change', updatePreview);
conceptSelect.addEventListener('change', updatePreview);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusEl.className = 'status';
  statusEl.textContent = 'Guardando gasto...';
  button.disabled = true;

  const data = Object.fromEntries(new FormData(form));
  data.persona = 'Mama';

  try {
    const response = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo guardar');

    statusEl.className = 'status ok';
    statusEl.textContent = 'Gasto guardado. Nuevo total: $' + formatAmount(result.valorNuevo) + '.';

    const code = document.querySelector('#codigo_acceso')?.value || '';
    form.reset();
    if (document.querySelector('#codigo_acceso')) document.querySelector('#codigo_acceso').value = code;
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
