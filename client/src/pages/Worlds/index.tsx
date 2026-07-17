import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { worldsApi } from "@/api/worlds";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function Worlds() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["worlds"], queryFn: () => worldsApi.list().then((r) => r.data.data) });

  const deleteMut = useMutation({
    mutationFn: (id: number) => worldsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["worlds"] }); setDeleteId(null); toast.success("World deleted"); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Worlds / Case Studies"
        description="Full case study pages accessible at /worlds/:slug on the portfolio."
        action={<Link to="/worlds/new"><Button><Plus className="mr-2 h-4 w-4" />New World</Button></Link>}
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((w) => (
              <TableRow key={w.id}>
                <TableCell>
                  <img src={w.heroImage} alt={w.title} className="h-10 w-16 rounded object-cover" />
                </TableCell>
                <TableCell className="font-medium">{w.title}</TableCell>
                <TableCell><code className="text-xs bg-muted px-1 rounded">{w.slug}</code></TableCell>
                <TableCell className="text-sm text-muted-foreground">{w.category}</TableCell>
                <TableCell>{w.year}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {w.tags.slice(0, 2).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    {w.tags.length > 2 && <Badge variant="outline" className="text-xs">+{w.tags.length - 2}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {w.visible ? (
                    <Badge className="gap-1"><Eye className="h-3 w-3" />Live</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" />Hidden</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/worlds/${w.slug}/edit`}>
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(w.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete world?"
        description={`This will permanently delete this world and all its gallery, facts, credits, process steps, and results.`}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
