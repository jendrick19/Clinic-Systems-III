Estructura de carpetas actual
=============================

Raíz del proyecto
-----------------

── src/
│ ├── app.js                  Configuración principal de Express
│ ├── routes.js               Registro central de rutas y módulos
│ ├── shared/                 Componentes compartidos entre módulos
│ │   ├── errors/             Clases de error y manejo de excepciones
│ │   ├── middlewares/        Middlewares comunes (errores, etc.)
│ │   ├── utils/              Utilidades y helpers (fechas, paginación, CIE10, etc.)
│ │   └── validators/         Validadores comunes reutilizables
│ │
│ └── modules/                Módulos de dominio
│     ├── operative/          Dominio operativo (agenda, pacientes, profesionales, etc.)
│     │   ├── controllers/    Controladores HTTP del módulo operativo
│     │   ├── models/         Modelos Sequelize del dominio operativo
│     │   ├── repositories/   Acceso a datos del dominio operativo
│     │   ├── routes/         Rutas HTTP del módulo operativo
│     │   ├── services/       Lógica de negocio del módulo operativo
│     │   └── validators/     Validadores del dominio operativo
│     │
│     ├── clinic/             Dominio clínico (episodios, notas clínicas, diagnósticos, etc.)
│     │   ├── controllers/    Controladores HTTP del módulo clínico
│     │   ├── models/         Modelos Sequelize del dominio clínico
│     │   ├── repositories/   Acceso a datos del dominio clínico (incluye README_CLINICAL_NOTE.md)
│     │   ├── routes/         Rutas HTTP del módulo clínico
│     │   ├── services/       Lógica de negocio del módulo clínico
│     │   └── validators/     Validadores del dominio clínico
│     │
│     ├── bussines/           Dominio de negocio (planes, facturación, pagos, etc.)
│     │   ├── controllers/    Controladores HTTP del módulo de negocio
│     │   ├── models/         Modelos Sequelize del dominio de negocio
│     │   ├── repositories/   Acceso a datos del dominio de negocio
│     │   ├── routes/         Rutas HTTP del módulo de negocio
│     │   ├── services/       Lógica de negocio (facturación, planes, etc.)
│     │   └── validators/     Validadores del dominio de negocio
│     │
│     ├── platform/           Servicios de plataforma (usuarios, autenticación, roles, etc.)
│     │   ├── controllers/    Controladores HTTP del módulo de plataforma
│     │   ├── models/         Modelos de plataforma (por ejemplo, `user`)
│     │   ├── repositories/   Acceso a datos de plataforma
│     │   ├── routes/         Rutas HTTP del módulo de plataforma
│     │   ├── services/       Lógica de negocio de plataforma
│     │   └── validators/     Validadores del dominio de plataforma
│     │
│     ├── intelligence/
│     │   ├── controllers/
│     │   │   └── IAController.js
│     │   ├── services/
│     │   │   └── SmartSchedulingService.js
│     │   ├── routes/
│     │   │   └── index.js
│     │   └── index.js
│     │
│     └── README.md           Descripción general de los módulos (si existe)
│
├── database/                 Configuración y artefactos de base de datos
│ ├── config/                 Configuración de conexión (Sequelize)
│ │   └── database.js
│ ├── migrations/             Migraciones de base de datos
│ ├── models/                 Registrador de modelos para Sequelize
│ │   └── index.js
│ └── seeders/                Datos iniciales y scripts de seeding
│     ├── *.js                Seeders (profesionales, unidades de cuidado, agendas, etc.)
│     └── run-seeders.sh      Script para ejecutar todos los seeders
│
├── docs/                     Documentación del proyecto
│ ├── api/                    Especificaciones de la API (por ejemplo, OpenAPI)
│ │   └── openapi-inicial.yaml
│ ├── diagrams/               Diagramas y esquemas (estructura de carpetas, DB, etc.)
│ │   └── estructura carpetas.md
│ └── README.md               Documentación general del proyecto
│
├── package.json              Dependencias y scripts npm
├── package-lock.json         Bloqueo de versiones de dependencias
├── .sequelizerc              Configuración de rutas para Sequelize CLI
├── README.md                 README principal del proyecto (raíz)
└── server.js                 Punto de entrada del servidor HTTP

Descripción de los módulos
--------------------------

- **Operative**: Agrupa la logística diaria de pacientes, profesionales, agenda y citas.
- **Clinic**: Registra la atención médica y el proceso asistencial. Aquí vive todo lo que tiene que ver con historias clínicas, diagnósticos, consentimientos y resultados.
- **Bussines**: Conecta lo clínico con lo económico, aseguradoras, planes, facturación y pagos. Este módulo define cómo se monetiza y se controla la cobertura.
- **Platform**: Servicios comunes del sistema, como autenticación, usuarios, roles o notificaciones.
- **Shared**: Componentes transversales que pueden ser usados por cualquier capa o dominio (utils, middlewares, validadores, errores, etc.).
