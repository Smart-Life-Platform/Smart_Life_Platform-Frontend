import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UilSetting, UilSignout, UilUser } from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import Avatar, { getDisplayName } from '../common/Avatar';
import '../../styles/settings.css';

/**
 * Account menu.
 *
 * `variant="sidebar"` is the profile card at the bottom of the left rail (the panel
 * opens upwards), `variant="header"` is the avatar in the top bar (the same panel,
 * opening downwards). Both render the same navigation so the account behaves the
 * same wherever it is opened from.
 */
export default function UserMenu({ showDetails = false, size = 38, variant = 'sidebar' }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const email = user?.email || '';
  const name = getDisplayName(user);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(path) {
    setOpen(false);
    navigate(path);
  }

  async function logout() {
    setOpen(false);
    await signOut();
    navigate('/login');
  }

  return (
    <div className={`user-menu user-menu--${variant}`} ref={menuRef}>
      <button
        type="button"
        className={`user-menu-button${showDetails ? ' user-menu-button-details' : ''}`}
        onClick={() => setOpen(!open)}
        title="Account"
        aria-label="User account"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar user={user} size={size} />
        {showDetails && <span className="user-menu-button-copy"><strong>{name}</strong><small>{user?.is_admin ? 'Administrator' : 'Personal plan'}</small></span>}
        {showDetails && <span className="user-menu-button-chevron">⌄</span>}
      </button>

      <div className={`user-menu-dropdown${open ? ' open' : ''}`} role="menu" aria-hidden={!open}>
        <div className="user-menu-header">
          <Avatar user={user} size={40} />
          <div className="user-menu-info">
            <div className="user-menu-name">{name}</div>
            <div className="user-menu-email">{email}</div>
          </div>
        </div>

        <button type="button" className="user-menu-item" role="menuitem" onClick={() => goTo('/profile')}>
          <UilUser size="18" /> My profile
        </button>

        <button type="button" className="user-menu-item" role="menuitem" onClick={() => goTo('/settings')}>
          <UilSetting size="18" /> Settings
        </button>

        <div className="user-menu-divider" />

        <button type="button" className="user-menu-item" role="menuitem" onClick={logout}>
          <UilSignout size="18" /> Log out
        </button>
      </div>
    </div>
  );
}
