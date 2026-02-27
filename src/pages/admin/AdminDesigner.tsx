import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  FolderPlus, Upload, Trash2, Folder, FileIcon, ArrowLeft,
  Image, FileText, Film, Music, MoreVertical, Download
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface FolderRow {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

interface FileRow {
  id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

function fileIcon(mime: string | null) {
  if (!mime) return <FileIcon className="w-8 h-8 text-muted-foreground" />;
  if (mime.startsWith("image/")) return <Image className="w-8 h-8 text-blue-500" />;
  if (mime.startsWith("video/")) return <Film className="w-8 h-8 text-purple-500" />;
  if (mime.startsWith("audio/")) return <Music className="w-8 h-8 text-green-500" />;
  if (mime.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
  return <FileIcon className="w-8 h-8 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDesigner() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Raiz" },
  ]);
  const [loading, setLoading] = useState(true);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    const foldersQ = supabase
      .from("designer_folders")
      .select("*")
      .order("name");
    const filesQ = supabase
      .from("designer_files")
      .select("*")
      .order("name");

    if (currentFolder) {
      foldersQ.eq("parent_id", currentFolder);
      filesQ.eq("folder_id", currentFolder);
    } else {
      foldersQ.is("parent_id", null);
      filesQ.is("folder_id", null);
    }

    const [{ data: fd }, { data: fi }] = await Promise.all([foldersQ, filesQ]);
    setFolders((fd as FolderRow[]) ?? []);
    setFiles((fi as FileRow[]) ?? []);
    setLoading(false);
  }, [currentFolder]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const openFolder = async (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    setBreadcrumb((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const goToBreadcrumb = (index: number) => {
    const target = breadcrumb[index];
    setCurrentFolder(target.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const { error } = await supabase.from("designer_folders").insert({
      name: newFolderName.trim(),
      parent_id: currentFolder,
      created_by: user!.id,
    });
    if (error) { toast.error("Erro ao criar pasta"); return; }
    toast.success("Pasta criada!");
    setNewFolderName("");
    setNewFolderOpen(false);
    fetchContents();
  };

  const deleteFolder = async (id: string) => {
    if (!confirm("Excluir pasta e todo seu conteúdo?")) return;
    const { error } = await supabase.from("designer_folders").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir pasta"); return; }
    toast.success("Pasta excluída");
    fetchContents();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);

    for (const file of Array.from(fileList)) {
      const path = `${currentFolder || "root"}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("designer-files")
        .upload(path, file);
      if (upErr) { toast.error(`Erro ao enviar ${file.name}`); continue; }

      await supabase.from("designer_files").insert({
        folder_id: currentFolder,
        name: file.name,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type,
        created_by: user!.id,
      });
    }

    toast.success("Upload concluído!");
    setUploading(false);
    e.target.value = "";
    fetchContents();
  };

  const deleteFile = async (file: FileRow) => {
    if (!confirm(`Excluir "${file.name}"?`)) return;
    await supabase.storage.from("designer-files").remove([file.storage_path]);
    await supabase.from("designer_files").delete().eq("id", file.id);
    toast.success("Arquivo excluído");
    fetchContents();
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("designer-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const downloadFile = (file: FileRow) => {
    const url = getPublicUrl(file.storage_path);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Designer Drive</h1>
          <p className="text-sm text-muted-foreground">Gerencie artes e arquivos do designer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-2" /> Nova Pasta
          </Button>
          <Button size="sm" className="relative" disabled={uploading}>
            <Upload className="w-4 h-4 mr-2" /> {uploading ? "Enviando..." : "Upload"}
            <input
              type="file"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleUpload}
              disabled={uploading}
            />
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-4 text-sm">
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <button
              onClick={() => goToBreadcrumb(i)}
              className={`hover:underline ${i === breadcrumb.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {b.name}
            </button>
          </span>
        ))}
      </div>

      {/* Back button */}
      {currentFolder && (
        <button
          onClick={() => goToBreadcrumb(breadcrumb.length - 2)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Pasta vazia</p>
          <p className="text-xs mt-1">Crie uma pasta ou faça upload de arquivos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map((f) => (
            <div
              key={f.id}
              className="group bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors relative"
              onDoubleClick={() => openFolder(f.id, f.name)}
              onClick={() => openFolder(f.id, f.name)}
            >
              <Folder className="w-10 h-10 text-amber-500" />
              <span className="text-xs font-medium text-center truncate w-full">{f.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {files.map((f) => (
            <div
              key={f.id}
              className="group bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 relative hover:bg-muted/50 transition-colors"
            >
              {f.mime_type?.startsWith("image/") ? (
                <img
                  src={getPublicUrl(f.storage_path)}
                  alt={f.name}
                  className="w-16 h-16 object-cover rounded cursor-pointer"
                  onClick={() => setPreviewUrl(getPublicUrl(f.storage_path))}
                />
              ) : (
                fileIcon(f.mime_type)
              )}
              <span className="text-xs font-medium text-center truncate w-full">{f.name}</span>
              <span className="text-[10px] text-muted-foreground">{formatSize(f.file_size)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => downloadFile(f)}>
                    <Download className="w-4 h-4 mr-2" /> Baixar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteFile(f)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome da pasta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancelar</Button>
            <Button onClick={createFolder}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
