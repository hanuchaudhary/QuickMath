import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  eyebrow?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dismissible?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onCancel?: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  eyebrow = "CONFIRM",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  dismissible = true,
  onConfirm,
  onClose,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  const cancel = onCancel ?? onClose;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center px-4">
      {dismissible ? (
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/65"
          onClick={onClose}
        />
      ) : (
        <div className="absolute inset-0 bg-black/75" />
      )}
      <div className="relative w-full max-w-md rounded-3xl bg-secondary p-6">
        <p className="text-sm font-medium text-red-400">{eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tighter">
          {title}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-2xl bg-white/8 px-5 py-2 text-sm"
            onClick={cancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-2xl bg-red-400 px-5 py-2 text-sm font-bold text-black",
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
