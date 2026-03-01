import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  author_name: string;
  tags: string[];
  published_at: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_image, author_name, tags, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as any[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog"
        description="Dicas sobre garrafas personalizadas, brindes corporativos e tendências de personalização. Case Lab Blog."
      />
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="font-heading font-bold text-3xl mb-2">Blog Case Lab</h1>
          <p className="text-muted-foreground">Dicas, tendências e inspirações para personalização</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-muted rounded-xl h-80" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">Em breve!</p>
            <p className="text-sm">Estamos preparando conteúdos incríveis para você.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                {post.cover_image && (
                  <div className="aspect-video overflow-hidden">
                    <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-5">
                  {post.tags?.length > 0 && (
                    <div className="flex gap-1.5 mb-2">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{tag}</span>
                      ))}
                    </div>
                  )}
                  <h2 className="font-heading font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.excerpt}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.published_at).toLocaleDateString("pt-BR")}
                    </div>
                    <span className="text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ler mais <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
