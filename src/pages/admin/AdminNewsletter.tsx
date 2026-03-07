import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Eye, Mail, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminNewsletter() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [previewSending, setPreviewSending] = useState(false);
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    supabase.from("lead_captures").select("email", { count: "exact", head: true })
      .then(({ count }) => setLeadCount(count ?? 0));
  }, []);

  const sendPreview = async () => {
    if (!subject || !content) { toast.error("Preencha o assunto e o conteúdo"); return; }
    setPreviewSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Email do admin não encontrado");

      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: { subject, content, preview_email: user.email },
      });
      if (error) throw error;
      toast.success(`Preview enviado para ${user.email}!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar preview");
    } finally {
      setPreviewSending(false);
    }
  };

  const sendToAll = async () => {
    if (!subject || !content) { toast.error("Preencha o assunto e o conteúdo"); return; }
    if (!confirm(`Deseja enviar este e-mail para ${leadCount} leads? Esta ação não pode ser desfeita.`)) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: { subject, content },
      });
      if (error) throw error;
      toast.success(`Newsletter enviada! ${data.sent} enviados, ${data.errors} erros.`);
      setSubject("");
      setContent("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar newsletter");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6 text-primary" /> Newsletter & Novidades
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
          <Users className="w-4 h-4" /> {leadCount} leads cadastrados
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-sm font-semibold mb-1.5 block">Assunto do E-mail</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: 🎉 Novidades Case Lab — Novos modelos disponíveis!"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">Conteúdo</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Escreva o conteúdo da newsletter...&#10;&#10;Use quebras de linha para parágrafos."
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-y"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={sendPreview}
            disabled={previewSending || !subject || !content}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {previewSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Enviar Preview (para mim)
          </button>

          <button
            onClick={sendToAll}
            disabled={sending || !subject || !content}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar para {leadCount} leads
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Dica: Envie um preview primeiro para verificar como o e-mail ficará antes de disparar para todos.
        </p>
      </div>
    </div>
  );
}
