import { ThreeDButton } from "./ui/3d-button";

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
        <p className="subheading text-xs! font-semibold! text-red-400!">{eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tighter">
          {title}
        </h2>
        <p className="mt-3 subheading text-sm! font-semibold!">{body}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <ThreeDButton variant="secondary" type="button" className="py-2" onClick={cancel}>
            {cancelLabel}
          </ThreeDButton>
          <ThreeDButton variant="primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </ThreeDButton>
        </div>
      </div>
    </div>
  );
}
