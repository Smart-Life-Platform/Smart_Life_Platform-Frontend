import { useState } from 'react';
import { UilPlus, UilTrashAlt } from '@iconscout/react-unicons';

export default function ShoppingList({ lists, onToggle, onAddItem, onDeleteItem, onAddList, onDeleteList }) {
  const [drafts, setDrafts] = useState({});
  const [qtys, setQtys] = useState({});
  const [newTitle, setNewTitle] = useState('');

  const addList = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    onAddList(title);
    setNewTitle('');
  };

  return (
    <div>
      <form onSubmit={addList} className="shopping__new">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New list name" maxLength={255} />
        <button type="submit" className="b-btn-primary"><UilPlus size="14" /> Create list</button>
      </form>

      {!lists.length && <p className="b-empty">No shopping lists yet</p>}

      <div className="shopping">
        {lists.map((list) => {
          const bought = list.items.filter((i) => i.is_purchased).length;
          const add = (e) => {
            e.preventDefault();
            const name = (drafts[list.id] || '').trim();
            if (!name) return;
            const qty = Math.min(999, Math.max(1, parseInt(qtys[list.id], 10) || 1));
            onAddItem(list.id, name, qty);
            setDrafts({ ...drafts, [list.id]: '' });
            setQtys({ ...qtys, [list.id]: '' });
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
                    <label>
                      <input type="checkbox" checked={item.is_purchased} onChange={() => onToggle(list.id, item.id)} />
                      <span>{item.name}</span>
                      <small>×{item.quantity}</small>
                    </label>
                    <button type="button" className="b-icon-btn" onClick={() => onDeleteItem(list.id, item.id)} aria-label="Delete">
                      <UilTrashAlt size="14" />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={add} className="shopping__add">
                <input
                  value={drafts[list.id] || ''}
                  onChange={(e) => setDrafts({ ...drafts, [list.id]: e.target.value })}
                  placeholder="New position"
                  maxLength={255}
                />
                <input
                  className="shopping__qty-input"
                  type="number"
                  min="1"
                  max="999"
                  value={qtys[list.id] || ''}
                  onChange={(e) => setQtys({ ...qtys, [list.id]: e.target.value })}
                  placeholder="Qty"
                  aria-label="Quantity"
                />
                <button type="submit" className="shopping__add-btn" aria-label="Add"><UilPlus size="16" /></button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
