"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UploadRppCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group block w-full text-left">
        <Card className="h-full p-6 transition hover:border-brand-300 hover:shadow-theme-md dark:hover:border-brand-800">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <FileUp className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Upload RPP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload file RPP PDF yang sudah dibuat sebelumnya.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
            Upload PDF <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Card>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Format RPP</DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed text-foreground">
              Pastikan Format RPP sudah sesuai dengan yang ditetapkan Waka Kurikulum
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Belum
            </Button>
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/guru/rpp/baru/upload?confirmed=1");
              }}
            >
              Ya sudah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
