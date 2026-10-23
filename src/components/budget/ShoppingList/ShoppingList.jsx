import { useState } from 'react';
import { UilPlus, UilTrashAlt } from '@iconscout/react-unicons';

export default function ShoppingList({ lists, onToggle, onAddItem, onDeleteItem }) {
  const [drafts, setDrafts] = useState({});

  return (
    <div className="shopping">
      {lists.map((list) => {
        const bought = list.items.filter((i) => i.is_purchased).length;
        const add = (e) => {
          e.preventDefault();
          const name = (drafts[list.id] || '').trim();
          if (!name) return;
          onAddItem(list.id, name);
          setDrafts({ ...drafts, [list.id]: '' });
        };
        return (
          <section key={list.id} className="shopping__list">
            <header>
              <h3>{list.title}</h3>
              <small>{bought} / {list.items.length}</small>
            </header>
            <ul>
              {list.items.map((item) => (
                <li key={item.id} className={item.is_purchased ? 'is-done' : ''}>
                  <label>
                    <input type="checkbox" checked={item.is_purchased} onChange={() => onToggle(list.id, item.id)} />
                    <span>{item.name}</span>
                  </label>
                  <small>×{item.quantity}</small>
                  <button type="button" className="icon-btn" onClick={() => onDeleteItem(list.id, item.id)} aria-label="Видалити">
                    <UilTrashAlt size="16" />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={add} className="shopping__add">
              <input
                value={drafts[list.id] || ''}
                onChange={(e) => setDrafts({ ...drafts, [list.id]: e.target.value })}
                placeholder="Нова позиція"
              />
              <button type="submit" className="icon-btn" aria-label="Додати"><UilPlus size="20" /></button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
