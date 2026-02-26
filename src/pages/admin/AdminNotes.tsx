import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, StickyNote, Save } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const colors = [
  { id: "yellow", bg: "bg-yellow-100 border-yellow-300", text: "text-yellow-900" },
  { id: "blue", bg: "bg-blue-100 border-blue-300", text: "text-blue-900" },
  { id: "green", bg: "bg-green-100 border-green-300", text: "text-green-900" },
  { id: "pink", bg: "bg-pink-100 border-pink-300", text: "text-pink-900" },
  { id: "purple", bg: "bg-purple-100 border-purple-300", text: "text-purple-900" },
];

export default function AdminNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    const { data } = await supabase.from("admin_notes").select("*").order("updated_at", { ascending: false });
    setNotes((data as Note[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);

  const addNote = async () => {
    const { data, error } = await supabase
      .from("admin_notes")
      .insert({ title: "Nova nota", content: "", color: "yellow", created_by: user!.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNotes((prev) => [data as Note, ...prev]);
      setEditingId((data as Note).id);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const saveNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    await supabase.from("admin_notes").update({ title: note.title, content: note.content, color: note.color }).eq("id", id);
    setEditingId(null);
    toast({ title: "Nota salva!" });
  };

  const deleteNote = async (id: string) => {
    await supabase.from("admin_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const getColorClass = (color: string) => colors.find((c) => c.id === color) || colors[0];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-primary" /> Notas
          </h1>
          <p className="text-sm text-muted-foreground">Anotações rápidas do time</p>
        </div>
        <Button onClick={addNote}>
          <Plus className="w-4 h-4 mr-2" /> Nova Nota
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma nota ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const cc = getColorClass(note.color);
            const isEditing = editingId === note.id;
            return (
              <div
                key={note.id}
                className={`rounded-xl border-2 p-4 ${cc.bg} ${cc.text} transition-shadow hover:shadow-md cursor-pointer`}
                onClick={() => !isEditing && setEditingId(note.id)}
              >
                {isEditing ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={note.title}
                      onChange={(e) => updateNote(note.id, { title: e.target.value })}
                      className="w-full bg-transparent font-bold text-sm outline-none border-b border-current/20 pb-1"
                      placeholder="Título..."
                    />
                    <textarea
                      value={note.content}
                      onChange={(e) => updateNote(note.id, { content: e.target.value })}
                      className="w-full bg-transparent text-xs outline-none resize-none min-h-[100px]"
                      placeholder="Escreva sua nota..."
                    />
                    <div className="flex items-center gap-1">
                      {colors.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => updateNote(note.id, { color: c.id })}
                          className={`w-5 h-5 rounded-full border-2 ${c.bg} ${note.color === c.id ? "ring-2 ring-offset-1 ring-foreground/30" : ""}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => saveNote(note.id)} className="text-xs">
                        <Save className="w-3 h-3 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteNote(note.id)} className="text-xs text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-sm mb-1 truncate">{note.title || "Sem título"}</h3>
                    <p className="text-xs whitespace-pre-wrap line-clamp-4">{note.content || "Clique para editar..."}</p>
                    <p className="text-[10px] opacity-50 mt-3">
                      {new Date(note.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
