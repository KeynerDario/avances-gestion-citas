/**
 * Supabase Keep-Alive Worker
 *
 * Cloudflare Workers cron que mantiene activa la base de datos de Supabase
 * en el plan gratuito (se pausa tras 7 días sin actividad).
 *
 * Hace un GET ligero a una tabla pública (dependencies) vía REST API.
 * Costo: ~1 invocación/día de las 100,000 gratis = $0/mes.
 */

export default {
  async scheduled(event, env, ctx) {
    const startTime = Date.now();

    try {
      const url = `${env.SUPABASE_URL}/rest/v1/${env.PING_TABLE}?select=id&limit=1`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        const body = await response.text();
        console.log(
          `[keepalive] OK ${response.status} | ${duration}ms | table: ${env.PING_TABLE} | rows: ${body}`
        );
      } else {
        const body = await response.text();
        console.error(
          `[keepalive] FAIL ${response.status} | ${duration}ms | ${body}`
        );
      }
    } catch (error) {
      console.error(`[keepalive] ERROR: ${error.message}`);
    }
  },

  // Handler HTTP opcional para testing manual (curl al worker URL)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Endpoint de prueba: llama al mismo ping y devuelve el resultado
    if (url.pathname === "/ping") {
      try {
        const pingUrl = `${env.SUPABASE_URL}/rest/v1/${env.PING_TABLE}?select=id&limit=1`;
        const response = await fetch(pingUrl, {
          method: "GET",
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          },
        });
        const body = await response.text();
        return new Response(
          JSON.stringify({
            status: response.status,
            ok: response.ok,
            table: env.PING_TABLE,
            response: body,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Supabase Keep-Alive Worker\nGET /ping para probar", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
