# Fastify Template

A solid, production-ready Fastify + TypeScript starter running on **Node.js**.

## Stack

- [Fastify 5](https://fastify.dev) — web framework
- TypeScript (strict mode, `NodeNext` modules)
- [Zod](https://zod.dev) — environment variable validation
- `@fastify/helmet` + `@fastify/cors` — baseline security
- `pino-pretty` — readable logs in development
- ESLint 9 (flat config) + Prettier

## Requirements

- Node.js >= 24

## Getting started

```bash
# install dependencies
npm install

# copy the example env file and adjust as needed
cp .env.example .env

# start the dev server (auto-reloads on change)
npm run dev
```

The server starts on `http://localhost:3000` by default. Check it's alive:

```bash
curl http://localhost:3000/health
```

## Scripts

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Run the server in watch mode via `tsx`   |
| `npm run build`        | Type-check and compile to `dist/`        |
| `npm start`            | Run the compiled server from `dist/`     |
| `npm run typecheck`    | Type-check without emitting output       |
| `npm run lint`         | Lint the project with ESLint             |
| `npm run lint:fix`     | Lint and auto-fix                        |
| `npm run format`       | Format the project with Prettier         |
| `npm run format:check` | Check formatting without writing changes |

## Project structure

```
index.ts                 # Entry point: builds the app, listens, handles graceful shutdown
src/
  app.ts                     # Builds and configures the Fastify instance
  common/
    config/
      env.ts                 # Zod-validated environment variables
    plugins/
      security.plugin.ts     # helmet + cors registration
      error-handler.plugin.ts# Global 404 + error handler
      index.ts                # Registers all common plugins
    errors/
      app-error.ts            # AppError and common HTTP error subclasses
      index.ts
    utils/
      response.ts              # SuccessResponse / ErrorResponse envelopes
      index.ts
  modules/
    health/
      health.routes.ts         # GET /health
    # Add new feature modules here, each with its own routes file
```

### Adding a new module

1. Create a folder under `src/modules/<name>` with a `<name>.routes.ts` file exporting a Fastify plugin (an `async function(fastify) { ... }`).
2. Register it in `src/app.ts`:
   ```ts
   import myModuleRoutes from "./modules/my-module/my-module.routes.js";
   // ...
   await app.register(myModuleRoutes, { prefix: "/my-module" });
   ```

### Error handling

Throw an `AppError` (or one of `NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError` from `src/common/errors`) anywhere in a route handler and the global error handler will translate it into a consistent JSON error response. Unexpected errors are logged and returned as a generic `500`.

### Environment variables

All environment variables are validated at startup via `src/common/config/env.ts`. Add new variables to the Zod schema there — the app will fail fast with a clear error message if a required variable is missing or invalid.

## Notes

Module resolution uses `NodeNext`, so relative imports must include the `.js` extension (even though the source files are `.ts`) — this is required by native Node ESM.
