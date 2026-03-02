import { supabase } from "@/integrations/supabase/client";

export async function logAudit(action: string, entityType: string, entityId?: string, details?: Record<string, any>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("admin_audit_log" as any).insert({
      user_id: user.id,
      user_email: user.email,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || {},
    });
  } catch (err) {
    console.error("[Audit] Failed to log:", err);
  }
}
