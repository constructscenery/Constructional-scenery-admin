import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { footerApi } from "@/api/footer";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { FormField } from "@/components/shared/FormField";

const schema = z.object({
  brandName: z.string().min(1),
  tagline: z.string().min(1),
  columns: z.array(
    z.object({
      title: z.string().min(1),
      links: z.array(
        z.object({
          label: z.string().min(1),
          url: z.string().min(1),
        })
      ),
    })
  ),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  vimeo: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function ColumnLinksField({ control, register, index, errors }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `columns.${index}.links` });
  
  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Links</label>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", url: "" })}>
          <Plus className="mr-2 h-3 w-3" /> Add Link
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <Input {...register(`columns.${index}.links.${i}.label`)} placeholder="Label (e.g. About)" className="h-8" />
              {errors?.columns?.[index]?.links?.[i]?.label && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div className="flex-1 space-y-1">
              <Input {...register(`columns.${index}.links.${i}.url`)} placeholder="URL (e.g. /about)" className="h-8" />
              {errors?.columns?.[index]?.links?.[i]?.url && <span className="text-xs text-red-500">Required</span>}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && <div className="text-xs text-muted-foreground text-center py-2 border rounded-md">No links.</div>}
      </div>
    </div>
  );
}

export function Footer() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["footer"], queryFn: () => footerApi.get().then((r) => r.data.data) });

  const [columnsOpen, setColumnsOpen] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { fields, append, remove } = useFieldArray({ control, name: "columns" });

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        columns: (data.columns || []).map((c: any) => ({
          title: c.title,
          links: Array.isArray(c.links)
            ? c.links.map((l: any) => typeof l === "string" ? { label: l, url: "#" } : l)
            : []
        }))
      });
    }
  }, [data, reset]);

  const { mutateAsync } = useMutation({
    mutationFn: (values: FormData) => {
      return footerApi.update(values);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["footer"] }); toast.success("Footer saved"); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div>
      <PageHeader title="Footer" description="Brand info, navigation columns, and social links." />
      <form onSubmit={handleSubmit((v) => mutateAsync(v))}>
        <Card><CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Brand Name" error={errors.brandName?.message}><Input {...register("brandName")} placeholder="Construct/Scenery" /></FormField>
          </div>
          <FormField label="Tagline" error={errors.tagline?.message}>
            <Textarea {...register("tagline")} rows={2} />
          </FormField>
          <Separator />
          
          <div className="space-y-4 border rounded-md p-4 bg-muted/10">
            <div 
              className="flex items-center justify-between cursor-pointer select-none" 
              onClick={() => setColumnsOpen(!columnsOpen)}
            >
              <div>
                <h3 className="text-sm font-medium">Navigation Columns</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure footer dropdowns and links.</p>
              </div>
              <Button type="button" variant="ghost" size="sm">
                {columnsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {columnsOpen && (
              <div className="pt-4 border-t space-y-4">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ title: "", links: [] })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Column
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md bg-background space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <FormField label="Column Title" error={errors.columns?.[index]?.title?.message}>
                          <Input {...register(`columns.${index}.title`)} placeholder="e.g. STUDIO" />
                        </FormField>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator />
                    <ColumnLinksField control={control} register={register} index={index} errors={errors} />
                  </div>
                ))}
                {fields.length === 0 && <div className="text-sm text-muted-foreground text-center py-8 border rounded-md">No columns added.</div>}
              </div>
            )}
          </div>

          <Separator />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="IMDB URL"><Input {...register("instagram")} placeholder="https://imdb.com/..." /></FormField>
            <FormField label="LinkedIn URL"><Input {...register("linkedin")} placeholder="https://linkedin.com/..." /></FormField>
            <FormField label="Vimeo URL"><Input {...register("vimeo")} placeholder="https://vimeo.com/..." /></FormField>
          </div>
        </CardContent></Card>
        <div className="mt-6 flex justify-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save Changes"}</Button></div>
      </form>
    </div>
  );
}
