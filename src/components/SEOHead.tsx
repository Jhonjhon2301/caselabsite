import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product";
  product?: {
    name: string;
    price: number;
    currency?: string;
    availability?: "in stock" | "out of stock";
    image?: string;
    description?: string;
    category?: string;
  };
}

export default function SEOHead({ title, description, image, url, type = "website", product }: SEOHeadProps) {
  useEffect(() => {
    const siteName = "Case Lab";
    const fullTitle = title ? `${title} | ${siteName}` : `${siteName} — Garrafas Personalizadas`;
    const desc = description || "Garrafas térmicas personalizadas com seu nome. Qualidade premium, design exclusivo. Entrega para todo o Brasil.";
    const img = image || "/logo.jpeg";
    const pageUrl = url || window.location.href;

    document.title = fullTitle;

    // Meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("name", "description", desc);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:image", img);
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:type", type === "product" ? "product" : "website");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", img);

    // JSON-LD Schema.org
    let scriptEl = document.getElementById("schema-jsonld") as HTMLScriptElement;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "schema-jsonld";
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }

    if (product) {
      scriptEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || desc,
        image: product.image || img,
        brand: { "@type": "Brand", name: siteName },
        offers: {
          "@type": "Offer",
          priceCurrency: product.currency || "BRL",
          price: product.price.toFixed(2),
          availability: product.availability === "out of stock"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          seller: { "@type": "Organization", name: siteName },
        },
        category: product.category,
      });
    } else {
      scriptEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: pageUrl,
        description: desc,
        potentialAction: {
          "@type": "SearchAction",
          target: `${window.location.origin}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      });
    }

    return () => {
      // Cleanup JSON-LD on unmount
      const el = document.getElementById("schema-jsonld");
      if (el) el.textContent = "{}";
    };
  }, [title, description, image, url, type, product]);

  return null;
}
