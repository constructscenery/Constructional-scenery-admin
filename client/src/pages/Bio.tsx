import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { bioApi } from "@/api/bio";
import { PageHeader } from "@/components/shared/PageHeader";
import { FormField } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().nullable().optional(),
  links: z.array(
    z.object({
      label: z.string().min(1, "Label is required"),
      url: z.string().min(1, "URL is required"),
    })
  ).default([]),
});

type FormData = z.infer<typeof schema>;

export function Bio() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bio"],
    queryFn: () => bioApi.get().then((res) => res.data.data),
  });

  const mutation = useMutation({
    mutationFn: (values: FormData) => bioApi.update(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bio"] });
      toast.success("Bio updated successfully");
    },
    onError: () => {
      toast.error("Failed to update Bio");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bio" description="Manage your bio page profile and links." />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <div>Error loading bio data.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Bio Page" description="Manage your bio page profile and links." />
      
      <Card>
        <CardContent className="pt-6">
          <BioForm
            defaultValues={data || { name: "", role: "", description: "", links: [] }}
            onSubmit={(values) => mutation.mutate(values)}
            isPending={mutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BioForm({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  const watchImageUrl = watch("imageUrl");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <FormField label="Name" error={errors.name?.message}>
            <Input {...register("name")} placeholder="John Doe" />
          </FormField>
          
          <FormField label="Role" error={errors.role?.message}>
            <Input {...register("role")} placeholder="Founder & Director" />
          </FormField>
          
          <FormField label="Description" error={errors.description?.message}>
            <Textarea {...register("description")} rows={5} placeholder="Write a short bio..." />
          </FormField>
        </div>
        
        <div>
          <ImageUpload
            label="Profile Image"
            value={watchImageUrl ?? ""}
            onChange={(url) => setValue("imageUrl", url)}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Links</h3>
            <p className="text-sm text-muted-foreground">Add links to your social profiles or other websites.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", url: "" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Link
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No links added yet. Click "Add Link" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex-1 space-y-3">
                  <FormField label="Label" error={errors.links?.[index]?.label?.message}>
                    <Input {...register(`links.${index}.label` as const)} placeholder="e.g. Instagram" />
                  </FormField>
                </div>
                <div className="flex-1 space-y-3">
                  <FormField label="URL" error={errors.links?.[index]?.url?.message}>
                    <Input {...register(`links.${index}.url` as const)} placeholder="https://..." />
                  </FormField>
                </div>
                <div className="pt-8">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Bio"}
        </Button>
      </div>
    </form>
  );
}
