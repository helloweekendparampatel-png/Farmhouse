'use client';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  description = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>{title}</h3>
        <p>{description}</p>

        <div className="dialog-actions">
          <button className="cancel" onClick={onCancel}>
            {cancelText}
          </button>

          <button
            className="confirm"
            type="button"
            onClick={() => void Promise.resolve(onConfirm())}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
