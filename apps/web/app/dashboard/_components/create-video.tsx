"use client";

import { createVideo } from "@/server-actions/video";
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
import { Textarea } from "@/components/ui/textarea";

import { Loader2 } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC", "AUTHENTICATED"]),
  folderId: z.string(),
});

const CreateVideo = ({
  folders = [],
  folderId,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  folders?: {
    id: string;
    name: string;
    parentId?: string | null;
  }[];
  folderId?: string;
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
      title: "",
      description: "",
      visibility: "PRIVATE",
      folderId: folderId ?? "none",
    },
  });

  const selectedFolderId = useWatch({
    control,
    name: "folderId",
  });

  const selectedVisibility = useWatch({
    control,
    name: "visibility",
  });

  const submit = async (values: z.infer<typeof formSchema>) => {
    const response = await createVideo({
      title: values.title,
      description: values.description,
      visibility: values.visibility,
      folderId: values.folderId === "none" ? null : values.folderId,
    });

    if (response.success) {
      toast.success(response.message);
      reset({
        title: "",
        description: "",
        visibility: "PRIVATE",
        folderId: folderId ?? "none",
      });
      setOpen(false);
      return;
    }

    const message = response.message ?? "Something went wrong.";
    const lowered = message.toLowerCase();

    if (lowered.includes("title")) {
      setError("title", { message });
    } else if (lowered.includes("folder")) {
      setError("folderId", { message });
    } else {
      setError("root", { message });
    }

    toast.error(message);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (value) {
          reset({
            title: "",
            description: "",
            visibility: "PRIVATE",
            folderId: folderId ?? "none",
          });
        }
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            className="cursor-pointer"
            variant={folderId ? "secondary" : "default"}
          >
            {folderId ? "Add Video" : "+ Create Video"}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>Title</FieldLabel>

              <Input disabled={isSubmitting} {...register("title")} />

              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>

              <Textarea
                rows={3}
                disabled={isSubmitting}
                {...register("description")}
              />

              {errors.description && (
                <FieldError>{errors.description.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Visibility</FieldLabel>

              <Select
                value={selectedVisibility}
                disabled={isSubmitting}
                onValueChange={(v) =>
                  setValue(
                    "visibility",
                    v as "PRIVATE" | "PUBLIC" | "AUTHENTICATED",
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="w-(--radix-select-trigger-width)">
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="AUTHENTICATED">Signed-in users</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {!folderId && (
              <Field>
                <FieldLabel>Folder</FieldLabel>

                <Select
                  value={selectedFolderId}
                  disabled={isSubmitting}
                  onValueChange={(v) => setValue("folderId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="w-(--radix-select-trigger-width)">
                    <SelectItem value="none">No folder</SelectItem>

                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.folderId && (
                  <FieldError>{errors.folderId.message}</FieldError>
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

export { CreateVideo };
