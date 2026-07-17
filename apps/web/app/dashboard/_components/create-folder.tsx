"use client";

import { createFolder } from "@/server-actions/folder";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Loader2 } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Folder name required"),
  parentId: z.string(),
});

const CreateFolder = ({
  folders = [],
  parentId,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  folders?: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
  parentId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      parentId: parentId ?? "root",
    },
  });

  const selectedParentId = useWatch({
    control,
    name: "parentId",
  });

  const submit = async (values: z.infer<typeof formSchema>) => {
    const response = await createFolder({
      name: values.name,
      parentId: values.parentId === "root" ? undefined : values.parentId,
    });

    if (response.success) {
      toast.success(response.message);
      reset();
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
            name: "",
            parentId: parentId ?? "root",
          });
        }
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            className="cursor-pointer"
            variant={parentId ? "secondary" : "default"}
            data-knot="create-folder"
          >
            {parentId ? "Create Subfolder" : "+ Create Folder"}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>

              <Input disabled={isSubmitting} {...register("name")} />

              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            {!parentId && (
              <Field>
                <FieldLabel>Parent</FieldLabel>

                <Select
                  value={selectedParentId}
                  disabled={isSubmitting}
                  onValueChange={(v) => setValue("parentId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="w-(--radix-select-trigger-width)">
                    <SelectItem value="root">Root Folder</SelectItem>

                    {folders.map((folder) => (
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
            )}

            {errors.root && <FieldError>{errors.root.message}</FieldError>}

            <Button disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { CreateFolder };
