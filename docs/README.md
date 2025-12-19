Plataforma Clínica - Documentación del Proyecto
===============================================

🚀 Sobre el proyecto

Plataforma Clínica es una aplicación backend desarrollada en Node.js que organiza su lógica por dominios (`Operative`, `Clinic`, `Bussines` y `Platform`).  
La arquitectura modular permite separar responsabilidades, escalar más fácil y reutilizar componentes compartidos en `src/shared`.

🛠️ Tecnologías principales

- **Node.js** (v20+)
- **Express** como framework HTTP
- **Sequelize** para el manejo de base de datos relacional

📂 Arquitectura y estructura

- **Arquitectura modular por dominios**: `src/modules/{clinic, operative, bussines, platform}`.
- **Componentes compartidos**: `src/shared` (config, middlewares, utils, database, etc.).
- **Base de datos y migraciones**: carpeta `database` (migraciones, seeders y scripts).
- **Detalle de carpetas**: ver `docs/estructura carpetas.md`.

▶️ Instalación y ejecución (resumen)

Pasos básicos para dejar el proyecto funcionando en local:

1. **Configurar variables de entorno**
   - Copia el archivo `.env.example` a `.env`.
   - Completa las variables para la base de datos (host, puerto, usuario, contraseña, nombre de la base) y el puerto del servidor.

2. **Instalar dependencias**

```bash
npm install
```

3. **Ejecutar migraciones de base de datos**

```bash
npx sequelize-cli db:migrate
```

4. **Ejecutar seeders (datos de ejemplo)**

```bash
npm sequelize-cli db:seed:all
```

5. **Levantar el servidor de desarrollo**

```bash
npm run dev
```

El servidor se inicia por defecto en `http://localhost:3000`.

🌐 API (resumen)

- **Base URL**: `http://localhost:3000/api`.
- La especificación inicial de la API se encuentra en `docs/api/openapi-inicial.yaml`.
- Los endpoints se organizan por dominio bajo `src/modules` (por ejemplo, rutas clínicas dentro del módulo `clinic`).

🗄️ Base de datos (resumen)

- El modelo de datos se gestiona con **Sequelize** (migraciones y seeders en `database`).
- Ejecuta primero las migraciones y luego los seeders antes de probar la API.
- Puedes apoyarte en consultas SQL simples para validar datos (conteos y listados de las tablas principales).

🚀 Despliegue (resumen)

- El proyecto está pensado para ejecutarse inicialmente en entorno de desarrollo local.
- Para entornos de prueba o producción, se recomienda usar variables de entorno específicas y un proceso de despliegue automatizado (Docker/CI/CD), que puedes documentar y adaptar a partir de este mismo archivo.

📋 Estándares de código y commits

Para mantener la calidad y consistencia del laboratorio:

- **Código limpio y organizado**: respeta la separación por dominios y responsabilidades claras.
- **Nombres en inglés** para variables, funciones, clases y módulos (`camelCase` para variables/métodos, `PascalCase` para clases).
- **Reutilización**: antes de crear algo nuevo, verifica si existe en `src/shared` o en otro módulo.
- **Sin código muerto**: elimina comentarios innecesarios, logs temporales y código no utilizado antes de hacer commit.

📝 Convenciones para commits (Conventional Commits)

Usamos **Conventional Commits** para mantener un historial claro.  
El formato general del mensaje es: `tipo: descripción corta en inglés`.

- **feat**: nuevas funcionalidades para el usuario.
- **fix**: corrección de errores (bugs).
- **docs**: cambios en la documentación.
- **style**: cambios que no afectan la lógica del código (formato, espacios, etc.).
- **refactor**: refactorización de código sin cambiar su funcionalidad.
- **test**: añadir o modificar pruebas.
- **chore**: cambios en el proceso de build, herramientas o dependencias.
- **hotfix**: correcciones de bugs críticos en producción.


