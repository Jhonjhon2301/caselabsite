import garrafa1 from "@/assets/products/garrafa-1.png";
import garrafa2 from "@/assets/products/garrafa-2.png";
import garrafa3 from "@/assets/products/garrafa-3.png";
import garrafa4 from "@/assets/products/garrafa-4.png";
import garrafa5 from "@/assets/products/garrafa-5.png";
import garrafa6 from "@/assets/products/garrafa-6.png";
import garrafa7 from "@/assets/products/garrafa-7.png";
import garrafa8 from "@/assets/products/garrafa-8.png";
import garrafa9 from "@/assets/products/garrafa-9.png";

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "May Derma - Dra Manuella Perez",
    description: "Garrafa térmica personalizada com tema dermatologia",
    image: garrafa1,
    category: "Saúde",
  },
  {
    id: "2",
    name: "JN Construtora",
    description: "Garrafa térmica personalizada com tema construção civil",
    image: garrafa2,
    category: "Empresarial",
  },
  {
    id: "3",
    name: "Dias Salon - Imagem Masculina",
    description: "Garrafa térmica personalizada com tema barbearia",
    image: garrafa3,
    category: "Beleza",
  },
  {
    id: "4",
    name: "Stin Sem Fronteiras - Thaise Camargo",
    description: "Garrafa térmica personalizada minimalista",
    image: garrafa4,
    category: "Pessoal",
  },
  {
    id: "5",
    name: "Direito - Dra Denise Costa",
    description: "Garrafa térmica personalizada com tema jurídico",
    image: garrafa5,
    category: "Profissional",
  },
  {
    id: "6",
    name: "Gelson Kleber - Tênis",
    description: "Garrafa térmica personalizada com tema esportivo",
    image: garrafa6,
    category: "Esporte",
  },
  {
    id: "7",
    name: "Pedro - Filmmaker",
    description: "Garrafa térmica personalizada com tema cinema",
    image: garrafa7,
    category: "Criativo",
  },
  {
    id: "8",
    name: "Sonic - Infantil",
    description: "Garrafa térmica personalizada com tema infantil",
    image: garrafa8,
    category: "Infantil",
  },
  {
    id: "9",
    name: "Agiliza Doutor",
    description: "Garrafa térmica personalizada com tema médico/tech",
    image: garrafa9,
    category: "Empresarial",
  },
];
