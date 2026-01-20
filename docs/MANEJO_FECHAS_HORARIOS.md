# Estándar de Manejo de Fechas y Horarios (UTC Puro)

Este documento describe la política estricta de manejo de tiempo implementada en **Clinic Systems III** para resolver discrepancias de zona horaria entre el servidor, la base de datos y los clientes.

## 🚫 El Problema: "El Misterio de las 4 Horas"

Durante el desarrollo, se detectó un error crítico donde las citas y horarios se desplazaban automáticamente (ej: una cita agendada a las 08:00 AM se visualizaba como 04:00 AM o 12:00 PM).

**Causa Raíz:**
1.  **Interpretación Implícita:** Node.js y los navegadores intentan ser "inteligentes". Al recibir una fecha sin zona horaria (`2026-01-19 08:00:00`), asumen que está en la hora local de la máquina (Venezuela, GMT-4).
2.  **Conversión Automática:** Al serializar a JSON o guardar en DB, convierten esa hora "local" a UTC, sumando o restando 4 horas.
3.  **Resultado:** Los datos se corrompían visualmente dependiendo de quién los mirara (Servidor vs Cliente).

---

## ✅ La Solución: Protocolo "UTC Puro" (WYSIWYG)

Hemos implementado una política de **"Lo que ves es lo que es"** (What You See Is What You Get).

**Regla de Oro:**
> Si la base de datos dice `08:00`, el sistema debe mostrar `08:00` en todas partes, ignorando si el servidor está en Venezuela, AWS (EE.UU.) o Europa. El dato se trata como un valor absoluto, no relativo.

---

## ⚙️ Implementación Técnica

### 1. Nivel Base de Datos (Sequelize)
Configuración obligatoria en `database/config/database.js` para evitar que la librería cliente de MySQL intente "arreglar" las horas.

```javascript
module.exports = {
  development: {
    // ... credenciales ...
    timezone: '+00:00', // Fuerza a la conexión a trabajar en UTC neutro
    dialectOptions: {
      dateStrings: true, // Lee las fechas como strings literales ("2026-01-19 08:00:00")
      typeCast: true     // Evita la conversión automática a objetos Date de JS
    }
  }
};

```

### 2. Nivel Backend (Formateo Manual)

**PROHIBIDO:** Usar `new Date().getHours()` o librerías como `moment` sin configuración específica, ya que utilizan la hora local del sistema operativo del servidor.

**CORRECTO:** Usar funciones *helper* que fuerzan la interpretación UTC. Estas funciones se encuentran en los controladores (`DashboardController.js`) y servicios de IA (`IAContextService.js`).

**Patrón de Código Estándar:**

```javascript
const formatHoraUTC = (dateInput) => {
  if (!dateInput) return '--:--';

  // 1. Convertir a String y asegurar formato
  let dateStr = String(dateInput);
  
  // 2. TRUCO CLAVE: Agregar 'Z' al final si no la tiene.
  // Esto le dice a Javascript: "No asumas que esto es Venezuela. Esto es UTC".
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
  }
  
  const d = new Date(dateStr);
  
  // 3. Leer usando métodos UTC (getUTCHours) para obtener el número exacto
  let hours = d.getUTCHours(); // Si la BD dice 08:00, esto devuelve 8
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  
  // ... lógica de AM/PM ...
  
  return `${hours}:${minutes} ${ampm}`;
};

```

### 3. Nivel Frontend (Vue.js)

El frontend se vuelve "tonto" intencionalmente respecto a las fechas.

* **Recepción:** Recibe las fechas y horas ya formateadas como texto desde el Backend (ej: `"fecha": "19/01/2026"`, `"hora": "08:00 AM"`).
* **Visualización:** Simplemente imprime el string (`{{ cita.hora }}`).
* **Prohibición:** No debe hacer `new Date(cita.hora)` para mostrarlas, porque el navegador del usuario aplicaría su propia zona horaria, reintroduciendo el error.

---

## 🔄 Flujo de Datos Correcto

1. **Guardado:** El usuario selecciona "08:00". Se envía `08:00` al backend. Se guarda `08:00:00` en MySQL.
2. **Lectura:**
* MySQL entrega el string `"2026-01-19 08:00:00"`.
* Backend le agrega Z: `"2026-01-19 08:00:00Z"`.
* Backend lee `getUTCHours()` -> `8`.
* Backend envía JSON: `{ "hora": "08:00 AM" }`.


3. **Visualización:** Cliente ve "08:00 AM".

---

## ⚠️ Guía para Desarrolladores

Si necesitas crear una nueva funcionalidad que involucre horas (ej: Reportes):

1. **NO** confíes en la zona horaria del servidor.
2. **SIEMPRE** usa los métodos `getUTC...` de Javascript cuando trabajes con objetos `Date` que vienen de la BD.
3. **SIEMPRE** agrega la 'Z' al string de fecha antes de parsearlo si viene de Sequelize con `dateStrings: true`.

```