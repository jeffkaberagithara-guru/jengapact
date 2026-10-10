import postgres from "postgres";

const sql = postgres("postgresql://sokobuild:sokobuild_local_dev@localhost:5432/sokobuild", { max: 1 });
(async () => {
  try {
    const pid = "00000000-0000-0000-0000-000000000001";
    await sql`insert into "jengapact"."users" (id, full_name, email) values (${pid}, 'Guard Test', 'guard@test.dev') on conflict (id) do nothing`;
    await sql`insert into "jengapact"."projects" (id, reference, name, created_by) values (${pid}, 'GUARDTEST', 't', ${pid}) on conflict (id) do nothing`;
    await sql`insert into "jengapact"."project_events" (project_id, event_type, entity_type, summary) values (${pid}, 'seed_test', 'test', 't')`;
    const before = await sql`select count(*) as n from "jengapact"."project_events"`;
    await sql`update "jengapact"."project_events" set summary = 'changed'`;
    await sql`delete from "jengapact"."project_events"`;
    const after = await sql`select count(*) as n from "jengapact"."project_events"`;
    console.warn("events before/after update+delete:", before[0].n, after[0].n);
  } catch (e: unknown) {
    console.error("ERR", e.message, e.code);
  }
  await sql.end();
})();