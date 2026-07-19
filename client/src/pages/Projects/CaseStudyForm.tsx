/**
 * CaseStudyForm — edit the full case-study detail attached to a project.
 *
 * Route: /projects/:projectId/case-study
 *
 * Flow:
 *  1. Load all projects → find the one with projectId
 *  2. Use project.worldId to load the World record (gallery, facts, credits, …)
 *  3. If no world exists yet (backend hasn't auto-created it) show a helpful notice
 */
import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, AlertCircle, Upload } from "lucide-react";
import { worldsApi } from "@/api/worlds";
import { projectsApi } from "@/api/projects";
import { uploadApi } from "@/api/upload";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/PageHeader";
import { FormField } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";

// ─── Form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  year: z.string().min(1),
  tags: z.string().min(1),
  category: z.string().min(1),
  heroImage: z.string().min(1),
  vimeoId: z.string().default(""),
  intro: z.string().min(1),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(false),
  gallery: z.array(
    z.object({ url: z.string(), order: z.coerce.number().int().default(0) }),
  ),
  facts: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      order: z.coerce.number().int().default(0),
    }),
  ),
  credits: z.array(
    z.object({
      role: z.string(),
      name: z.string(),
      order: z.coerce.number().int().default(0),
    }),
  ),
});
type FormData = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function CaseStudyForm() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdStr);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Load project list → find our project
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then((r) => r.data.data),
  });

  const project = projects?.find((p) => p.id === projectId) ?? null;
  const worldId = project?.worldId ?? null;

  // 2. Load the linked world (by worldId)
  const { data: world, isLoading: worldLoading, isError: worldError } = useQuery({
    queryKey: ["world", worldId],
    queryFn: () => worldsApi.getById(worldId!).then((r) => r.data.data),
    enabled: worldId !== null,
    retry: false,
  });

  const isLoading = projectsLoading || (worldId !== null && worldLoading);

  // 3. Form setup
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gallery: [], facts: [], credits: [], visible: false, order: 0, vimeoId: "" },
  });

  const galleryArr = useFieldArray({ control, name: "gallery" });
  const factsArr = useFieldArray({ control, name: "facts" });
  const creditsArr = useFieldArray({ control, name: "credits" });

  // Populate form once world data arrives
  useEffect(() => {
    if (world) {
      reset({
        ...world,
        tags: world.tags.join(", "),
        gallery: (world.gallery ?? []).map((g) => ({ url: g.url, order: g.order })),
        facts: (world.facts ?? []).map((f) => ({ label: f.label, value: f.value, order: f.order })),
        credits: (world.credits ?? []).map((c) => ({ role: c.role, name: c.name, order: c.order })),
      });
    }
  }, [world, reset]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsBulkUploading(true);
    toast.info(`Uploading ${files.length} images...`);
    const promises = Array.from(files).map(async (file) => {
      try {
        const res = await uploadApi.uploadImage(file);
        return { success: true, url: res.data.data.url, name: file.name };
      } catch (err) {
        return { success: false, url: "", name: file.name };
      }
    });

    const results = await Promise.all(promises);
    
    const successfulUploads = results.filter(res => res.success);
    const failedUploads = results.filter(res => !res.success);

    if (successfulUploads.length > 0) {
      const startIndex = galleryArr.fields.length;
      const newItems = successfulUploads.map((res, idx) => ({
        url: res.url,
        order: startIndex + idx,
      }));
      galleryArr.append(newItems);
      toast.success(`Successfully uploaded ${successfulUploads.length} images`);
    }

    failedUploads.forEach(res => {
      toast.error(`Failed to upload ${res.name}`);
    });
    setIsBulkUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 4. Save mutation
  const updateMut = useMutation({
    mutationFn: (values: FormData) => {
      if (!worldId) throw new Error("No world ID found. Save the project first.");
      return worldsApi.update(worldId, {
        ...values,
        // Pass undefined instead of empty string — backend requires min(1) or absent
        vimeoId: values.vimeoId?.trim() || undefined,
        tags: values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        projectId: projectId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["worlds"] });
      qc.invalidateQueries({ queryKey: ["world", worldId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Case study saved");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // ─── Project not found ──────────────────────────────────────────────────────

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Project not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ─── Project has no slug → no world can exist ──────────────────────────────

  if (!project.slug) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This project doesn't have a slug yet. Edit the project and add a slug to enable a
            case-study detail page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/projects")}>Go back and add a slug</Button>
      </div>
    );
  }

  // ─── World not yet created or error loading ─────────────────────────────

  if (!worldId || (!world && !worldError)) {
    // worldId exists but world is still being fetched — this case is covered
    // by isLoading above; reaching here means worldId is null (DB link not set yet)
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The case study for <strong>{project.name}</strong> is still being set up in the
            background. Try refreshing in a moment.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["projects"] })}>
          Refresh
        </Button>
      </div>
    );
  }

  if (worldError || !world) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Could not load the case study. The record may have been deleted. Go back and
            re-save the project to regenerate it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ─── Main form ─────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/projects")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        <PageHeader
          title={`Case Study — ${project.name}`}
          description="Full detail page: gallery, facts, credits and intro paragraph."
        />
      </div>

      <form onSubmit={handleSubmit((v) => updateMut.mutateAsync(v))}>
        <Tabs defaultValue="basic">
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="facts">Facts</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
          </TabsList>

          {/* ── Basic Info ──────────────────────────────────────────────────── */}
          <TabsContent value="basic">
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Title" error={errors.title?.message}>
                    <Input {...register("title")} placeholder={project.name} />
                  </FormField>
                  <FormField
                    label="Slug (Synced with Project)"
                    error={errors.slug?.message}
                    hint="To change the slug, edit the Project in the grid."
                  >
                    <Input
                      {...register("slug")}
                      readOnly
                      className="bg-muted text-muted-foreground focus-visible:ring-0 cursor-not-allowed"
                    />
                  </FormField>
                  <FormField label="Category" error={errors.category?.message}>
                    <Input {...register("category")} placeholder="Feature Film" />
                  </FormField>
                  <FormField label="Year" error={errors.year?.message}>
                    <Input {...register("year")} placeholder="2025" />
                  </FormField>
                  <FormField label="Tags" error={errors.tags?.message} hint="Comma-separated">
                    <Input {...register("tags")} placeholder="Feature Film, DC, Practical Build" />
                  </FormField>
                  <FormField label="Vimeo ID" hint="Optional — leave blank if no reel">
                    <Input {...register("vimeoId")} placeholder="76979871" />
                  </FormField>
                  <FormField label="Display Order">
                    <Input type="number" {...register("order")} />
                  </FormField>
                </div>
                <FormField label="Summary" error={errors.summary?.message}>
                  <Input
                    {...register("summary")}
                    placeholder="Forging the textured underworld of a DC feature villain."
                  />
                </FormField>
                <FormField label="Intro Paragraph" error={errors.intro?.message}>
                  <Textarea {...register("intro")} rows={5} />
                </FormField>
                <ImageUpload
                  label="Hero Image"
                  value={watch("heroImage") ?? ""}
                  onChange={(url) => setValue("heroImage", url)}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={watch("visible")}
                    onCheckedChange={(v) => setValue("visible", v)}
                    id="cs-visible"
                  />
                  <Label htmlFor="cs-visible">Published (visible on portfolio)</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Gallery ────────────────────────────────────────────────────── */}
          <TabsContent value="gallery">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-base font-medium">Gallery Images</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBulkUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1 h-3 w-3" /> {isBulkUploading ? "Uploading..." : "Bulk Upload"}
                    </Button>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleBulkUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        galleryArr.append({ url: "", order: galleryArr.fields.length })
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Image
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {galleryArr.fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <ImageUpload
                          label={`Image ${i + 1}`}
                          value={watch(`gallery.${i}.url`) ?? ""}
                          onChange={(url) => setValue(`gallery.${i}.url`, url)}
                        />
                      </div>
                      <Input
                        type="number"
                        {...register(`gallery.${i}.order`)}
                        className="w-16"
                        placeholder="Order"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => galleryArr.remove(i)}
                        className="mb-0.5"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {galleryArr.fields.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No gallery images yet. Add the first one above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Facts ──────────────────────────────────────────────────────── */}
          <TabsContent value="facts">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-base font-medium">Key Facts / Stats</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      factsArr.append({ label: "", value: "", order: factsArr.fields.length })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Fact
                  </Button>
                </div>
                <div className="space-y-2">
                  {factsArr.fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2">
                      <Input
                        {...register(`facts.${i}.label`)}
                        placeholder="Build weeks"
                        className="flex-1"
                      />
                      <Input
                        {...register(`facts.${i}.value`)}
                        placeholder="26"
                        className="w-28"
                      />
                      <Input
                        type="number"
                        {...register(`facts.${i}.order`)}
                        className="w-16"
                        placeholder="Order"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => factsArr.remove(i)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {factsArr.fields.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No facts yet. Add the first one above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Credits ────────────────────────────────────────────────────── */}
          <TabsContent value="credits">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-base font-medium">Film Credits</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      creditsArr.append({ role: "", name: "", order: creditsArr.fields.length })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Credit
                  </Button>
                </div>
                <div className="space-y-2">
                  {creditsArr.fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2">
                      <Input
                        {...register(`credits.${i}.role`)}
                        placeholder="Director"
                        className="w-40"
                      />
                      <Input
                        {...register(`credits.${i}.name`)}
                        placeholder="James Watkins"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        {...register(`credits.${i}.order`)}
                        className="w-16"
                        placeholder="Order"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => creditsArr.remove(i)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {creditsArr.fields.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No credits yet. Add the first one above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/projects")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || updateMut.isPending}>
            {isSubmitting || updateMut.isPending ? "Saving…" : "Save Case Study"}
          </Button>
        </div>
      </form>
    </div>
  );
}
