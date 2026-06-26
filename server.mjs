import { createServer } from 'node:http';
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT_DIR = typeof process === 'undefined' ? nodeRepl.cwd : process.cwd();
const PORT = Number((typeof process === 'undefined' ? undefined : process.env.PORT) || 4333);
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const MAIN_SHEET_NAME = 'Cash-25 Tuckys';
const LOG_SHEET_NAME = 'Carga Gastos Web';
const LOG_HEADERS = ['ID', 'Cargado el', 'Fecha gasto', 'Persona', 'Categoria', 'Concepto', 'Mes', 'Columna', 'Fila', 'Importe', 'Descripcion', 'Valor anterior', 'Valor nuevo', 'Destino', 'Estado'];

const MONTHS = [
  {
    "label": "Enero",
    "month": "JAN",
    "column": "H"
  },
  {
    "label": "Febrero",
    "month": "FEB",
    "column": "I"
  },
  {
    "label": "Marzo",
    "month": "MAR",
    "column": "J"
  },
  {
    "label": "Abril",
    "month": "APR",
    "column": "K"
  },
  {
    "label": "Mayo",
    "month": "MAY",
    "column": "L"
  },
  {
    "label": "Junio",
    "month": "JUN",
    "column": "M"
  },
  {
    "label": "Julio",
    "month": "JUL",
    "column": "N"
  },
  {
    "label": "Agosto",
    "month": "AUG",
    "column": "O"
  },
  {
    "label": "Septiembre",
    "month": "SEP",
    "column": "P"
  },
  {
    "label": "Octubre",
    "month": "OCT",
    "column": "Q"
  },
  {
    "label": "Noviembre",
    "month": "NOV",
    "column": "R"
  },
  {
    "label": "Diciembre",
    "month": "DEC",
    "column": "S"
  }
];
const CONCEPTS = [
  {
    "type": "EGRESOS",
    "category": "Tarjetas de Credito",
    "concept": "VISA",
    "row": 16
  },
  {
    "type": "EGRESOS",
    "category": "Tarjetas de Credito",
    "concept": "Mastercard",
    "row": 17
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Epec San Esteban",
    "row": 21
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Epec Duomo",
    "row": 22
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Epec Casonas",
    "row": 23
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Ecogas San Esteban",
    "row": 24
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Ecogas Casonas",
    "row": 25
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Ecogas Duomo",
    "row": 26
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Emos San Esteban",
    "row": 27
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Agua  Duomo",
    "row": 28
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Expensas San Esteban",
    "row": 29
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Expensas Duomo",
    "row": 30
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Expensas Casonas",
    "row": 31
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Expensas Loma Alta",
    "row": 32
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Osde",
    "row": 33
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Seguro Peugeot Azul",
    "row": 34
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Seguro Peugeot Blanco",
    "row": 35
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Seguro Mercedes",
    "row": 36
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "DGR Automotor P Azul",
    "row": 37
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "DGR Automotor P Blanco",
    "row": 38
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "DGR Automotor M Benz",
    "row": 39
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Patente Muni  P Azul",
    "row": 40
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Patente Muni  P Blanco",
    "row": 41
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Patente Muni  M Benz",
    "row": 42
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Direc TV",
    "row": 43
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Wifi Santi",
    "row": 44
  },
  {
    "type": "EGRESOS",
    "category": "Impuestos",
    "concept": "Intercity",
    "row": 45
  },
  {
    "type": "EGRESOS",
    "category": "Servicios Varios",
    "concept": "Limpieza",
    "row": 49
  },
  {
    "type": "EGRESOS",
    "category": "Servicios Varios",
    "concept": "VEP Domestica",
    "row": 50
  },
  {
    "type": "EGRESOS",
    "category": "Servicios Varios",
    "concept": "Piletero",
    "row": 51
  },
  {
    "type": "EGRESOS",
    "category": "Servicios Varios",
    "concept": "Jardinero",
    "row": 52
  },
  {
    "type": "EGRESOS",
    "category": "Mensualidad",
    "concept": "Santi",
    "row": 56
  },
  {
    "type": "EGRESOS",
    "category": "Mensualidad",
    "concept": "UCA Santi",
    "row": 57
  },
  {
    "type": "EGRESOS",
    "category": "Mensualidad",
    "concept": "Guada",
    "row": 58
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Comida",
    "row": 62
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Nafta",
    "row": 63
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Compra USD",
    "row": 64
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Psicologa",
    "row": 65
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Abogada",
    "row": 66
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Uru Cure",
    "row": 67
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "UCAP Tucky",
    "row": 68
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Autonomos",
    "row": 69
  },
  {
    "type": "EGRESOS",
    "category": "Varios",
    "concept": "Varios",
    "row": 70
  }
];

const fileEnv = await readEnv(join(ROOT_DIR, '.env'));
const runtimeEnv = typeof process === 'undefined' ? {} : process.env;
const env = { ...fileEnv, ...runtimeEnv };
const credentialsPath = env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccountJson = env.GOOGLE_SERVICE_ACCOUNT_JSON;
const spreadsheetId = env.GOOGLE_SHEET_ID;
const accessCode = env.APP_ACCESS_CODE || '';

