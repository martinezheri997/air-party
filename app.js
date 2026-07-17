/* =========================================================
   AIR PARTY — app.js
   Login + Agenda + Diseños + Instalación de climas
   Persistencia local con localStorage (proyecto 100% local)
========================================================= */

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/* ---------------------------------------------------------
   NOTIFICACIONES (buenas prácticas: login, compra, avisos)
--------------------------------------------------------- */
function crearContenedorNotifSiFalta() {
  let cont = document.getElementById('notifContainer');
  if (!cont) {
    cont = document.createElement('div');
    cont.className = 'notif-container';
    cont.id = 'notifContainer';
    document.body.appendChild(cont);
  }
  return cont;
}

const ICONOS_NOTIF = { success: '✅', error: '⚠️', info: 'ℹ️' };

function showNotification(tipo, titulo, mensaje) {
  const cont = crearContenedorNotifSiFalta();
  const notif = document.createElement('div');
  notif.className = 'notif ' + tipo;
  notif.innerHTML = `
    <div class="icon">${ICONOS_NOTIF[tipo] || 'ℹ️'}</div>
    <div class="txt"><strong>${titulo}</strong><span>${mensaje}</span></div>
  `;
  cont.appendChild(notif);
  requestAnimationFrame(() => notif.classList.add('show'));

  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 400);
  }, 4200);
}

// Compatibilidad con el sistema anterior de toasts
function showToast(msg) {
  showNotification('info', 'Aviso', msg);
}

