import { useState } from 'react';
import { UilPlus, UilTrashAlt } from '@iconscout/react-unicons';
import ItemDialog from './ItemDialog';
import { formatQuantity } from '../units';

export default function ShoppingList({ lists, onToggle, onAddItem, onEditItem, onDeleteItem, onAddList, onDeleteList }) {
  const [drafts, setDrafts] = useState({});
  const [newTitle, setNewTitle] = useState('');
  const [dialog, setDialog] = useState(null); // { mode: 'add'|'edit', listId, item?, name? }

  const addList = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    onAddList(title);
    setNewTitle('');
  };

  const save = (values) =>
    dialog.mode === 'edit'
      ? onEditItem(dialog.listId, dialog.item.id, values)
      : onAddItem(dialog.listId, values);

  return (
    <div>
      {/* Створення списку: у макеті цього немає, але без нього в порожній базі нічого додати */}
      <form onSubmit={addList} className="shopping__new">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New list name" maxLength={255} />
        <button type="submit" className="b-btn-primary"><UilPlus size="14" /> Create list</button>
      </form>

      {!lists.length && <p className="b-empty">No shopping lists yet</p>}

      <div className="shopping">
        {lists.map((list) => {
          const bought = list.items.filter((i) => i.is_purchased).length;
          const openAdd = (e) => {
            e.preventDefault();
            setDialog({ mode: 'add', listId: list.id, name: (drafts[list.id] || '').trim() });
            setDrafts({ ...drafts, [list.id]: '' });
          };
          return (
            <section key={list.id} className="b-card shopping__list">
              <header>
                <h3>{list.title}</h3>
                <span className="shopping__meta">
                  <small>{bought} / {list.items.length}</small>
                  <button type="button" className="b-icon-btn shopping__delete-list" onClick={() => onDeleteList(list.id)} aria-label="Delete list">
                    <UilTrashAlt size="14" />
                  </button>
                </span>
              </header>
              <ul>
                {list.items.map((item) => (
                  <li key={item.id} className={item.is_purchased ? 'is-done' : ''}>
                    <label className="shopping__check">
                      <input type="checkbox" checked={item.is_purchased} onChange={() => onToggle(list.id, item.id)} aria-label={`Bought: ${item.name}`} />
                    </label>
                    <button type="button" className="shopping__item" onClick={() => setDialog({ mode: 'edit', listId: list.id, item })} aria-label={`Edit ${item.name}`}>
                      <span>{item.name}</span>
                      <small>{formatQuantity(item.quantity, item.unit)}</small>
                    </button>
                    <button type="button" className="b-icon-btn" onClick={() => onDeleteItem(list.id, item.id)} aria-label="Delete">
                      <UilTrashAlt size="14" />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={openAdd} className="shopping__add">
                <input
                  value={drafts[list.id] || ''}
                  onChange={(e) => setDrafts({ ...drafts, [list.id]: e.target.value })}
                  placeholder="New position"
                  maxLength={255}
                />
                <button type="submit" className="shopping__add-btn" aria-label="Add"><UilPlus size="16" /></button>
              </form>
            </section>
          );
        })}
      </div>

      {dialog && (
        <ItemDialog
          mode={dialog.mode}
          initial={dialog.mode === 'edit' ? dialog.item : { name: dialog.name }}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
