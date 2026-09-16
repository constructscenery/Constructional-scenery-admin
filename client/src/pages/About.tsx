import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { aboutApi } from "@/api/about";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { FormField } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";

const schema = z.object({
  headline: z.string().min(1),
  bodyText: z.string().min(1),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1),
  stats: z.array(z.object({ value: z.string(), label: z.string() })),
  pillars: z.array(z.object({ title: z.string(), description: z.string() })),
});
type FormData = z.infer<typeof schema>;

export function About() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["about"], queryFn: () => aboutApi.get().then((r) => r.data.data) });

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stats: [], pillars: [] },
  });

  const stats = useFieldArray({ control, name: "stats" });
  const pillars = useFieldArray({ control, name: "pillars" });

  useEffect(() => { if (data) reset(data); }, [data, reset]);

  const { mutateAsync } = useMutation({
    mutationFn: aboutApi.update,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["about"] }); toast.success("About section saved"); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div>
      <PageHeader title="Studio (About)" description="The 'From concept to camera ready' section." />
      <form onSubmit={handleSubmit((v) => mutateAsync(v))}>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <FormField label="Headline" error={errors.headline?.message}>
              <Input {...register("headline")} placeholder="From concept to camera ready." />
            </FormField>
            <FormField
              label="Body Text"
              error={errors.bodyText?.message}
              hint="Press Enter where you want a line break on the website."
            >
              <Textarea {...register("bodyText")} rows={4} />
            </FormField>
            <ImageUpload label="Section Image" value={watch("imageUrl") ?? ""} onChange={(url) => setValue("imageUrl", url)} />
            <FormField label="Image Alt Text" error={errors.imageAlt?.message}>
              <Input {...register("imageAlt")} />
            </FormField>

            <Separator />
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium">Stats</label>
                <Button type="button" variant="outline" size="sm" onClick={() => stats.append({ value: "", label: "" })}><Plus className="mr-1 h-3 w-3" />Add</Button>
              </div>
              {stats.fields.map((f, i) => (
                <div key={f.id} className="mb-2 flex gap-2">
                  <Input {...register(`stats.${i}.value`)} placeholder="20+" className="w-24" />
                  <Input {...register(`stats.${i}.label`)} placeholder="Years" className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => stats.remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>

            <Separator />
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium">Service Pillars</label>
                <Button type="button" variant="outline" size="sm" onClick={() => pillars.append({ title: "", description: "" })}><Plus className="mr-1 h-3 w-3" />Add</Button>
              </div>
              {pillars.fields.map((f, i) => (
                <div key={f.id} className="mb-2 flex gap-2">
                  <Input {...register(`pillars.${i}.title`)} placeholder="Scenic Construction" className="w-1/3" />
                  <Input {...register(`pillars.${i}.description`)} placeholder="Description…" className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => pillars.remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</Button>
        </div>
      </form>
    </div>
  );
}
