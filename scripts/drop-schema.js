import postgres from "postgres";

const sql = postgres("postgresql://sokobuild:sokobuild_local_dev@localhost:5432/sokobuild", { max: 1 });
(async () => {
  try {
    await sql.unsafe(`DROP SCHEMA IF EXISTS "jengapact" CASCADE`);
    await sql.unsafe(`DROP SCHEMA IF EXISTS "drizzle" CASCADE`);
    console.warn("schemas dropped");
  } catch (e: unknown) {
    console.error("ERR", e.message, e.code);
  }
  await sql.end();
})();