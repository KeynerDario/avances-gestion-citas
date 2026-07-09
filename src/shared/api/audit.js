import { supabase } from "../../lib/supabase";

export async function logAuditAction({ userId, action, entityType, entityId, oldData, newData }) {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;

  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: String(entityId),
    oid_data: oldData,
    new_data: newData,
    user_agent: userAgent,
  });
  if (error) console.error("Audit log error:", error.message);
}