/* ---------------------------------------------------------
   HASHEO DE CONTRASEÑAS (SHA-256 con Web Crypto API)
   Nota: esto es una demo de front-end. En un sistema real,
   el hasheo (idealmente con sal + bcrypt/argon2) debe hacerse
   y validarse en un servidor, nunca solo en el navegador.
--------------------------------------------------------- */
async function hashPassword(texto) {
  const datos = new TextEncoder().encode(texto + '::airparty_salt_demo');
  const buffer = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsuarios() {
  return JSON.parse(localStorage.getItem('airparty_usuarios') || '[]');
}
function setUsuarios(lista) {
  localStorage.setItem('airparty_usuarios', JSON.stringify(lista));
}

/* ---------------------------------------------------------
   CAPTCHA VISUAL (100% local, sin servicios externos)
--------------------------------------------------------- */
const captchaValores = { login: '', registro: '' };
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCaptcha(modo) {
  const canvasId = modo === 'registro' ? 'captchaCanvasReg' : 'captchaCanvas';
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  let codigo = '';
  for (let i = 0; i < 5; i++) codigo += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  captchaValores[modo] = codigo;

  // Fondo
  ctx.fillStyle = '#EAF6FC';
  ctx.fillRect(0, 0, w, h);

  // Líneas de ruido
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(30,136,199,${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  // Texto distorsionado
  const espacio = w / (codigo.length + 1);
  for (let i = 0; i < codigo.length; i++) {
    ctx.save();
    const x = espacio * (i + 1);
    const y = h / 2 + (Math.random() * 10 - 5);
    ctx.translate(x, y);
    ctx.rotate((Math.random() * 30 - 15) * Math.PI / 180);
    ctx.font = 'bold 26px Nunito, sans-serif';
    ctx.fillStyle = Math.random() > 0.5 ? '#1E88C7' : '#1B3A4B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(codigo[i], 0, 0);
    ctx.restore();
  }

  // Puntos de ruido
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(27,58,75,${Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function validarCaptcha(modo, valorIngresado) {
  return (valorIngresado || '').trim().toUpperCase() === captchaValores[modo];
}

/* ---------------------------------------------------------
   LOGIN / REGISTRO (index.html)
--------------------------------------------------------- */
const loginForm = document.getElementById('loginForm');
const registroForm = document.getElementById('registroForm');

if (loginForm || registroForm) {
  generarCaptcha('login');
  generarCaptcha('registro');
}

function cambiarModoAuth(modo) {
  const esLogin = modo === 'login';
  document.getElementById('btnModoLogin').classList.toggle('active', esLogin);
  document.getElementById('btnModoRegistro').classList.toggle('active', !esLogin);
  loginForm.style.display = esLogin ? 'block' : 'none';
  registroForm.style.display = esLogin ? 'none' : 'block';
  generarCaptcha(esLogin ? 'login' : 'registro');
}

if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const captchaTexto = document.getElementById('captchaInput').value;
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.style.display = 'none';

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido || password.length < 4) {
      errorMsg.textContent = 'Escribe un correo válido y una contraseña de al menos 4 caracteres.';
      errorMsg.style.display = 'block';
      return;
    }

    if (!validarCaptcha('login', captchaTexto)) {
      errorMsg.textContent = 'El código del CAPTCHA no coincide. Intenta de nuevo.';
      errorMsg.style.display = 'block';
      showNotification('error', 'CAPTCHA incorrecto', 'Verifica el código de la imagen.');
      generarCaptcha('login');
      document.getElementById('captchaInput').value = '';
      return;
    }

    const hash = await hashPassword(password);
    const usuarios = getUsuarios();
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario || usuario.hash !== hash) {
      errorMsg.textContent = 'Correo o contraseña incorrectos. Intenta de nuevo.';
      errorMsg.style.display = 'block';
      showNotification('error', 'Inicio de sesión fallido', 'Revisa tus credenciales.');
      generarCaptcha('login');
      document.getElementById('captchaInput').value = '';
      return;
    }

    localStorage.setItem('airparty_session', JSON.stringify({
      email: usuario.email,
      nombre: usuario.nombre
    }));
    localStorage.setItem('airparty_ultimo_login', new Date().toLocaleString('es-MX'));

    window.location.href = 'dashboard.html';
  });
}

if (registroForm) {
  registroForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const captchaTexto = document.getElementById('captchaInputReg').value;
    const errorMsg = document.getElementById('errorMsgRegistro');
    const successMsg = document.getElementById('successMsgRegistro');
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nombre || !emailValido || password.length < 4) {
      errorMsg.textContent = 'Completa nombre, correo válido y una contraseña de al menos 4 caracteres.';
      errorMsg.style.display = 'block';
      return;
    }

    if (!validarCaptcha('registro', captchaTexto)) {
      errorMsg.textContent = 'El código del CAPTCHA no coincide. Intenta de nuevo.';
      errorMsg.style.display = 'block';
      showNotification('error', 'CAPTCHA incorrecto', 'Verifica el código de la imagen.');
      generarCaptcha('registro');
      document.getElementById('captchaInputReg').value = '';
      return;
    }

    const usuarios = getUsuarios();
    if (usuarios.some(u => u.email === email)) {
      errorMsg.textContent = 'Ya existe una cuenta con ese correo. Inicia sesión.';
      errorMsg.style.display = 'block';
      return;
    }

    const hash = await hashPassword(password);
    usuarios.push({ nombre, email, hash });
    setUsuarios(usuarios);

    successMsg.textContent = 'Cuenta creada correctamente. Ahora puedes iniciar sesión.';
    successMsg.style.display = 'block';
    showNotification('success', 'Cuenta creada', 'Tu contraseña se guardó de forma segura (hash SHA-256).');
    registroForm.reset();
    generarCaptcha('registro');

    setTimeout(() => cambiarModoAuth('login'), 1200);
  });
}

/* ---------------------------------------------------------
   DASHBOARD — sesión + navegación por pestañas
--------------------------------------------------------- */
const appShell = document.querySelector('.app-shell');
if (appShell) {
  const sesion = JSON.parse(localStorage.getItem('airparty_session') || 'null');
  if (!sesion) {
    window.location.href = 'index.html';
  } else {
    const nombre = sesion.nombre.charAt(0).toUpperCase() + sesion.nombre.slice(1);
    document.getElementById('userName').textContent = nombre;
    document.getElementById('userAvatar').textContent = nombre.charAt(0).toUpperCase();

    // Notificación de buenas prácticas: confirmar inicio de sesión exitoso (una sola vez por sesión)
    if (!sessionStorage.getItem('airparty_notif_login_mostrada')) {
      showNotification('success', 'Inicio de sesión exitoso', `Bienvenido, ${nombre}. Último acceso: ${localStorage.getItem('airparty_ultimo_login') || 'N/D'}`);
      sessionStorage.setItem('airparty_notif_login_mostrada', '1');
    }
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });

  initAgenda();
  initDisenos();
  initInstalacion();
}

