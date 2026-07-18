import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, BookOpen } from "lucide-react";
import { projectsApi } from "@/api/projects";
import { Project } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormField } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";

const schema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  services: z.string().min(1),
  year: z.string().min(1),
  slug: z.string().optional(),
  imageUrl: z.string().min(1),
  span: z.string().optional(),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function ProjectForm({ defaultValues, onSubmit, loading }: { defaultValues?: Partial<FormData>; onSubmit: (d: FormData) => void; loading: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visible: true, order: 0, ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Project Name" error={errors.name?.message}><Input {...register("name")} placeholder="Clayface" /></FormField>
        <FormField label="Project Type" error={errors.type?.message}><Input {...register("type")} placeholder="DC Feature Film" /></FormField>
        <FormField label="Services" error={errors.services?.message}><Input {...register("services")} placeholder="Sculpting · Standby · Hero build" /></FormField>
        <FormField label="Year" error={errors.year?.message}><Input {...register("year")} placeholder="2025" /></FormField>
        <FormField label="Slug (for case study)" hint="Leave empty if no case study page"><Input {...register("slug")} placeholder="clayface" /></FormField>
        <FormField label="Grid Span" hint="row-span-2 for tall tile"><Input {...register("span")} placeholder="row-span-2" /></FormField>
        <FormField label="Display Order"><Input type="number" {...register("order")} /></FormField>
      </div>
      <ImageUpload label="Project Image" value={watch("imageUrl") ?? ""} onChange={(url) => setValue("imageUrl", url)} />
      <div className="flex items-center gap-2">
        <Switch checked={watch("visible")} onCheckedChange={(v) => setValue("visible", v)} id="proj-visible" />
        <Label htmlFor="proj-visible">Visible</Label>
      </div>
      <DialogFooter><Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button></DialogFooter>
    </form>
  );
}

export function Projects() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list().then((r) => r.data.data) });
  const inv = () => qc.invalidateQueries({ queryKey: ["projects"] });

  const createMut = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (res) => {
      inv();
      qc.invalidateQueries({ queryKey: ["worlds"] });
      setAddOpen(false);
      const slug = res.data.data?.slug;
      if (slug) {
        toast.success("Project created — world case study page drafted", {
          description: `Edit the full case study under Worlds / ${slug}`,
        });
      } else {
        toast.success("Project added");
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) => projectsApi.update(id, data), onSuccess: () => { inv(); setEditItem(null); toast.success("Project updated"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const deleteMut = useMutation({ mutationFn: projectsApi.delete, onSuccess: () => { inv(); setDeleteId(null); toast.success("Project deleted"); }, onError: (e) => toast.error(getErrorMessage(e)) });

  return (
    <div>
      <PageHeader title="Projects" description="Portfolio grid projects shown in the 'Worlds we've built' section." action={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Project</Button>} />
      {isLoading ? <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : (
        <Table>
          <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Year</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell><img src={p.imageUrl} alt={p.name} className="h-10 w-16 rounded object-cover" /></TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.type}</TableCell>
                <TableCell>{p.year}</TableCell>
                <TableCell>{p.slug ? <code className="text-xs bg-muted px-1 rounded">{p.slug}</code> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                <TableCell><Badge variant={p.visible ? "default" : "secondary"}>{p.visible ? "Visible" : "Hidden"}</Badge></TableCell>
                <TableCell className="text-right">
                  {p.slug && (
                    <Link to={`/worlds/${p.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit case study">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setEditItem(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Add Project</DialogTitle></DialogHeader><ProjectForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} /></DialogContent></Dialog>
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>{editItem && <ProjectForm defaultValues={{ ...editItem, imageUrl: editItem.imageUrl }} onSubmit={(d) => updateMut.mutate({ id: editItem.id, data: d })} loading={updateMut.isPending} />}</DialogContent></Dialog>
      <ConfirmDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => deleteId !== null && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
}
