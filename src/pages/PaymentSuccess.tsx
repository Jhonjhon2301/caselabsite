import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="font-heading text-3xl font-bold mb-2">Pagamento Confirmado!</h1>
        <p className="text-muted-foreground mb-8">
          Seu pedido foi recebido com sucesso. Você receberá um e-mail com os detalhes da compra.
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Voltar para a Loja
        </button>
      </div>
    </div>
  );
}
