import { sql, type SQLWrapper } from "drizzle-orm";
import { check } from "drizzle-orm/pg-core";

export function finite(name: string, column: SQLWrapper, values: readonly string[]) {
  // Development-time schema constants only, never request input.
  const literals = sql.raw(values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", "));
  return check(name, sql`${column} IN (${literals})`);
}
export function positive(name: string, ...columns: SQLWrapper[]) {
  return check(
    name,
    sql.join(
      columns.map((column) => sql`${column} BETWEEN 1 AND 9007199254740991`),
      sql` AND `,
    ),
  );
}
export function digest(name: string, column: SQLWrapper) {
  return check(name, sql`${column} ~ '^[0-9a-f]{64}$'`);
}
