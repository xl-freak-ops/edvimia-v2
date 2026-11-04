import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const ITEMS = [
  "School workspace", "Students", "Teachers & staff", "Attendance",
  "Results & grades", "Finance records", "Timetables", "Documents",
  "AI history", "Notifications", "Settings", "Uploaded files",
];

export function DeleteAccountCard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (confirm !== "DELETE") return toast.error("Please type DELETE to confirm.");
    if (!password) return toast.error("Enter your password.");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirmation: confirm, password },
      });
      if (error || (data as { error?: string } | null)?.error) {
        throw new Error((data as { error?: string } | null)?.error ?? error?.message ?? "Deletion failed");
      }
      await supabase.auth.signOut();
      toast.success("Your account has been permanently deleted.");
      navigate({ to: "/welcome" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deletion failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/40 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" /> Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete your Edvimia account and everything inside your school workspace. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" className="gap-2" onClick={() => setOpen(true)}>
          <Trash2 className="h-4 w-4" /> Delete Account
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => { if (!busy) { setOpen(v); if (!v) { setConfirm(""); setPassword(""); } } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete your account
            </DialogTitle>
            <DialogDescription>
              This will permanently and irreversibly remove:
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground/90">
              {ITEMS.map((i) => <li key={i}>• {i}</li>)}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Type <span className="font-mono font-semibold">DELETE</span> to confirm</Label>
              <Input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Enter your password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={onDelete} disabled={busy || confirm !== "DELETE" || !password} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Permanently delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}