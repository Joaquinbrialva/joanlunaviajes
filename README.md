# JoanLunaViajes

Sitio web para la agencia de viajes JoanLunaViajes, que facilita la gestión de ofertas, solicitudes de pasajes y clientes.  
Actualmente en desarrollo, con backend en Node.js y PostgreSQL, y frontend planificado en React + Redux Toolkit.

---

## Tecnologías

- Node.js
- Express
- PostgreSQL
- Sequelize (en progreso)
- React (próximamente)
- Redux Toolkit (próximamente)
- dotenv

---

## Estructura del proyecto

joanlunaviajes/
│
├── server/ # Backend: API REST con Node.js, Express y Postgres
│
└── client/ # Frontend: React + Redux Toolkit (en desarrollo)

---

## Estado actual

- Conexión a la base de datos PostgreSQL establecida con `pg`.
- Servidor Express corriendo y respondiendo con la fecha/hora desde la base de datos.
- Preparando migraciones y modelos con Sequelize.

---

## Próximos pasos

- Crear migraciones y modelos para tablas: usuarios, ofertas, clientes y solicitudes.
- Desarrollar rutas para la API REST (autenticación, gestión de ofertas y solicitudes).
- Empezar con el frontend en React y configurar Redux Toolkit.

---

## Cómo ejecutar

1. Clonar el repositorio
2. Configurar variables de entorno en `.env` dentro de `server/`
3. Instalar dependencias con `npm install` en la carpeta `server/`
4. Ejecutar el backend con `npm run dev`

---

© 2025 JoanLunaViajes
