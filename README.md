# Esqueleto — NestJS + Docker

Proyecto base para el laboratorio. **Sin lógica de negocio**: solo estructura de módulos lista para ir completando en cada clase.

## Arranque local

```bash
npm install
cp .env.example .env   # DATABASE_URL, DATABASE_SCHEMA, AWS_*

npm run migration:run   # tabla api_clients en tu esquema Postgres
npm run seed:api-client # cliente de prueba: test-api-key / test-api-secret

npm run start:dev
```

### Base de datos

- `src/database/data-source.ts` — conexión para **migraciones** (CLI TypeORM) y helper `resolvePostgresConnection()`.
- `src/database/database.module.ts` — conexión TypeORM en Nest (`TypeOrmModule.forRootAsync` con `DATABASE_URL` / `DATABASE_SCHEMA`).
- `src/entities/` — entidades TypeORM de todos los módulos (p. ej. `api-client.entity.ts`).
- `src/migrations/` — migraciones SQL.
- `scripts/seed-test-api-client.ts` — inserta fila de prueba (`npm run seed:api-client`). Opcional: `SEED_API_KEY`, `SEED_API_SECRET` en `.env`.

## Docker local

Los archivos `Dockerfile` y `docker-compose.yml` están vacíos hasta que se publique la imagen base del curso.

## Health

```bash
curl http://localhost:3000/health
```

## Despliegue en Render (producción)

Sigue **[DEPLOY.md](./DEPLOY.md)** para conectar tu GitHub, desplegar con Docker y activar auto-deploy en cada push.
