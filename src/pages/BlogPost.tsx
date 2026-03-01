import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, User } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Post não encontrado</p>
        <button onClick={() => navigate("/blog")} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold">Voltar ao Blog</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || `${post.title} — Blog Case Lab`}
        image={post.cover_image}
      />
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Blog
        </Link>

        {post.cover_image && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.tags?.length > 0 && (
          <div className="flex gap-2 mb-3">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{tag}</span>
            ))}
          </div>
        )}

        <h1 className="font-heading font-bold text-2xl md:text-3xl mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {post.author_name}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> {new Date(post.published_at || post.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>

        <article className="prose prose-sm max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }} />
      </main>
      <Footer />
    </div>
  );
}
