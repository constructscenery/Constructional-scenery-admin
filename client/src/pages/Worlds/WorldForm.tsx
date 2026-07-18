import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { worldsApi } from "@/api/worlds";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { FormField } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  year: z.string().min(1),
  tags: z.string().min(1),
  category: z.string().min(1),
  heroImage: z.string().min(1),
  vimeoId: z.string().min(1),
  intro: z.string().min(1),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
  gallery: z.array(z.object({ url: z.string(), order: z.coerce.number().int().default(0) })),
  facts: z.array(z.object({ label: z.string(), value: z.string(), order: z.coerce.number().int().default(0) })),
  credits: z.array(z.object({ role: z.string(), name: z.string(), order: z.coerce.number().int().default(0) })),
  process: z.array(z.object({ title: z.string(), body: z.string(), imageUrl: z.string(), order: z.coerce.number().int().default(0) })),
  results: z.array(z.object({ value: z.string(), label: z.string(), order: z.coerce.number().int().default(0) })),
});
type FormData = z.infer<typeof schema>;

export function WorldForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["world", id],
    queryFn: () => worldsApi.getById(Number(id!)).then((r) => r.data.data),
    enabled: isEdit,
  });

  // Set ID-based cache entry once data loads
  useEffect(() => {
    if (data?.id) {
      const qcData = qc.getQueryData(["world", id]);
      qc.setQueryData(["world", data.id], qcData);
    }
  }, [data?.id, id, qc]);

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gallery: [], facts: [], credits: [], process: [], results: [], visible: true, order: 0 },
  });

  const gallery = useFieldArray({ control, name: "gallery" });
  const facts = useFieldArray({ control, name: "facts" });
  const credits = useFieldArray({ control, name: "credits" });
  const processSteps = useFieldArray({ control, name: "process" });
  const results = useFieldArray({ control, name: "results" });

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        tags: data.tags.join(", "),
        gallery: data.gallery.map((g) => ({ url: g.url, order: g.order })),
        facts: data.facts.map((f) => ({ label: f.label, value: f.value, order: f.order })),
        credits: data.credits.map((c) => ({ role: c.role, name: c.name, order: c.order })),
        process: data.process.map((p) => ({ title: p.title, body: p.body, imageUrl: p.imageUrl, order: p.order })),
        results: data.results.map((r) => ({ value: r.value, label: r.label, order: r.order })),
      });
    }
  }, [data, reset]);

  const createMut = useMutation({
    mutationFn: (values: FormData) => worldsApi.create({ ...values, tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["worlds"] }); toast.success("World created"); navigate(`/worlds/${res.data.data.id}/edit`); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: (values: FormData) => worldsApi.update(data!.id, { ...values, tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["worlds"] }); qc.invalidateQueries({ queryKey: ["world", data!.id] }); toast.success("World saved"); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const onSubmit = (values: FormData) => isEdit ? updateMut.mutateAsync(values) : createMut.mutateAsync(values);

  if (isEdit && isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/worlds")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Worlds
        </Button>
        <PageHeader title={isEdit ? `Edit — ${data?.title ?? "…"}` : "New World"} description="Full case study with gallery, facts, credits, process steps, and results." />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic">
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="facts">Facts</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* ── Basic Info ─────────────────────────────────── */}
          <TabsContent value="basic">
            <Card><CardContent className="space-y-5 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Title" error={errors.title?.message}><Input {...register("title")} placeholder="Clayface" /></FormField>
                <FormField label="Slug" error={errors.slug?.message} hint="URL-safe, e.g. clayface"><Input {...register("slug")} placeholder="clayface" /></FormField>
                <FormField label="Category" error={errors.category?.message}><Input {...register("category")} placeholder="Feature Film" /></FormField>
                <FormField label="Year" error={errors.year?.message}><Input {...register("year")} placeholder="2025" /></FormField>
                <FormField label="Role" error={errors.role?.message}><Input {...register("role")} placeholder="Scenic Construction · Sculpting" /></FormField>
                <FormField label="Tags" error={errors.tags?.message} hint="Comma-separated"><Input {...register("tags")} placeholder="Feature Film, DC, Practical Build" /></FormField>
                <FormField label="Vimeo ID" error={errors.vimeoId?.message}><Input {...register("vimeoId")} placeholder="76979871" /></FormField>
                <FormField label="Display Order"><Input type="number" {...register("order")} /></FormField>
              </div>
              <FormField label="Summary" error={errors.summary?.message}>
                <Input {...register("summary")} placeholder="Forging the textured underworld of a DC feature villain." />
              </FormField>
              <FormField label="Intro Paragraph" error={errors.intro?.message}>
                <Textarea {...register("intro")} rows={5} />
              </FormField>
              <ImageUpload label="Hero Image" value={watch("heroImage") ?? ""} onChange={(url) => setValue("heroImage", url)} />
              <div className="flex items-center gap-2">
                <Switch checked={watch("visible")} onCheckedChange={(v) => setValue("visible", v)} id="w-visible" />
                <Label htmlFor="w-visible">Visible on portfolio</Label>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ── Gallery ────────────────────────────────────── */}
          <TabsContent value="gallery">
            <Card><CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <Label className="text-base font-medium">Gallery Images</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => gallery.append({ url: "", order: gallery.fields.length })}>
                  <Plus className="mr-1 h-3 w-3" />Add Image
                </Button>
              </div>
              <div className="space-y-3">
                {gallery.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <ImageUpload label={`Image ${i + 1}`} value={watch(`gallery.${i}.url`) ?? ""} onChange={(url) => setValue(`gallery.${i}.url`, url)} />
                    </div>
                    <Input type="number" {...register(`gallery.${i}.order`)} className="w-16" placeholder="Order" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => gallery.remove(i)} className="mb-0.5">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ── Facts ─────────────────────────────────────── */}
          <TabsContent value="facts">
            <Card><CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <Label className="text-base font-medium">Key Facts / Stats</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => facts.append({ label: "", value: "", order: facts.fields.length })}>
                  <Plus className="mr-1 h-3 w-3" />Add Fact
                </Button>
              </div>
              <div className="space-y-2">
                {facts.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <Input {...register(`facts.${i}.label`)} placeholder="Build weeks" className="flex-1" />
                    <Input {...register(`facts.${i}.value`)} placeholder="26" className="w-28" />
                    <Input type="number" {...register(`facts.${i}.order`)} className="w-16" placeholder="Order" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => facts.remove(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ── Credits ───────────────────────────────────── */}
          <TabsContent value="credits">
            <Card><CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <Label className="text-base font-medium">Film Credits</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => credits.append({ role: "", name: "", order: credits.fields.length })}>
                  <Plus className="mr-1 h-3 w-3" />Add Credit
                </Button>
              </div>
              <div className="space-y-2">
                {credits.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <Input {...register(`credits.${i}.role`)} placeholder="Director" className="w-40" />
                    <Input {...register(`credits.${i}.name`)} placeholder="James Watkins" className="flex-1" />
                    <Input type="number" {...register(`credits.${i}.order`)} className="w-16" placeholder="Order" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => credits.remove(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ── Process ───────────────────────────────────── */}
          <TabsContent value="process">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Process Narrative Steps</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => processSteps.append({ title: "", body: "", imageUrl: "", order: processSteps.fields.length })}>
                  <Plus className="mr-1 h-3 w-3" />Add Step
                </Button>
              </div>
              {processSteps.fields.map((f, i) => (
                <Card key={f.id}>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Step {i + 1}</Label>
                      <Button type="button" variant="ghost" size="icon" onClick={() => processSteps.remove(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <FormField label="Title"><Input {...register(`process.${i}.title`)} placeholder="From maquette to monument" /></FormField>
                    <FormField label="Body"><Textarea {...register(`process.${i}.body`)} rows={3} /></FormField>
                    <ImageUpload label="Step Image" value={watch(`process.${i}.imageUrl`) ?? ""} onChange={(url) => setValue(`process.${i}.imageUrl`, url)} />
                    <FormField label="Order"><Input type="number" {...register(`process.${i}.order`)} className="w-20" /></FormField>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Results ───────────────────────────────────── */}
          <TabsContent value="results">
            <Card><CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <Label className="text-base font-medium">Result Metrics</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => results.append({ value: "", label: "", order: results.fields.length })}>
                  <Plus className="mr-1 h-3 w-3" />Add Result
                </Button>
              </div>
              <div className="space-y-2">
                {results.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <Input {...register(`results.${i}.value`)} placeholder="26wk" className="w-28" />
                    <Input {...register(`results.${i}.label`)} placeholder="Build" className="flex-1" />
                    <Input type="number" {...register(`results.${i}.order`)} className="w-16" placeholder="Order" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => results.remove(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/worlds")}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || createMut.isPending || updateMut.isPending}>
            {isSubmitting || createMut.isPending || updateMut.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create World"}
          </Button>
        </div>
      </form>
    </div>
  );
}
