import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Bell, Check, Calendar } from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remind_date: string;
  remind_time: string;
  is_completed: boolean;
  created_at: string;
}

export default function AdminReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [remindDate, setRemindDate] = useState("");
  const [remindTime, setRemindTime] = useState("09:00");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReminders = async () => {
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .order("remind_date", { ascending: true });
    setReminders((data as Reminder[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReminders(); }, []);

  const addReminder = async () => {
    if (!title.trim() || !remindDate) {
      toast({ title: "Preencha o título e a data", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("reminders").insert({
      title: title.trim(),
      description: description.trim() || null,
      remind_date: remindDate,
      remind_time: remindTime,
      created_by: user!.id,
    });
    if (error) {
      toast({ title: "Erro ao criar lembrete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lembrete criado!" });
      setTitle("");
      setDescription("");
      setRemindDate("");
      fetchReminders();
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    await supabase.from("reminders").update({ is_completed: !current }).eq("id", id);
    fetchReminders();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("reminders").delete().eq("id", id);
    fetchReminders();
  };

  const today = new Date().toISOString().split("T")[0];
  const pending = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);

  const isOverdue = (date: string) => date < today;
  const isToday = (date: string) => date === today;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Lembretes
        </h1>
        <p className="text-sm text-muted-foreground">Crie lembretes com data e horário</p>
      </div>

      {/* Add form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 mb-6">
        <div className="space-y-2">
          <Label>Título do lembrete</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Enviar pedido do João" />
        </div>
        <div className="space-y-2">
          <Label>Descrição (opcional)</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes adicionais..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={remindDate} onChange={(e) => setRemindDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <Input type="time" value={remindTime} onChange={(e) => setRemindTime(e.target.value)} />
          </div>
        </div>
        <Button onClick={addReminder} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Lembrete
        </Button>
      </div>

      {/* Pending */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pendentes ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                      isOverdue(r.remind_date) ? "border-destructive/50 bg-destructive/5" : isToday(r.remind_date) ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <button onClick={() => toggleComplete(r.id, r.is_completed)} className="mt-0.5 w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{r.title}</p>
                      {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs font-medium ${isOverdue(r.remind_date) ? "text-destructive" : isToday(r.remind_date) ? "text-primary" : "text-muted-foreground"}`}>
                          {new Date(r.remind_date + "T00:00:00").toLocaleDateString("pt-BR")} às {r.remind_time?.slice(0, 5) || "09:00"}
                          {isOverdue(r.remind_date) && " — Atrasado!"}
                          {isToday(r.remind_date) && " — Hoje!"}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Concluídos ({completed.length})</h2>
              <div className="space-y-2">
                {completed.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30 opacity-60">
                    <button onClick={() => toggleComplete(r.id, r.is_completed)} className="mt-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-through">{r.title}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pending.length === 0 && completed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum lembrete ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
