# Air Party — Panel Web

Sitio estático (HTML/CSS/JS puro, sin backend) con:
- Login y registro con CAPTCHA visual y contraseñas hasheadas (SHA-256).
- Agenda con calendario.
- Diseños personalizables de climas con temáticas divertidas.
- Instalación de climas + recibo de pago simulado (sello estilo PayPal).

## Estructura
```
index.html        → Login / registro
dashboard.html     → Panel principal (Agenda, Diseños, Instalación)
style.css          → Estilos
app.js             → Lógica de la aplicación
vercel.json        → Configuración de Vercel (headers de seguridad, URLs limpias)
```

No requiere build ni instalación de dependencias: es 100% HTML/CSS/JS estático.

---

## Opción 1: Desplegar desde la web de Vercel (sin usar la terminal)

1. Sube esta carpeta a un repositorio de GitHub (crea uno nuevo en github.com, arrastra estos archivos o usa GitHub Desktop).
2. Entra a https://vercel.com y crea una cuenta (puedes usar tu cuenta de GitHub para entrar).
3. Clic en **"Add New..." → "Project"**.
4. Selecciona el repositorio que acabas de subir.
5. En **Framework Preset** elige **"Other"** (proyecto estático).
   - Build Command: dejar vacío
   - Output Directory: `.` (la raíz)
6. Clic en **Deploy**.
7. En un par de minutos te da una URL tipo `air-party.vercel.app`, ya con **HTTPS activado automáticamente**.

## Opción 2: Desplegar desde la terminal (Vercel CLI)

1. Instala Node.js si no lo tienes (nodejs.org).
2. Instala la CLI de Vercel:
   ```
   npm install -g vercel
   ```
3. Abre esta carpeta en la terminal (o en VS Code → Terminal → New Terminal) y ejecuta:
   ```
   vercel login
   vercel
   ```
4. Sigue las preguntas en pantalla (acepta las opciones por defecto). Al terminar te da una URL de vista previa.
5. Cuando quieras publicarlo en tu URL final/producción:
   ```
   vercel --prod
   ```

## Dominio propio (opcional)
Dentro del proyecto en el dashboard de Vercel, ve a **Settings → Domains** y agrega tu dominio (ej. `airparty.com`). Vercel configura el HTTPS de ese dominio automáticamente.

## Notas importantes
- Este proyecto guarda datos (usuarios, citas, instalaciones, recibos) en `localStorage` del navegador de cada visitante — no hay base de datos compartida ni backend real.
- El CAPTCHA, el hasheo de contraseñas y el "sello de PayPal" son mecanismos de demostración a nivel de front-end. Para un sistema en producción con usuarios reales, se recomienda agregar un backend (por ejemplo con Vercel Functions/Node.js) que valide todo esto del lado del servidor.
