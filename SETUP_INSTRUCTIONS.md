# Configuración de PostgreSQL y pgAdmin para JoanlunaViajes

## 1. Crear archivo .env

Crea un archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
# Configuración de la base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=joanluna_viajes

# Configuración del servidor
PORT=3000
NODE_ENV=development
```

## 2. Levantar los contenedores

Desde la raíz del proyecto, ejecuta:

```bash
docker-compose up -d
```

Esto levantará:

- **PostgreSQL** en el puerto 5432
- **pgAdmin** en http://localhost:8080

## 3. Acceder a pgAdmin

1. Abre tu navegador y ve a: http://localhost:8080
2. Inicia sesión con:
   - **Email**: admin@joanluna.com
   - **Password**: admin123

## 4. Conectar pgAdmin con PostgreSQL

1. En pgAdmin, haz clic derecho en "Servers" → "Register" → "Server..."
2. En la pestaña "General":
   - **Name**: JoanlunaViajes
3. En la pestaña "Connection":
   - **Host name/address**: postgres (nombre del servicio en docker-compose)
   - **Port**: 5432
   - **Maintenance database**: joanluna_viajes
   - **Username**: postgres
   - **Password**: postgres123
4. Haz clic en "Save"

## 5. Ejecutar migraciones

Desde la carpeta `server/`, ejecuta:

```bash
npm run db:setup
```

Esto creará la base de datos y ejecutará las migraciones.

## 6. Verificar la conexión

Tu aplicación debería poder conectarse a la base de datos usando las variables del archivo `.env`.

## Comandos útiles

- **Ver logs de los contenedores**: `docker-compose logs -f`
- **Detener contenedores**: `docker-compose down`
- **Reiniciar contenedores**: `docker-compose restart`
- **Eliminar contenedores y volúmenes**: `docker-compose down -v`

## Notas importantes

- Los datos de PostgreSQL se guardan en un volumen Docker, por lo que persistirán entre reinicios
- pgAdmin también guarda su configuración en un volumen
- Si cambias las credenciales en docker-compose.yml, actualiza también el archivo .env
