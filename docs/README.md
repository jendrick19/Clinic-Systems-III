# Clinic Systems III - Sistema de Gestión Clínica Integral con IA

## 📋 Descripción General
**Clinic Systems III** es una plataforma avanzada diseñada para la gestión integral de clínicas dentales. A diferencia de los sistemas administrativos tradicionales, esta solución integra módulos operativos, clínicos, financieros y de **Inteligencia Artificial** en un ecosistema unificado.

La característica distintiva del proyecto es su **Asistente Conversacional (IA)**, impulsado por Modelos de Lenguaje (LLMs), que permite a los pacientes interactuar en lenguaje natural para gestionar sus citas, validando disponibilidad en tiempo real y respetando la lógica de negocio de la clínica.

## 🚀 Stack Tecnológico

### Backend (API REST)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de Datos:** MySQL
- **ORM:** Sequelize (Configurado en modo **UTC Estricto** para consistencia horaria).
- **Inteligencia Artificial:** OpenAI API (GPT-4o-mini) con *Function Calling*.
- **Seguridad:** JWT (JSON Web Tokens) y RBAC (Control de Acceso Basado en Roles).

### Frontend (SPA)
- **Framework:** Vue.js 3 (Composition API & Script Setup).
- **Build Tool:** Vite.
- **Estilos:** TailwindCSS.
- **Comunicación:** Fetch API / EventBus.

## 🛠️ Instalación y Despliegue

### Requisitos Previos
- **Node.js** v18 o superior.
- **MySQL Server** ejecutándose localmente o en remoto.
- Una **API Key de OpenAI** válida.

### Pasos de Instalación

1. **Clonar el repositorio e instalar dependencias:**

   ```
   # 1. Instalar dependencias del Backend (Raíz del proyecto)
   npm install

   # 2. Instalar dependencias del Frontend
   cd vue-project
   npm install
   cd ..
   ```
Configuración de Variables de Entorno: Crea un archivo .env en la raíz del proyecto (basado en .env.example) con la siguiente configuración:
  ```
    PORT=3000
    DB_USERNAME=root
    DB_PASSWORD=tu_password_mysql
    DB_DATABASE=clinic_system_db
    DB_HOST=127.0.0.1
    OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx  <-- Tu API Key aquí
  ```
Preparación de la Base de Datos: Es crucial ejecutar los seeders para que la IA tenga datos (horarios y doctores) con los cuales interactuar.
  ```
    # Reiniciar la base de datos desde cero (Borra datos existentes)
    npx sequelize-cli db:drop
    npx sequelize-cli db:create
    npx sequelize-cli db:migrate
  
  # Cargar datos semilla (Pacientes, Doctores, Horarios, Tarifas)
    bash database/seeders/run-seeders.sh
  
  ```
Ejecutar el Proyecto:
Puedes correr ambos entornos (Backend y Frontend) simultáneamente si tienes configurado el script, o en terminales separadas:
  
Terminal 1 (Backend):
  ```
    npm run dev
    # El servidor iniciará en http://localhost:3000
  ```
Terminal 2 (Frontend):
  ```
    cd vue-project
    npm run dev
    # La web iniciará en http://localhost:5173
  ```
📂 Estructura del Proyecto

El sistema sigue una Arquitectura Modular dentro del backend (src/modules), donde cada carpeta encapsula la lógica de un dominio de negocio:\
|Módulo      | Descripción|\
|Platform	   | Gestión de Usuarios, Autenticación (AuthService), Roles y Permisos.\
|Operative   | Gestión del día a día: Agendas (Schedules), Citas (Appointments) y Profesionales.\
|Clinic	     | Historia Clínica Electrónica: Episodios, Evoluciones, Diagnósticos y Consentimientos.\
|Business	   | Facturación, Seguros, Planes y Tarifarios.\
|Intelligence| Cerebro de la IA: Servicios de contexto, prompts y controlador del Chatbot.\
|Dashboard	 | Servicios de lectura optimizados para KPIs y estadísticas en tiempo real.\

⚠️ Consideraciones Importantes

**Manejo de Fechas (UTC):** El sistema está configurado para trabajar estrictamente en UTC (+00:00) en la base de datos y el backend. El frontend recibe las fechas como texto pre-formateado para evitar discrepancias de zona horaria entre el servidor y el cliente.

**Usuarios de Prueba:** Al ejecutar los seeders, se crean usuarios por defecto (Admin, Profesional y Paciente) documentados en los archivos de database/seeders/.
