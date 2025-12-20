# 🚀 Guía de Desarrollo - Clinic System

## 📁 Estructura del Proyecto

```
Clinic-Systems-III/
├── src/                    # Backend (Node.js + Express)
├── vue-project/           # Frontend (Vue 3 + Vite + Tailwind)
├── database/              # Migraciones y modelos de Sequelize
└── server.js              # Servidor principal de Node.js
```

## 🏃‍♂️ Ejecutar el Proyecto

### Opción 1: Ejecutar Todo junto (RECOMENDADO) ⭐

```bash
npm run dev:fullstack
```

Este comando ejecuta:
- 🔷 **Backend (API)** en `http://localhost:3000`
- 🟣 **Frontend (Vue)** en `http://localhost:5173`

### Opción 2: Ejecutar por separado

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd vue-project
npm run dev
```

## 🔧 Configuración

### Backend (Node.js + Express)
- **Puerto**: 3000
- **Base de datos**: MySQL (configurar en `.env`)
- **CORS**: Habilitado para `http://localhost:5173`

### Frontend (Vue 3 + Vite)
- **Puerto**: 5173
- **Proxy API**: Las peticiones a `/api/*` se redirigen automáticamente a `http://localhost:3000`
- **Estilos**: Tailwind CSS v3

## 📡 Hacer Peticiones a la API

En tus componentes Vue, puedes hacer peticiones directamente a `/api`:

```javascript
// ✅ Correcto - El proxy se encarga de redirigir a localhost:3000
const response = await fetch('/api/care-units')

// ✅ También con axios
import axios from 'axios'
const response = await axios.get('/api/care-units')
```

## 🔑 Variables de Entorno

Crea un archivo `.env` en la raíz con:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=clinic_db
```

## 📦 Instalación Inicial

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd vue-project
npm install
```

## 🛠️ Scripts Disponibles

### Backend (raíz del proyecto)
- `npm run dev` - Servidor con hot-reload (nodemon)
- `npm start` - Servidor en producción
- `npm run dev:fullstack` - Backend + Frontend simultáneamente
- `npm run seed` - Ejecutar seeders
- `npm run seed:undo` - Deshacer seeders

### Frontend (carpeta vue-project)
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run preview` - Preview de producción

## 🎨 Tailwind CSS

Tailwind está configurado y listo para usar. Algunas clases útiles:

```html
<!-- Colores -->
<div class="bg-blue-500 text-white">Azul</div>

<!-- Layout -->
<div class="flex items-center justify-center">Centrado</div>

<!-- Responsive -->
<div class="w-full md:w-1/2 lg:w-1/3">Responsive</div>

<!-- Hover -->
<button class="hover:bg-blue-700 transition">Hover</button>
```

## ⚡ Tips

1. **Hot Reload**: Ambos servidores tienen recarga automática
2. **Proxy**: No necesitas escribir `http://localhost:3000` en el frontend
3. **CORS**: Ya está configurado, no hay problemas de origen cruzado
4. **DevTools**: Vue DevTools está habilitado automáticamente

## 🐛 Solución de Problemas

### Error de CORS
- Verifica que el backend esté corriendo en el puerto 3000
- Verifica que `cors` esté instalado: `npm install cors`

### Tailwind no funciona
```bash
cd vue-project
npm run dev
# Presiona Ctrl+C y vuelve a ejecutar
```

### Los dos servidores no inician
```bash
# Asegúrate de estar en la raíz del proyecto
npm run dev:fullstack
```

## 📚 Recursos

- [Vue 3 Docs](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)

