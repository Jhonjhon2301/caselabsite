import { MessageCircle } from "lucide-react";


export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5561992629861"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[hsl(142_70%_45%)] text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 active:scale-100 transition-all duration-200 flex items-center justify-center group"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
    </a>
  );
}
