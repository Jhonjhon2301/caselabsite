import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="font-heading text-3xl font-bold mb-2">Pagamento Cancelado</h1>
        <p className="text-muted-foreground mb-8">
          O pagamento não foi concluído. Seus itens ainda estão disponíveis.
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Voltar para a Loja
        </button>
      </div>
    </div>
  );
}
