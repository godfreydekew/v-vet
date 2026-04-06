import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  addLivestockImage,
  deleteLivestockImageById,
  type LivestockImage,
  updateLivestock,
} from "@/lib/services/livestock.service";
import { uploadLivestockImage, deleteLivestockImage } from "@/lib/s3";
import { Loader2, ImagePlus, X, ZoomIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnimalPhotoProps {
  livestockId: string;
  animalName: string | null;
  imageUrl: string | null;
  images: LivestockImage[];
}

export default function AnimalPhoto({
  livestockId,
  animalName,
  imageUrl,
  images,
}: AnimalPhotoProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLivestockImage(livestockId, file);
      await addLivestockImage(livestockId, {
        image_url: url,
        is_primary: true,
        ai_analysis: null,
      });
      queryClient.invalidateQueries({ queryKey: ["livestock", livestockId] });
      toast({ title: "Image uploaded." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[S3 upload]", err);
      toast({ title: `Upload failed: ${msg}`, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!imageUrl) return;
    setDeleting(true);
    try {
      const primaryImage =
        images.find((img) => img.is_primary) ??
        images.find((img) => img.image_url === imageUrl);
      await deleteLivestockImage(imageUrl);
      if (primaryImage) {
        await deleteLivestockImageById(livestockId, primaryImage.id);
      } else {
        // Fallback for older records where image metadata may be missing.
        await updateLivestock(livestockId, { image_url: null });
      }
      queryClient.invalidateQueries({ queryKey: ["livestock", livestockId] });
      toast({ title: "Image removed." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: `Delete failed: ${msg}`, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <p className="text-sm font-medium text-foreground mb-3">Photo</p>

      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={animalName ?? "Animal photo"}
            className="w-full max-h-72 object-cover rounded-lg cursor-pointer"
            onClick={() => setZoomOpen(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-black/30">
            <button
              type="button"
              title="Zoom image"
              onClick={() => setZoomOpen(true)}
              className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
            <button
              type="button"
              title="Remove image"
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 bg-black/60 rounded-full text-white hover:bg-red-600/80 transition-colors"
            >
              {deleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <X size={18} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <ImagePlus size={24} />
          )}
          <span className="text-sm">
            {uploading ? "Uploading…" : "Upload a photo"}
          </span>
          <span className="text-xs">JPG, PNG or WebP</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload animal photo"
        title="Upload animal photo"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Zoom overlay */}
      {zoomOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            title="Close"
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
            onClick={() => setZoomOpen(false)}
          >
            <X size={24} />
          </button>
          <img
            src={imageUrl}
            alt={animalName ?? "Animal photo"}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
