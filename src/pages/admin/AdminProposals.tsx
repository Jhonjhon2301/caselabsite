import { useState } from "react";
import { FileText, Eye, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminProposals() {
  const [title, setTitle] = useState("PROPOSTA DE PARCERIA");
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("Cole o texto da proposta antes de gerar");
      return;
    }

    // abre a aba imediatamente dentro do gesto do clique para evitar bloqueio de popup
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write("<html><body style='font-family:Arial;padding:24px'>Gerando PDF...</body></html>");
      printWindow.document.close();
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: {
          type: "proposal",
          title: title.trim() || "PROPOSTA DE PARCERIA",
          recipient: recipient.trim(),
          content: content.trim(),
        },
      });

      if (error) throw error;

      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.document.title = title || "Proposta";
        printWindow.onload = () => printWindow.print();
      } else {
        toast.error("Seu navegador bloqueou o popup. Permita popups para gerar o PDF.");
      }

      toast.success("Proposta gerada com sucesso!");
    } catch (err: any) {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      toast.error(err?.message ? `Erro ao gerar proposta: ${err.message}` : "Erro ao gerar proposta");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl">Propostas</h1>
          <p className="text-sm text-muted-foreground">Gere documentos de proposta em PDF</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Proposta</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: PROPOSTA DE PARCERIA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient">Destinatário</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Ex: Ministérios Kombo e Kombo Alpha"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Conteúdo da Proposta</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o texto completo da proposta..."
            className="min-h-[400px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Cole o texto da proposta. Seções com números (1., 2., etc.) e bullets (•, -) serão formatados automaticamente.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !content.trim()}
          className="btn-primary py-3 px-6 flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {generating ? "Gerando..." : "Gerar PDF da Proposta"}
        </button>
      </div>
    </div>
  );
}
