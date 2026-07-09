import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan variables de entorno Supabase");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Request queue — only for burst scenarios (batch enrichment, realtime floods).
 * Browser limit is ~6 connections/origin. We allow 5 parallel to stay safe.
 * Most queries should NOT use enqueue — the browser handles parallel fetches fine.
 */
const MAX_CONCURRENT = 5;
let active = 0;
const pending = [];

export function enqueue(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      active++;
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          active--;
          if (pending.length > 0) pending.shift()();
        });
    };
    active < MAX_CONCURRENT ? run() : pending.push(run);
  });
}
