export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  isDestructive = true,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={
              isDestructive
                ? "inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                : "btn-primary"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
