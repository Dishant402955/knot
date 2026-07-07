"use client";

import { deleteFolder } from "@/server-actions/folder";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DeleteFolder = ({
  id,
  redirectTo,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  id: string;
  redirectTo?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) => {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  const remove = async () => {
    const res = await deleteFolder({ id });

    if (res.success) {
      toast.success(res.message);

      if (redirectTo) {
        router.push(redirectTo);
      }

      return;
    }

    toast.error(res.message);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="cursor-pointer">
            Delete
          </Button>
        </AlertDialogTrigger>
      )}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this folder?</AlertDialogTitle>

          <AlertDialogDescription>
            This will permanently delete the folder and all its subfolders. Any
            videos inside will be moved out, not deleted. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            onClick={remove}
            className="cursor-pointer"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { DeleteFolder };