function cerrarSesion() {
  localStorage.removeItem('airparty_session');
  sessionStorage.removeItem('airparty_notif_login_mostrada');
  window.location.href = 'index.html';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------------------------------------------------------
   AGENDA
--------------------------------------------------------- */
let calFecha = new Date();
let fechaSeleccionada = new Date();

function initAgenda() {
  pintarCalendario();
  pintarEventos();
}

function cambiarMes(delta) {
  calFecha.setMonth(calFecha.getMonth() + delta);
  pintarCalendario();
}

function keyFecha(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getEventos() {
  return JSON.parse(localStorage.getItem('airparty_eventos') || '[]');
}
function setEventos(lista) {
  localStorage.setItem('airparty_eventos', JSON.stringify(lista));
}

function pintarCalendario() {
  const year = calFecha.getFullYear();
  const month = calFecha.getMonth();
  document.getElementById('calMonthLabel').textContent = MESES[month] + ' ' + year;

  const primerDia = new Date(year, month, 1).getDay();
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const hoy = new Date();
  const eventos = getEventos();
  const diasConEvento = new Set(eventos.map(ev => ev.fecha));

  const cont = document.getElementById('calDays');
  cont.innerHTML = '';

  for (let i = 0; i < primerDia; i++) {
    const vacio = document.createElement('div');
    vacio.className = 'cal-day empty';
    cont.appendChild(vacio);
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const celda = document.createElement('div');
    const fechaCelda = new Date(year, month, dia);
    const key = keyFecha(fechaCelda);
    celda.className = 'cal-day';
    celda.textContent = dia;

    if (fechaCelda.toDateString() === hoy.toDateString()) celda.classList.add('today');
    if (diasConEvento.has(key)) celda.classList.add('has-event');
    if (fechaCelda.toDateString() === fechaSeleccionada.toDateString()) celda.classList.add('selected');

    celda.addEventListener('click', () => {
      fechaSeleccionada = fechaCelda;
      document.getElementById('evFecha').value = dia + ' de ' + MESES[month] + ', ' + year;
      pintarCalendario();
    });

    cont.appendChild(celda);
  }

  document.getElementById('evFecha').value =
    fechaSeleccionada.getDate() + ' de ' + MESES[fechaSeleccionada.getMonth()] + ', ' + fechaSeleccionada.getFullYear();
}

function agregarEvento() {
  const titulo = document.getElementById('evTitulo').value.trim();
  const hora = document.getElementById('evHora').value;

  if (!titulo) {
    showNotification('error', 'Falta información', 'Escribe un título para la cita.');
    return;
  }

  const eventos = getEventos();
  eventos.push({
    id: Date.now(),
    titulo: titulo,
    fecha: keyFecha(fechaSeleccionada),
    fechaLegible: fechaSeleccionada.getDate() + ' ' + MESES[fechaSeleccionada.getMonth()].slice(0,3) + ', ' + fechaSeleccionada.getFullYear(),
    hora: hora || '--:--'
  });
  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  setEventos(eventos);

  document.getElementById('evTitulo').value = '';
  document.getElementById('evHora').value = '';

  pintarCalendario();
  pintarEventos();
  showNotification('success', 'Cita agendada', `"${titulo}" se agregó a la agenda.`);
}

function eliminarEvento(id) {
  setEventos(getEventos().filter(ev => ev.id !== id));
  pintarCalendario();
  pintarEventos();
  showNotification('info', 'Cita eliminada', 'Se quitó la cita de la agenda.');
}

function pintarEventos() {
  const cont = document.getElementById('eventsList');
  const eventos = getEventos();

  if (eventos.length === 0) {
    cont.innerHTML = '<p class="empty-note">No hay citas programadas todavía.</p>';
    return;
  }

  cont.innerHTML = eventos.map(ev => `
    <div class="event-item">
      <div class="dot"></div>
      <div class="info">
        <strong>${ev.titulo}</strong>
        <span>${ev.fechaLegible} · ${ev.hora}</span>
      </div>
      <button class="del" onclick="eliminarEvento(${ev.id})">Quitar</button>
    </div>
  `).join('');
}

/* ---------------------------------------------------------
   DISEÑOS (temáticas divertidas de climas)
--------------------------------------------------------- */
const TEMAS = [
  { id: 'selva', nombre: 'Selva Tropical', emoji: '🌴', desc: 'Hojas, loros y frescura de jungla para el equipo.', color1: '#8FE3B0', color2: '#3CB878' },
  { id: 'confeti', nombre: 'Fiesta de Confeti', emoji: '🎉', desc: 'Colores vivos y confeti estampado, pura celebración.', color1: '#FFD166', color2: '#FF8A80' },
  { id: 'espacio', nombre: 'Espacio Neón', emoji: '🚀', desc: 'Estrellas, planetas y luces neón nocturnas.', color1: '#7B6CF6', color2: '#2C2A6B' },
  { id: 'arcade', nombre: 'Retro Arcade', emoji: '🕹️', desc: 'Pixel art y colores arcade de los 80s.', color1: '#FF6EC7', color2: '#5CC8FF' },
  { id: 'playa', nombre: 'Playa de Verano', emoji: '🏖️', desc: 'Olas, coco y vibra costera todo el año.', color1: '#5CD3FF', color2: '#FFE29A' },
  { id: 'nieve', nombre: 'Fiesta de Nieve', emoji: '❄️', desc: 'Copos de nieve y azules helados, muy fresh.', color1: '#CDEFFF', color2: '#4FC3E8' },
];

const SWATCHES = ['#4FC3E8', '#1E88C7', '#FFD166', '#FF8A80', '#3CB878', '#7B6CF6', '#FF6EC7'];

let temaActivo = null;
let colorActivo = null;

function getFavoritos() {
  return JSON.parse(localStorage.getItem('airparty_favoritos') || '{}');
}
function setFavoritos(obj) {
  localStorage.setItem('airparty_favoritos', JSON.stringify(obj));
}

function initDisenos() {
  const grid = document.getElementById('designsGrid');
  const favoritos = getFavoritos();

  grid.innerHTML = TEMAS.map(t => {
    const fav = favoritos[t.id];
    const c1 = fav ? fav.color : t.color1;
    return `
      <div class="design-card ${fav ? 'favorito' : ''}" id="card-${t.id}">
        <div class="design-preview" style="background:linear-gradient(135deg, ${c1}, ${t.color2});">
          ${t.emoji}
        </div>
        <div class="design-body">
          <h4>${t.nombre}</h4>
          <p>${t.desc}</p>
          <div class="design-actions">
            <button class="btn btn-primary btn-sm" onclick="abrirCustomizer('${t.id}')">Personalizar</button>
            ${fav ? '<span class="btn btn-ghost btn-sm">⭐ Favorito</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function abrirCustomizer(id) {
  temaActivo = TEMAS.find(t => t.id === id);
  const favoritos = getFavoritos();
  colorActivo = (favoritos[id] && favoritos[id].color) || temaActivo.color1;

  document.getElementById('custTitle').textContent = 'Personalizar — ' + temaActivo.nombre;

  const swatchesCont = document.getElementById('custSwatches');
  swatchesCont.innerHTML = SWATCHES.map(c => `
    <div class="swatch ${c === colorActivo ? 'selected' : ''}" style="background:${c}" onclick="elegirColor('${c}')"></div>
  `).join('');

  actualizarPreview();
  document.getElementById('customizerPanel').classList.add('active');
  document.getElementById('customizerPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function elegirColor(c) {
  colorActivo = c;
  document.querySelectorAll('#custSwatches .swatch').forEach(s => s.classList.remove('selected'));
  event.target.classList.add('selected');
  actualizarPreview();
}

function actualizarPreview() {
  const prev = document.getElementById('custPreview');
  prev.style.background = `linear-gradient(135deg, ${colorActivo}, ${temaActivo.color2})`;
  prev.textContent = temaActivo.emoji;
}

function guardarFavorito() {
  const favoritos = getFavoritos();
  favoritos[temaActivo.id] = { color: colorActivo };
  setFavoritos(favoritos);
  cerrarCustomizer();
  initDisenos();
  showNotification('success', 'Diseño guardado', `"${temaActivo.nombre}" se guardó como favorito.`);
}

function cerrarCustomizer() {
  document.getElementById('customizerPanel').classList.remove('active');
}

/* ---------------------------------------------------------
   INSTALACIÓN DE CLIMAS
--------------------------------------------------------- */
function getInstalaciones() {
  return JSON.parse(localStorage.getItem('airparty_instalaciones') || '[]');
}
function setInstalaciones(lista) {
  localStorage.setItem('airparty_instalaciones', JSON.stringify(lista));
}

function initInstalacion() {
  pintarInstalaciones();
}

function agregarInstalacion() {
  const cliente = document.getElementById('insCliente').value.trim();
  const telefono = document.getElementById('insTelefono').value.trim();
  const direccion = document.getElementById('insDireccion').value.trim();
  const tipo = document.getElementById('insTipo').value;
  const fecha = document.getElementById('insFecha').value;
  const notas = document.getElementById('insNotas').value.trim();

  if (!cliente || !fecha) {
    showNotification('error', 'Falta información', 'Ingresa al menos el cliente y la fecha.');
    return;
  }

  const lista = getInstalaciones();
  const nuevaInstalacion = {
    id: Date.now(),
    cliente, telefono, direccion, tipo, fecha, notas,
    estado: 'pendiente',
    pagado: false,
    recibo: null
  };
  lista.push(nuevaInstalacion);
  setInstalaciones(lista);

  ['insCliente','insTelefono','insDireccion','insFecha','insNotas'].forEach(id => document.getElementById(id).value = '');

  pintarInstalaciones();
  showNotification('success', 'Instalación programada', `Se agendó la instalación para ${cliente}. Continúa con el pago.`);

  // Al dar de alta la cita, se envía directo a pagar (simulación PayPal + sello digital)
  abrirModalPago(nuevaInstalacion.id);
}

function siguienteEstado(estado) {
  if (estado === 'pendiente') return 'confirmada';
  if (estado === 'confirmada') return 'completada';
  return 'pendiente';
}

function cambiarEstado(id) {
  const lista = getInstalaciones();
  const item = lista.find(i => i.id === id);
  if (item) {
    item.estado = siguienteEstado(item.estado);
    setInstalaciones(lista);
    pintarInstalaciones();
    showNotification('info', 'Estado actualizado', `${item.cliente}: ahora está "${etiquetaEstado(item.estado)}".`);
  }
}

function eliminarInstalacion(id) {
  setInstalaciones(getInstalaciones().filter(i => i.id !== id));
  pintarInstalaciones();
  showNotification('info', 'Instalación eliminada', 'Se quitó de la lista de instalaciones.');
}

function pintarInstalaciones() {
  const lista = getInstalaciones();
  const body = document.getElementById('installTableBody');
  const empty = document.getElementById('installEmpty');

  if (lista.length === 0) {
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = lista.map(i => `
    <tr>
      <td><strong>${i.cliente}</strong><br><span style="color:#5B7A88;font-size:12px;">${i.telefono || ''}</span></td>
      <td>${i.tipo}<br><span style="color:#5B7A88;font-size:12px;">${formatoMoneda(precioPorTipo(i.tipo))}</span></td>
      <td>${i.fecha}</td>
      <td><span class="badge badge-${i.estado}" onclick="cambiarEstado(${i.id})" title="Clic para cambiar estado">${etiquetaEstado(i.estado)}</span></td>
      <td style="white-space:nowrap;">
        ${i.pagado
          ? `<button class="btn btn-ghost btn-sm" onclick="verRecibo(${i.id})">Ver recibo</button>`
          : `<button class="btn btn-spark btn-sm" onclick="abrirModalPago(${i.id})">Pagar</button>`
        }
        <button class="del" style="background:transparent;color:#C0392B;font-weight:800;font-size:13px;" onclick="eliminarInstalacion(${i.id})">Quitar</button>
      </td>
    </tr>
  `).join('');
}

/* ---------------------------------------------------------
   PRECIOS por tipo de equipo
--------------------------------------------------------- */
const PRECIOS_TIPO = {
  'Mini split — Temática Selva Tropical': 8500,
  'Mini split — Temática Fiesta de Confeti': 8900,
  'Mini split — Temática Espacio Neón': 9200,
  'Mini split — Temática Retro Arcade': 9200,
  'Ventana — Diseño clásico Air Party': 6500
};

function precioPorTipo(tipo) {
  return PRECIOS_TIPO[tipo] || 8000;
}

function formatoMoneda(num) {
  return '$' + num.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN';
}

function etiquetaEstado(estado) {
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'confirmada') return 'Confirmada';
  return 'Completada';
}

/* ---------------------------------------------------------
   PAGO SIMULADO (PayPal) + RECIBO CON SELLO DIGITAL
   Nota: esto es una simulación educativa/visual. No procesa
   pagos reales ni se conecta con la API oficial de PayPal.
   Una integración real requiere un backend que verifique la
   transacción con las credenciales oficiales de PayPal.
--------------------------------------------------------- */
let idInstalacionEnPago = null;

function abrirModalPago(id) {
  const item = getInstalaciones().find(i => i.id === id);
  if (!item) return;
  idInstalacionEnPago = id;

  document.getElementById('pagoResumen').textContent = `${item.tipo} — Cliente: ${item.cliente}`;
  document.getElementById('pagoMonto').textContent = formatoMoneda(precioPorTipo(item.tipo));
  document.getElementById('pagoEmail').value = '';

  document.getElementById('pagoStepCheckout').style.display = 'block';
  document.getElementById('pagoStepProcesando').style.display = 'none';
  document.getElementById('pagoStepRecibo').style.display = 'none';
  document.getElementById('pagoModal').classList.add('active');
}

function cerrarModalPago() {
  document.getElementById('pagoModal').classList.remove('active');
  idInstalacionEnPago = null;
}

async function confirmarPago() {
  const email = document.getElementById('pagoEmail').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotification('error', 'Correo inválido', 'Ingresa un correo de PayPal válido para continuar.');
    return;
  }

  document.getElementById('pagoStepCheckout').style.display = 'none';
  document.getElementById('pagoStepProcesando').style.display = 'block';

  const item = getInstalaciones().find(i => i.id === idInstalacionEnPago);
  if (!item) return;

  // Simulación del tiempo de procesamiento de PayPal
  setTimeout(async () => {
    const monto = precioPorTipo(item.tipo);
    const folio = 'AP-' + Date.now().toString().slice(-8);
    const fechaPago = new Date().toLocaleString('es-MX');

    // "Sello"/código de verificación: hash del folio + datos de la orden
    const firma = await hashPassword(folio + item.cliente + monto + fechaPago);
    const codigoVerificacion = firma.slice(0, 16).toUpperCase();

    const recibo = {
      folio, cliente: item.cliente, tipo: item.tipo, monto,
      email, fecha: fechaPago, codigo: codigoVerificacion
    };

    // Guardar recibo y marcar instalación como pagada
    const lista = getInstalaciones();
    const itemActualizado = lista.find(i => i.id === idInstalacionEnPago);
    itemActualizado.pagado = true;
    itemActualizado.recibo = recibo;
    setInstalaciones(lista);

    const recibos = JSON.parse(localStorage.getItem('airparty_recibos') || '[]');
    recibos.push(recibo);
    localStorage.setItem('airparty_recibos', JSON.stringify(recibos));

    pintarRecibo(recibo);
    pintarInstalaciones();
    showNotification('success', 'Pago simulado exitoso', `Recibo ${folio} generado correctamente.`);

    document.getElementById('pagoStepProcesando').style.display = 'none';
    document.getElementById('pagoStepRecibo').style.display = 'block';
  }, 1400);
}

function verRecibo(id) {
  const item = getInstalaciones().find(i => i.id === id);
  if (!item || !item.recibo) return;
  idInstalacionEnPago = id;
  pintarRecibo(item.recibo);
  document.getElementById('pagoStepCheckout').style.display = 'none';
  document.getElementById('pagoStepProcesando').style.display = 'none';
  document.getElementById('pagoStepRecibo').style.display = 'block';
  document.getElementById('pagoModal').classList.add('active');
}

function pintarRecibo(recibo) {
  document.getElementById('reciboContenido').innerHTML = `
    <h4>Recibo de pago — Air Party</h4>
    <p class="folio">Folio: ${recibo.folio}</p>

    <div class="recibo-row"><span>Cliente</span><strong>${recibo.cliente}</strong></div>
    <div class="recibo-row"><span>Servicio</span><strong>${recibo.tipo}</strong></div>
    <div class="recibo-row"><span>Correo PayPal</span><strong>${recibo.email}</strong></div>
    <div class="recibo-row"><span>Fecha de pago</span><strong>${recibo.fecha}</strong></div>
    <div class="recibo-row"><span>Total pagado</span><strong>${formatoMoneda(recibo.monto)}</strong></div>

    <div class="sello">
      <div class="badge-check">✓</div>
      <div class="info">
        <strong>Pago validado — sello digital Air Party</strong>
        <span>Código de verificación: ${recibo.codigo}</span>
      </div>
    </div>

    <p class="recibo-note">
      Documento generado automáticamente como comprobante interno. Este sello es una simulación
      visual/educativa de validación y no constituye una firma electrónica legalmente vinculante
      ni una confirmación oficial de PayPal.
    </p>
  `;
}

function imprimirRecibo() {
  window.print();
}