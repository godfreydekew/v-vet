import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  analyzeLivestockImage,
  addLivestockImage,
  deleteLivestockImageById,
  type LivestockImage,
  updateLivestock,
} from "@/lib/services/livestock.service";
import { uploadLivestockImage, deleteLivestockImage } from "@/lib/s3";
import { Loader2, ImagePlus, Sparkles, X, ZoomIn } from "lucide-react";
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
  const [analyzing, setAnalyzing] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const primaryImage =
    images.find((img) => img.is_primary) ??
    images.find((img) => img.image_url === imageUrl) ??
    null;
  const currentAnalysis = primaryImage?.ai_analysis ?? null;

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

  async function handleAnalyze() {
    if (!primaryImage) return;
    setAnalyzing(true);
    try {
      await analyzeLivestockImage(livestockId, primaryImage.image_url);
      queryClient.invalidateQueries({ queryKey: ["livestock", livestockId] });
      toast({ title: "AI analysis saved." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: `Analysis failed: ${msg}`, variant: "destructive" });
    } finally {
      setAnalyzing(false);
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
              disabled={deleting || !!currentAnalysis}
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

      {imageUrl && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !!currentAnalysis}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {currentAnalysis
                ? "AI analysis complete"
                : analyzing
                  ? "Analyzing image..."
                  : "Get AI analysis"}
            </button>
            {analyzing && (
              <span className="text-xs text-muted-foreground animate-pulse">
                This may take a short while. We are reviewing the image for
                practical cow health insights.
              </span>
            )}
          </div>

          {currentAnalysis && (
            <div className="rounded-lg border border-border bg-accent/40 p-4">
              <p className="text-sm font-semibold text-foreground mb-3">
                AI analysis
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-p:text-sm prose-li:text-sm prose-li:my-1 prose-strong:font-semibold prose-strong:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-foreground prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-2">
                <ReactMarkdown>{currentAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
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
