import postgres from "postgres";

// Una sola conexión compartida para toda la app.
const globalDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalDb.sql ??
  postgres(process.env.DATABASE_URL ?? "postgres://localhost/somos_ekklesia", {
    max: 10,
    transform: postgres.camel,
  });

if (process.env.NODE_ENV !== "production") globalDb.sql = sql;
