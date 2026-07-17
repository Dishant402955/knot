"use client";

import { editFolder } from "@/server-actions/folder";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";

import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Folder name required"),
  parentId: z.string(),
});

const EditFolder = ({
  id,
  name,
  parentId,
  folders = [],
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  id: string;
  name: string;
  parentId?: string | null;
  folders?: {
    id: string;
    name: string;
    parentId: string | null;
  }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  const getDescendantIds = (folderId: string): string[] => {
    const children = folders.filter((folder) => folder.parentId === folderId);

    return children.flatMap((child) => [
      child.id,
      ...getDescendantIds(child.id),
    ]);
  };

  const invalidParentIds = new Set([id, ...getDescendantIds(id)]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
      parentId: parentId ?? "root",
    },
  });

  const selectedParentId = useWatch({
    control,
    name: "parentId",
  });

  const submit = async (values: z.infer<typeof formSchema>) => {
    const response = await editFolder({
      id,
      folderName: values.name,
      parentId: values.parentId === "root" ? null : values.parentId,
    });

    if (response.success) {
      toast.success(response.message);
      setOpen(false);
      return;
    }

    const message = response.message ?? "Something went wrong.";
    const lowered = message.toLowerCase();

    if (lowered.includes("name")) {
      setError("name", { message });
    } else if (lowered.includes("parent") || lowered.includes("subfolder")) {
      setError("parentId", { message });
    } else {
      setError("root", { message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (value) {
          reset({
            name,
            parentId: parentId ?? "root",
          });
        }
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="secondary" className="cursor-pointer">
            Edit
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>Folder Name</FieldLabel>

              <Input disabled={isSubmitting} {...register("name")} />

              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Move Folder</FieldLabel>

              <Select
                value={selectedParentId}
                disabled={isSubmitting}
                onValueChange={(value) => setValue("parentId", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="w-(--radix-select-trigger-width)">
                  <SelectItem value="root">Root Folder</SelectItem>

                  {folders
                    .filter((folder) => !invalidParentIds.has(folder.id))
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {errors.parentId && (
                <FieldError>{errors.parentId.message}</FieldError>
              )}
            </Field>

            {errors.root && <FieldError>{errors.root.message}</FieldError>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { EditFolder };
