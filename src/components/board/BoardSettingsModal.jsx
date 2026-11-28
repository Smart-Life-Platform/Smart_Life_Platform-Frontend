import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';
import Dropdown from '../common/Dropdown';
import Toggle from '../settings/Toggle';

const STORAGE_PREFIX = 'avenor_board_settings_';

const VISIBILITY = [
  { value: 'private', label: 'Private — invited people only' },
  { value: 'public', label: 'Anyone with the link' },
];

function readSettings(boardId) {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${boardId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Board preferences. They are board-local UI preferences, so they live in
 * localStorage until the API exposes board settings.
 */
export default function BoardSettingsModal({ board, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    visibility: 'private',
    notifications: true,
    showCompleted: true,
    ...readSettings(board?.id),
  }));

  function save() {
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${board?.id}`, JSON.stringify(form));
    } catch {
      // Preferences are best-effort; closing is still useful.
    }
    onSaved?.(form);
    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="task-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>Board settings</h2>
            <p className="modal-subtitle">Preferences for this board</p>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <UilTimes size="20" />
          </button>
        </div>

        <div className="field">
          <span className="field-label">Visibility</span>
          <Dropdown
            value={form.visibility}
            options={VISIBILITY}
            onChange={(visibility) => setForm({ ...form, visibility })}
            ariaLabel="Visibility"
          />
        </div>

        <div className="board-setting-row">
          <span>Task notifications</span>
          <Toggle
            checked={form.notifications}
            onChange={(notifications) => setForm({ ...form, notifications })}
            label="Task notifications"
          />
        </div>
        <div className="board-setting-row">
          <span>Show completed tasks</span>
          <Toggle
            checked={form.showCompleted}
            onChange={(showCompleted) => setForm({ ...form, showCompleted })}
            label="Show completed tasks"
          />
        </div>

        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary-button" onClick={save}>Save</button>
        </div>
      </section>
    </div>
  );
}
