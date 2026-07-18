import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { logosApi } from "@/api/logos";
import { Logo } from "@/types";
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
  name: z.string().min(1, "Name required"),
  imageUrl: z.string().optional(),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function LogoForm({ defaultValues, onSubmit, loading }: { defaultValues?: Partial<FormData>; onSubmit: (d: FormData) => void; loading: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visible: true, order: 0, ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Logo Name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="BBC" />
      </FormField>
      <ImageUpload label="Logo Image (optional)" value={watch("imageUrl") ?? ""} onChange={(url) => setValue("imageUrl", url)} />
      <FormField label="Display Order (Auto-managed)">
        <Input type="number" {...register("order")} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
      </FormField>
      <div className="flex items-center gap-2">
        <Switch checked={watch("visible")} onCheckedChange={(v) => setValue("visible", v)} id="visible" />
        <Label htmlFor="visible">Visible</Label>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export function Logos() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Logo | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["logos"], queryFn: () => logosApi.list().then((r) => r.data.data) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["logos"] });

  const createMut = useMutation({ mutationFn: logosApi.create, onSuccess: () => { invalidate(); setAddOpen(false); toast.success("Logo added"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Logo> }) => logosApi.update(id, data), onSuccess: () => { invalidate(); setEditItem(null); toast.success("Logo updated"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const reorderMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Logo> }) => logosApi.update(id, data), onSuccess: () => { invalidate(); toast.success("Order updated"); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const deleteMut = useMutation({ mutationFn: (id: number) => logosApi.delete(id), onSuccess: () => { invalidate(); setDeleteId(null); toast.success("Logo deleted"); }, onError: (e) => toast.error(getErrorMessage(e)) });

  return (
    <div>
      <PageHeader title="Client Logos" description="Logos shown in the trusted-by marquee section." action={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Logo</Button>} />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Image</TableHead><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((logo) => (
              <TableRow 
                key={logo.id}
                draggable
                onDragStart={() => setDraggedId(logo.id)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId !== null && draggedId !== logo.id) {
                    reorderMut.mutate({ id: draggedId, data: { order: logo.order } });
                  }
                  setDraggedId(null);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={draggedId === logo.id ? "opacity-30 bg-muted/50 cursor-grabbing" : "cursor-grab"}
              >
                <TableCell className="font-medium">{logo.name}</TableCell>
                <TableCell>{logo.imageUrl ? <img src={logo.imageUrl} alt={logo.name} className="h-8 w-16 object-contain" /> : <span className="text-muted-foreground text-xs">Text only</span>}</TableCell>
                <TableCell>{logo.order}</TableCell>
                <TableCell><Badge variant={logo.visible ? "default" : "secondary"}>{logo.visible ? "Visible" : "Hidden"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => setEditItem(logo)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={reorderMut.isPending || data?.[0]?.id === logo.id} onClick={() => {
                      const idx = data?.findIndex((x) => x.id === logo.id) ?? -1;
                      const prev = idx > 0 ? data?.[idx - 1] : undefined;
                      if (prev) reorderMut.mutate({ id: logo.id, data: { order: prev.order } });
                    }}><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" disabled={reorderMut.isPending || data?.[data.length - 1]?.id === logo.id} onClick={() => {
                      const idx = data?.findIndex((x) => x.id === logo.id) ?? -1;
                      const next = idx >= 0 ? data?.[idx + 1] : undefined;
                      if (next) reorderMut.mutate({ id: logo.id, data: { order: next.order } });
                    }}><ArrowDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(logo.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Logo</DialogTitle></DialogHeader>
          <LogoForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Logo</DialogTitle></DialogHeader>
          {editItem && <LogoForm defaultValues={editItem} onSubmit={(d) => updateMut.mutate({ id: editItem.id, data: d })} loading={updateMut.isPending} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => deleteId !== null && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} description="This logo will be permanently removed." />
    </div>
  );
}
