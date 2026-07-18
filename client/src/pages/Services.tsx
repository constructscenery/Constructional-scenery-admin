import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { servicesApi } from "@/api/services";
import { Service } from "@/types";
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

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  iconName: z.string().min(1),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function ServiceForm({ defaultValues, onSubmit, loading }: { defaultValues?: Partial<FormData>; onSubmit: (d: FormData) => void; loading: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visible: true, order: 0, ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Title" error={errors.title?.message}><Input {...register("title")} placeholder="Film Set Construction" /></FormField>
      <FormField label="Description" error={errors.description?.message}><Textarea {...register("description")} rows={2} /></FormField>
      <FormField label="Lucide Icon Name" error={errors.iconName?.message} hint="e.g. Clapperboard, Tv, Hammer"><Input {...register("iconName")} placeholder="Clapperboard" /></FormField>
      <FormField label="Display Order (Auto-managed)">
        <Input type="number" {...register("order")} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
      </FormField>
      <div className="flex items-center gap-2">
        <Switch checked={watch("visible")} onCheckedChange={(v) => setValue("visible", v)} id="svc-visible" />
        <Label htmlFor="svc-visible">Visible</Label>
      </div>
      <DialogFooter><Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button></DialogFooter>
    </form>
  );
}

export function Services() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["services"], queryFn: () => servicesApi.list().then((r) => r.data.data) });
  const inv = () => qc.invalidateQueries({ queryKey: ["services"] });

  const createMut = useMutation({ mutationFn: servicesApi.create, onSuccess: () => { inv(); setAddOpen(false); toast.success("Service added"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Service> }) => servicesApi.update(id, data), onSuccess: () => { inv(); setEditItem(null); toast.success("Service updated"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const reorderMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Service> }) => servicesApi.update(id, data), onSuccess: () => { inv(); toast.success("Order updated"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const deleteMut = useMutation({ mutationFn: servicesApi.delete, onSuccess: () => { inv(); setDeleteId(null); toast.success("Service deleted"); }, onError: (e) => toast.error(getErrorMessage(e)) });

  return (
    <div>
      <PageHeader title="Services" description="The six service disciplines shown in the capabilities section." action={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Service</Button>} />
      {isLoading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : (
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Icon</TableHead><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((s) => (
              <TableRow 
                key={s.id}
                draggable
                onDragStart={() => setDraggedId(s.id)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId !== null && draggedId !== s.id) {
                    reorderMut.mutate({ id: draggedId, data: { order: s.order } });
                  }
                  setDraggedId(null);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={draggedId === s.id ? "opacity-30 bg-muted/50 cursor-grabbing" : "cursor-grab"}
              >
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{s.iconName}</code></TableCell>
                <TableCell>{s.order}</TableCell>
                <TableCell><Badge variant={s.visible ? "default" : "secondary"}>{s.visible ? "Visible" : "Hidden"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => setEditItem(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={reorderMut.isPending || data?.[0]?.id === s.id} onClick={() => {
                      const idx = data?.findIndex((x) => x.id === s.id) ?? -1;
                      const prev = idx > 0 ? data?.[idx - 1] : undefined;
                      if (prev) reorderMut.mutate({ id: s.id, data: { order: prev.order } });
                    }}><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={reorderMut.isPending || data?.[data.length - 1]?.id === s.id} onClick={() => {
                      const idx = data?.findIndex((x) => x.id === s.id) ?? -1;
                      const next = idx >= 0 ? data?.[idx + 1] : undefined;
                      if (next) reorderMut.mutate({ id: s.id, data: { order: next.order } });
                    }}><ArrowDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent><DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader><ServiceForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} /></DialogContent></Dialog>
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}><DialogContent><DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>{editItem && <ServiceForm defaultValues={editItem} onSubmit={(d) => updateMut.mutate({ id: editItem.id, data: d })} loading={updateMut.isPending} />}</DialogContent></Dialog>
      <ConfirmDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => deleteId !== null && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
}
