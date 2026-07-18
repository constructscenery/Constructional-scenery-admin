import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { testimonialsApi } from "@/api/testimonials";
import { Testimonial } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  text: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  imageUrl: z.string().min(1),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function TestimonialForm({ defaultValues, onSubmit, loading }: { defaultValues?: Partial<FormData>; onSubmit: (d: FormData) => void; loading: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visible: true, order: 0, ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Quote Text" error={errors.text?.message}><Textarea {...register("text")} rows={3} /></FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Name" error={errors.name?.message}><Input {...register("name")} placeholder="Eleanor Whitfield" /></FormField>
        <FormField label="Role / Company" error={errors.role?.message}><Input {...register("role")} placeholder="Production Designer, BBC Studios" /></FormField>
        <FormField label="Display Order (Auto-managed)">
          <Input type="number" {...register("order")} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
        </FormField>
      </div>
      <ImageUpload label="Avatar Image" value={watch("imageUrl") ?? ""} onChange={(url) => setValue("imageUrl", url)} />
      <div className="flex items-center gap-2">
        <Switch checked={watch("visible")} onCheckedChange={(v) => setValue("visible", v)} id="t-visible" />
        <Label htmlFor="t-visible">Visible</Label>
      </div>
      <DialogFooter><Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button></DialogFooter>
    </form>
  );
}

export function Testimonials() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Testimonial | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["testimonials"], queryFn: () => testimonialsApi.list().then((r) => r.data.data) });
  const inv = () => qc.invalidateQueries({ queryKey: ["testimonials"] });

  const createMut = useMutation({ mutationFn: testimonialsApi.create, onSuccess: () => { inv(); setAddOpen(false); toast.success("Testimonial added"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Testimonial> }) => testimonialsApi.update(id, data), onSuccess: () => { inv(); setEditItem(null); toast.success("Testimonial updated"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const reorderMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Testimonial> }) => testimonialsApi.update(id, data), onSuccess: () => { inv(); toast.success("Order updated"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const deleteMut = useMutation({ mutationFn: testimonialsApi.delete, onSuccess: () => { inv(); setDeleteId(null); toast.success("Testimonial deleted"); }, onError: (e) => toast.error(getErrorMessage(e)) });

  return (
    <div>
      <PageHeader title="Testimonials" description="9 industry testimonials shown in the scrolling columns section." action={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Testimonial</Button>} />
      {isLoading ? <div className="space-y-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : (
        <Table>
          <TableHeader><TableRow><TableHead>Avatar</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Quote</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((t) => (
              <TableRow 
                key={t.id}
                draggable
                onDragStart={() => setDraggedId(t.id)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId !== null && draggedId !== t.id) {
                    reorderMut.mutate({ id: draggedId, data: { order: t.order } });
                  }
                  setDraggedId(null);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={draggedId === t.id ? "opacity-30 bg-muted/50 cursor-grabbing" : "cursor-grab"}
              >
                <TableCell><img src={t.imageUrl} alt={t.name} className="h-9 w-9 rounded-full object-cover" /></TableCell>
                <TableCell className="font-medium whitespace-nowrap">{t.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{t.role}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">"{t.text}"</TableCell>
                <TableCell><Badge variant={t.visible ? "default" : "secondary"}>{t.visible ? "Visible" : "Hidden"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => setEditItem(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={reorderMut.isPending || data?.[0]?.id === t.id} onClick={() => {
                      const idx = data?.findIndex((x) => x.id === t.id) ?? -1;
                      const prev = idx > 0 ? data?.[idx - 1] : undefined;
                      if (prev) reorderMut.mutate({ id: t.id, data: { order: prev.order } });
                    }}><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={reorderMut.isPending || data?.[data.length - 1]?.id === t.id} onClick={() => {
                      const idx = data?.findIndex((x) => x.id === t.id) ?? -1;
                      const next = idx >= 0 ? data?.[idx + 1] : undefined;
                      if (next) reorderMut.mutate({ id: t.id, data: { order: next.order } });
                    }}><ArrowDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Add Testimonial</DialogTitle></DialogHeader><TestimonialForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} /></DialogContent></Dialog>
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Edit Testimonial</DialogTitle></DialogHeader>{editItem && <TestimonialForm defaultValues={editItem} onSubmit={(d) => updateMut.mutate({ id: editItem.id, data: d })} loading={updateMut.isPending} />}</DialogContent></Dialog>
      <ConfirmDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => deleteId !== null && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
}
