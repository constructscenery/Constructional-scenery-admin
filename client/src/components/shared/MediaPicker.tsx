import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Check, ImageOff, Loader2, Film } from "lucide-react";
import { toast } from "sonner";
import { mediaApi } from "@/api/media";
import { uploadApi } from "@/api/upload";
import { MediaFile } from "@/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

function PickerItem({ file, onSelect }: { file: MediaFile; onSelect: (url: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const video = file.mimeType.startsWith("video/");

  return (
    <button
      type="button"
      className="group relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors focus:outline-none focus:border-primary bg-muted"
      onClick={() => onSelect(file.url)}
      title={file.filename}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
          {video
            ? <Film className="h-5 w-5 text-muted-foreground/30" />
            : <ImageOff className="h-5 w-5 text-muted-foreground/30" />
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
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
      {video && loaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Film className="h-6 w-6 text-white drop-shadow-lg opacity-80" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Check className="h-6 w-6 text-white" />
      </div>
    </button>
  );
}

function LibraryGrid({ onSelect }: { onSelect: (url: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => mediaApi.list().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <ImageOff className="h-10 w-10 opacity-30" />
        <p className="text-sm">No images in library yet — upload one in the Upload tab</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 max-h-[400px] overflow-y-auto pr-1">
      {data.map((file: MediaFile) => (
        <PickerItem key={file.id} file={file} onSelect={onSelect} />
      ))}
    </div>
  );
}

function UploadTab({ onSelect }: { onSelect: (url: string) => void }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [progress, setProgress] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadApi.uploadWithProgress(files[0], setProgress);
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Uploaded");
      onSelect(res.data.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 py-16 ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium">{uploading ? "Uploading…" : "Drop a file here or click to upload"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Images & videos — up to 200 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {progress !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Uploading…</span>
            <span className="tabular-nums font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="library">
          <TabsList className="mb-4">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload new</TabsTrigger>
          </TabsList>
          <TabsContent value="library">
            <LibraryGrid onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="upload">
            <UploadTab onSelect={handleSelect} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
