interface Props {
  formId: string;
  saving: boolean;
  deleting: boolean;
  saveDisabled: boolean;
  deleteDisabled: boolean;
  canDelete: boolean;
  onDelete: () => void;
  error?: string;
}

export default function PathSettingsActions({ formId, saving, deleting, saveDisabled, deleteDisabled, canDelete, onDelete, error }: Props) {
  return <div className="settings-actions" role="group" aria-label="Path settings actions">
    <span>Path settings</span>
    <div className="action-buttons">
      <button className="button-primary" type="submit" form={formId} disabled={saveDisabled}>{saving ? 'Saving…' : 'Save changes'}</button>
      {canDelete && <button className="button-secondary delete-action" type="button" disabled={deleteDisabled} onClick={onDelete}>{deleting ? 'Deleting…' : 'Delete path'}</button>}
    </div>
    {error && <p className="action-error" role="alert">{error}</p>}
    <style jsx>{`
      .settings-actions { position:sticky;top:7.5rem;z-index:40;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md); }
      .settings-actions>span { font-size:.9rem;font-weight:600;color:var(--text-secondary); }
      .action-buttons { display:flex;align-items:center;gap:.65rem;flex-wrap:wrap; }
      .action-error { flex-basis:100%;margin:0;color:var(--accent-danger);font-size:.9rem; }
      .delete-action { color:var(--accent-danger);border-color:var(--accent-danger); }
      @media(max-width:600px) { .settings-actions { top:8rem;gap:.5rem;padding:.7rem; }.settings-actions>span { display:none; }.action-buttons { width:100%; }.action-buttons button { flex:1; } }
    `}</style>
  </div>;
}
