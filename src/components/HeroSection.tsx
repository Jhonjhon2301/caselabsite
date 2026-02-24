import garrafa6 from "@/assets/products/garrafa-6.png";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-brand">
      <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading text-primary-foreground leading-none mb-4">
            SUA MARCA,{" "}
            <span className="text-secondary">SUA GARRAFA</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg mb-8 font-light">
            Garrafas térmicas personalizadas com a identidade da sua empresa, profissão ou estilo pessoal.
          </p>
          <a
            href="#produtos"
            className="inline-block bg-secondary text-secondary-foreground px-8 py-4 rounded-lg font-semibold text-sm tracking-wider hover:bg-secondary/90 transition-colors"
          >
            VER MODELOS
          </a>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src={garrafa6}
            alt="Garrafa personalizada Case Lab"
            className="w-64 md:w-80 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}