if ((!credentialsPath && !serviceAccountJson) || !spreadsheetId) {
  console.error('Faltan credenciales de Google o GOOGLE_SHEET_ID');
  throw new Error('Configuracion incompleta');
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://' + req.headers.host);
    if (req.method === 'GET' && url.pathname === '/api/catalogo') return sendJson(res, 200, { months: MONTHS, concepts: CONCEPTS });
    if (req.method === 'GET' && url.pathname === '/api/config') return sendJson(res, 200, { accessCodeRequired: Boolean(accessCode) });
    if (req.method === 'POST' && url.pathname === '/api/gastos') return sendJson(res, 201, await createExpense(await readJson(req)));
    if (req.method === 'GET') return serveStatic(res, url.pathname);
    sendJson(res, 404, { error: 'No encontrado' });
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, { error: error.statusCode ? error.message : 'No se pudo guardar el gasto' });
  }
}).listen(PORT, () => console.log('Mini web lista en http://localhost:' + PORT));

async function createExpense(body) {
  validateAccessCode(body.codigo_acceso);

  const amount = parseAmount(body.importe);
  const month = MONTHS.find((item) => item.column === String(body.mes_columna || '').trim());
  const category = String(body.categoria || '').trim();
  const concept = CONCEPTS.find((item) => item.concept === String(body.concepto || '').trim() && item.category === category);
  const description = '';
  const fechaGasto = new Date().toISOString().slice(0, 10);
  const persona = String(body.persona || 'Mama').trim();

  if (!amount || amount <= 0) throw validationError('Importe invalido');
  if (!month) throw validationError('Mes requerido');
  if (!category) throw validationError('Categoria requerida');
  if (!concept) throw validationError('Concepto requerido');

  await ensureLogSheet();

  const id = 'TCK-' + Date.now();
  const now = new Date().toISOString();
  const targetRange = "'" + MAIN_SHEET_NAME + "'!" + month.column + concept.row;
  const currentRows = await getValues(targetRange, 'UNFORMATTED_VALUE');
  const previousValue = parseAmount(currentRows?.[0]?.[0] ?? 0);
  const newValue = previousValue + amount;

  await updateValues(targetRange, [[newValue]]);
  await appendValues("'" + LOG_SHEET_NAME + "'!A1:O", [[
    id,
    now,
    fechaGasto,
    persona,
    concept.category,
    concept.concept,
    month.label,
    month.column,
    concept.row,
    amount,
    description,
    previousValue,
    newValue,
    MAIN_SHEET_NAME + '!' + month.column + concept.row,
    'cargado',
  ]]);

  return {
    id,
    estado: 'cargado',
    importe: amount,
    mes: month.label,
    categoria: concept.category,
    concepto: concept.concept,
    destino: MAIN_SHEET_NAME + '!' + month.column + concept.row,
    valorAnterior: previousValue,
    valorNuevo: newValue,
  };
}

async function ensureLogSheet() {
  const metadata = await getSpreadsheetMetadata();
  const exists = metadata.sheets?.some((sheet) => sheet.properties?.title === LOG_SHEET_NAME);
  if (!exists) {
    await batchUpdate({ requests: [{ addSheet: { properties: { title: LOG_SHEET_NAME } } }] });
    await updateValues("'" + LOG_SHEET_NAME + "'!A1:O1", [LOG_HEADERS]);
  }
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateAccessCode(code) {
  if (accessCode && String(code || '') !== accessCode) throw validationError('Codigo de acceso incorrecto');
}

async function appendValues(range, values) {
  const accessToken = await getAccessToken();
  const url = new URL('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(range) + ':append');
  url.searchParams.set('valueInputOption', 'USER_ENTERED');
  url.searchParams.set('insertDataOption', 'INSERT_ROWS');
  const response = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer ' + accessToken, 'content-type': 'application/json' }, body: JSON.stringify({ values }) });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function getValues(range, valueRenderOption = 'FORMATTED_VALUE') {
  const accessToken = await getAccessToken();
  const url = new URL('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(range));
  url.searchParams.set('valueRenderOption', valueRenderOption);
  const response = await fetch(url, { headers: { authorization: 'Bearer ' + accessToken } });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data.values || [];
}

async function updateValues(range, values) {
  const accessToken = await getAccessToken();
  const url = new URL('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(range));
  url.searchParams.set('valueInputOption', 'USER_ENTERED');
  const response = await fetch(url, {
    method: 'PUT',
    headers: { authorization: 'Bearer ' + accessToken, 'content-type': 'application/json' },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function getSpreadsheetMetadata() {
  const accessToken = await getAccessToken();
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '?fields=sheets.properties.title', { headers: { authorization: 'Bearer ' + accessToken } });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function batchUpdate(payload) {
  const accessToken = await getAccessToken();
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + ':batchUpdate', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + accessToken, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function getAccessToken() {
  const key = serviceAccountJson ? JSON.parse(serviceAccountJson) : JSON.parse(await readFile(credentialsPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const unsigned = header + '.' + claim;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = unsigned + '.' + signer.sign(key.private_key, 'base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data.access_token;
}

async function serveStatic(res, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = normalize(join(PUBLIC_DIR, requestedPath));
  if (!filePath.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { error: 'No permitido' });
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'content-type': contentType(filePath) });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: 'No encontrado' });
  }
}

function contentType(filePath) {
  return { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' }[extname(filePath)] || 'application/octet-stream';
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || '{}');
}

async function readEnv(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    return Object.fromEntries(content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }));
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw error;
  }
}

function parseAmount(value) {
  const raw = String(value || '').trim().replace(/[$\s]/g, '');
  if (!raw || raw === '-') return 0;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/\./g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}
