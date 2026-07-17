/* =========================================================
   AIR PARTY — app.js
   Login + Agenda + Diseños + Instalación de climas
   Persistencia local con localStorage (proyecto 100% local)
========================================================= */

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/* ---------------------------------------------------------
   LOGIN (index.html)
--------------------------------------------------------- */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    // Validación simple de demo (sin backend real)
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido || password.length < 4) {
      errorMsg.style.display = 'block';
      return;
    }
    errorMsg.style.display = 'none';

    localStorage.setItem('airparty_session', JSON.stringify({
      email: email,
      nombre: email.split('@')[0]
    }));

    window.location.href = 'dashboard.html';
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
    showToast('Escribe un título para la cita.');
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
  showToast('Cita agregada a la agenda 🎉');
}

function eliminarEvento(id) {
  setEventos(getEventos().filter(ev => ev.id !== id));
  pintarCalendario();
  pintarEventos();
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
  showToast('Diseño guardado como favorito ⭐');
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
    showToast('Ingresa al menos el cliente y la fecha.');
    return;
  }

  const lista = getInstalaciones();
  lista.push({
    id: Date.now(),
    cliente, telefono, direccion, tipo, fecha, notas,
    estado: 'pendiente'
  });
  setInstalaciones(lista);

  ['insCliente','insTelefono','insDireccion','insFecha','insNotas'].forEach(id => document.getElementById(id).value = '');

  pintarInstalaciones();
  showToast('Instalación programada ❄️');
}

function siguienteEstado(estado) {
  if (estado === 'pendiente') return 'confirmada';
  if (estado === 'confirmada') return 'completada';
  return 'pendiente';
}

function cambiarEstado(id) {
  const lista = getInstalaciones();
  const item = lista.find(i => i.id === id);
  if (item) item.estado = siguienteEstado(item.estado);
  setInstalaciones(lista);
  pintarInstalaciones();
}

function eliminarInstalacion(id) {
  setInstalaciones(getInstalaciones().filter(i => i.id !== id));
  pintarInstalaciones();
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
      <td>${i.tipo}</td>
      <td>${i.fecha}</td>
      <td><span class="badge badge-${i.estado}" onclick="cambiarEstado(${i.id})" title="Clic para cambiar estado">${etiquetaEstado(i.estado)}</span></td>
      <td><button class="del" style="background:transparent;color:#C0392B;font-weight:800;font-size:13px;" onclick="eliminarInstalacion(${i.id})">Quitar</button></td>
    </tr>
  `).join('');
}

function etiquetaEstado(estado) {
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'confirmada') return 'Confirmada';
  return 'Completada';
}
