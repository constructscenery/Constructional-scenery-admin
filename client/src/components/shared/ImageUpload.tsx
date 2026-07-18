import { useRef, useState } from "react";
import { Upload, X, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { uploadApi } from "@/api/upload";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "./MediaPicker";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}

export function ImageUpload({ value, onChange, label = "Image", accept = "image/*,video/*" }: ImageUploadProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const isUploading = progress !== null;

  const handleFile = async (file: File) => {
    setProgress(0);
    try {
      const res = await uploadApi.uploadWithProgress(file, setProgress);
      onChange(res.data.url);
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or use buttons →"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setPickerOpen(true)}
          title="Pick from library"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          title="Upload new file"
        >
          <Upload className="h-4 w-4" />
        </Button>
        {value && (
          <Button type="button" variant="outline" size="icon" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span className="tabular-nums font-medium text-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {value && !isUploading && (() => {
        const isVideo = /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(value);
        return isVideo ? (
          <video
            key={value}
            src={value}
            controls
            className="mt-2 h-32 w-full rounded-md border object-cover bg-black"
          />
        ) : (
          <img
            src={value}
            alt="Preview"
            className="mt-2 h-32 w-full rounded-md border object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        );
      })()}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
}
