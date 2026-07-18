import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, Pencil, Trash2, Plus,
  FileText, PlusCircle, Eye, EyeOff,
} from "lucide-react";
import { projectsApi } from "@/api/projects";
import { Project } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormField } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";

// ─── Project form schema (no worldId — managed automatically via slug) ────────

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

// ─── Inline project create / edit form ───────────────────────────────────────

function ProjectForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<FormData>;
  onSubmit: (d: FormData) => void;
  loading: boolean;
}) {
  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visible: true, order: 0, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Project Name" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Clayface" />
        </FormField>
        <FormField label="Project Type" error={errors.type?.message}>
          <Input {...register("type")} placeholder="DC Feature Film" />
        </FormField>
        <FormField label="Services" error={errors.services?.message}>
          <Input {...register("services")} placeholder="Sculpting · Standby · Hero build" />
        </FormField>
        <FormField label="Year" error={errors.year?.message}>
          <Input {...register("year")} placeholder="2025" />
        </FormField>
        <FormField
          label="Slug (enables case study page)"
          hint="URL-safe, e.g. clayface — leave empty for no detail page"
        >
          <Input {...register("slug")} placeholder="clayface" />
        </FormField>
        <FormField label="Grid Span" hint="row-span-2 for tall tile">
          <Input {...register("span")} placeholder="row-span-2" />
        </FormField>
        <FormField label="Display Order (Auto-managed)">
          <Input type="number" {...register("order")} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
        </FormField>
      </div>
      <ImageUpload
        label="Project Image"
        value={watch("imageUrl") ?? ""}
        onChange={(url) => setValue("imageUrl", url)}
      />
      <div className="flex items-center gap-2">
        <Switch
          checked={watch("visible")}
          onCheckedChange={(v) => setValue("visible", v)}
          id="proj-visible"
        />
        <Label htmlFor="proj-visible">Visible in portfolio grid</Label>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Case-study status badge ──────────────────────────────────────────────────

function CaseStudyBadge({ project }: { project: Project }) {
  if (!project.slug) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (project.worldId) {
    return (
      <Link to={`/projects/${project.id}/case-study`}>
        <Badge variant="default" className="gap-1 text-xs hover:bg-primary/80 cursor-pointer transition-colors">
          <Eye className="h-3 w-3" />
          Live draft
        </Badge>
      </Link>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <EyeOff className="h-3 w-3" />
      Drafting…
    </Badge>
  );
}

// ─── Main Projects page ───────────────────────────────────────────────────────

export function Projects() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then((r) => r.data.data),
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["projects"] });

  const createMut = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (res) => {
      inv();
      qc.invalidateQueries({ queryKey: ["worlds"] });
      setAddOpen(false);
      const p = res.data.data;
      if (p?.slug) {
        toast.success("Project created — case study page drafted", {
          description: "Open the case study editor from the project row to fill in the full detail.",
          action: p.worldId
            ? { label: "Edit case study", onClick: () => navigate(`/projects/${p.id}/case-study`) }
            : undefined,
        });
      } else {
        toast.success("Project added");
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      inv();
      qc.invalidateQueries({ queryKey: ["worlds"] });
      setEditItem(null);
      toast.success("Project updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const reorderMut = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      projectsApi.update(id, { order }),
    onSuccess: () => { inv(); toast.success("Order updated"); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      inv();
      qc.invalidateQueries({ queryKey: ["worlds"] });
      setDeleteId(null);
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Portfolio grid tiles. Add a slug to any project to unlock its full case-study page — edit gallery, credits & more inline."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Case Study</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((p) => (
                <TableRow
                  key={p.id}
                  draggable
                  onDragStart={() => setDraggedId(p.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedId !== null && draggedId !== p.id) {
                      reorderMut.mutate({ id: draggedId, order: p.order });
                    }
                    setDraggedId(null);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                  className={draggedId === p.id ? "opacity-30 bg-muted/50 cursor-grabbing" : "cursor-grab"}
                >
                  <TableCell>
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-10 w-16 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.type}</TableCell>
                  <TableCell>{p.year}</TableCell>
                  <TableCell>
                    {p.slug ? (
                      <code className="text-xs bg-muted px-1 rounded">{p.slug}</code>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CaseStudyBadge project={p} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.visible ? "default" : "secondary"}>
                      {p.visible ? "Visible" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {/* Case study edit / add button */}
                      {p.slug && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/projects/${p.id}/case-study`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary hover:text-primary"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Edit case study</TooltipContent>
                        </Tooltip>
                      )}
                      {!p.slug && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground"
                              onClick={() => setEditItem(p)}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add slug to unlock case study</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Edit project basics */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditItem(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit project</TooltipContent>
                      </Tooltip>

                      {/* Reorder */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Move earlier"
                        disabled={reorderMut.isPending || data?.[0]?.id === p.id}
                        onClick={() => {
                          const idx = data?.findIndex((x) => x.id === p.id) ?? -1;
                          const prev = idx > 0 ? data?.[idx - 1] : undefined;
                          if (prev) reorderMut.mutate({ id: p.id, order: prev.order });
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Move later"
                        disabled={reorderMut.isPending || data?.[data.length - 1]?.id === p.id}
                        onClick={() => {
                          const idx = data?.findIndex((x) => x.id === p.id) ?? -1;
                          const next = idx >= 0 ? data?.[idx + 1] : undefined;
                          if (next) reorderMut.mutate({ id: p.id, order: next.order });
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <ProjectForm onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editItem && (
            <ProjectForm
              defaultValues={{ ...editItem }}
              onSubmit={(d) => updateMut.mutate({ id: editItem.id, data: d })}
              loading={updateMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete project?"
        description="This will permanently delete the project and its linked case study (gallery, credits, facts)."
        onConfirm={() => deleteId !== null && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
