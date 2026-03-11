import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      setConversations((data as Conversation[]) ?? []);
    };
    fetch();

    const channel = supabase
      .channel("admin-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConv) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeConv.id)
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages((data as ChatMessage[]) ?? []);

      // Mark unread messages as read
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", activeConv.id)
        .eq("sender_role", "customer")
        .eq("is_read", false);
    };
    fetchMessages();

    const channel = supabase
      .channel(`admin-chat-${activeConv.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || !user || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    await supabase.from("chat_messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      sender_name: user.user_metadata?.full_name || "Vendedor",
      sender_role: "seller",
      content,
    });

    await supabase
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString(), assigned_seller_id: user.id })
      .eq("id", activeConv.id);

    setSending(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-heading font-black text-xl sm:text-2xl mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-primary" />
        Chat com Clientes
      </h1>

      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Conversation list */}
        <div className="border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-muted/50 border-b border-border">
            <p className="text-sm font-bold">Conversas ({conversations.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhuma conversa</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors ${
                    activeConv?.id === conv.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{conv.customer_name || "Cliente"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{conv.customer_email}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2 border border-border rounded-xl flex flex-col overflow-hidden">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Selecione uma conversa</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-3 bg-muted/50 border-b border-border flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{activeConv.customer_name || "Cliente"}</p>
                  <p className="text-[10px] text-muted-foreground">{activeConv.customer_email}</p>
                </div>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeConv.status === "open" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                  {activeConv.status === "open" ? "Aberto" : "Fechado"}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_role !== "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        msg.sender_role !== "customer"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${msg.sender_role !== "customer" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {msg.sender_name} · {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Responder..."
                  className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={500}
                />
                <Button size="icon" onClick={sendMessage} disabled={!input.trim() || sending} className="rounded-xl">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
