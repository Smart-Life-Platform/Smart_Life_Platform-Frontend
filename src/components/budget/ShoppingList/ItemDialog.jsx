import { useState } from 'react';
import Modal from '../ui/Modal';
import Dropdown from '../ui/Dropdown';
import { UNITS, DEFAULT_UNIT } from '../units';

export default function ItemDialog({ mode, initial, onSave, onClose }) {
  const [name, setName] = useState(initial.name || '');
  const [quantity, setQuantity] = useState(initial.quantity ?? '');
  const [unit, setUnit] = useState(initial.unit || DEFAULT_UNIT);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!name.trim()) return setError('Enter a product name');
    if (!(qty > 0)) return setError('Quantity must be greater than 0');
    setError('');
    setSaving(true);
    const ok = await onSave({ name: name.trim(), quantity: Math.round(qty * 100) / 100, unit });
    setSaving(false);
    if (ok !== false) onClose();
  };

  return (
    <Modal title={mode === 'edit' ? 'Edit item' : 'Add item'} onClose={onClose}>
      <form onSubmit={submit} className="b-dialog__form" noValidate>
        <label>Product name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoFocus />
        </label>
        <div className="b-dialog__row">
          <label>Quantity
            <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </label>
          <div className="b-dialog__field">
            <span>Unit</span>
            <Dropdown variant="field" ariaLabel="Unit" value={unit} options={UNITS.map((u) => ({ value: u, label: u }))} onChange={setUnit} />
          </div>
        </div>
        {error && <p className="b-error">{error}</p>}
        <div className="b-dialog__actions">
          <button type="button" className="b-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="b-btn-primary" disabled={saving}>{mode === 'edit' ? 'Save changes' : 'Add item'}</button>
        </div>
      </form>
    </Modal>
  );
}
