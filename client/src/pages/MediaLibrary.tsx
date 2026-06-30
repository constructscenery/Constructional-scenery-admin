import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Copy, Check, ImageOff, Film } from "lucide-react";
import { toast } from "sonner";
import { mediaApi } from "@/api/media";
import { uploadApi } from "@/api/upload";
import { MediaFile } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
}

function MediaCard({ file, onDelete }: { file: MediaFile; onDelete: (id: number) => void }) {
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const video = isVideo(file.mimeType);

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden">
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
        {/* Skeleton shimmer shown while loading */}
        {!loaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            {video
              ? <Film className="h-8 w-8 text-muted-foreground/30" />
              : <ImageOff className="h-8 w-8 text-muted-foreground/30" />
            }
          </div>
        )}
        {video ? (
          <video
            src={file.url}
            className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            muted
            preload="metadata"
            onLoadedMetadata={() => setLoaded(true)}
          />
        ) : (
          <img
            src={file.url}
            alt={file.filename}
            className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        )}
        {video && loaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Film className="h-8 w-8 text-white drop-shadow-lg opacity-80" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium" title={file.filename}>{file.filename}</p>
        <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)} · {formatDate(file.createdAt)}</p>
      </div>
      <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={copyUrl} title="Copy URL">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDelete(file.id)} title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function MediaLibrary() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => mediaApi.list().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => mediaApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("File deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let succeeded = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadApi.uploadImage(file);
        succeeded++;
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    if (succeeded > 0) {
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success(`${succeeded} file${succeeded > 1 ? "s" : ""} uploaded`);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const total = data?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="All uploaded images and videos in one place. Upload here or directly from any media field."
      />

      {/* Upload zone */}
      <div
        className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 py-10 ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">{uploading ? "Uploading…" : "Drop files here or click to upload"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Images & videos — up to 200 MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ImageOff className="h-12 w-12 opacity-30" />
          <p className="text-sm">No files yet — upload one above</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total} file{total !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data!.map((file) => (
              <MediaCard key={file.id} file={file} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
