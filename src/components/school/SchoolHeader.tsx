import { Building2, ImagePlus, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { uploadSchoolAsset, useUpdateSchool } from "@/lib/school/hooks";

export function SchoolHeader({ school }: { school: Tables<"schools"> }) {
  const update = useUpdateSchool(school.id);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  const handleUpload = async (kind: "logo" | "cover", file: File) => {
    try {
      setUploading(kind);
      const url = await uploadSchoolAsset(school.id, kind, file);
      await update.mutateAsync({ [kind === "logo" ? "logo_url" : "cover_url"]: url });
      toast.success(`${kind === "logo" ? "Logo" : "Cover image"} updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div
        className="relative h-40 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent-brand/20 sm:h-52"
        style={
          school.cover_url
            ? { backgroundImage: `url(${school.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-3 top-3 gap-1.5 backdrop-blur"
          onClick={() => coverRef.current?.click()}
          disabled={uploading === "cover"}
        >
          {uploading === "cover" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          Change cover
        </Button>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload("cover", e.target.files[0])}
        />
      </div>
      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:gap-6 sm:px-6">
        <div className="-mt-12 sm:-mt-14">
          <button
            type="button"
            onClick={() => logoRef.current?.click()}
            className="group relative grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-elevated sm:h-28 sm:w-28"
          >
            {school.logo_url ? (
              <img src={school.logo_url} alt="School logo" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading === "logo" ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Upload className="h-5 w-5 text-white" />
              )}
            </span>
          </button>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload("logo", e.target.files[0])}
          />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{school.name}</h1>
          {school.motto && <p className="mt-0.5 truncate text-sm italic text-muted-foreground">"{school.motto}"</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-0.5 font-medium capitalize">{school.school_type}</span>
            {school.state && <span className="rounded-md bg-muted px-2 py-0.5">{school.state}, {school.country}</span>}
            {school.currency && <span className="rounded-md bg-muted px-2 py-0.5">{school.currency}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}