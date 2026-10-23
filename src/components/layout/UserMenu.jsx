import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UilSetting, UilSignout } from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import Avatar, { getDisplayName } from '../common/Avatar';
import '../../styles/settings.css';

export default function UserMenu() {
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

  function goToSettings() {
    setOpen(false);
    navigate('/settings');
  }

  async function logout() {
    setOpen(false);
    await signOut();
    navigate('/login');
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu-button" onClick={() => setOpen(!open)} title="Account">
        <Avatar user={user} size={38} />
      </button>

      <div className={`user-menu-dropdown${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="user-menu-header">
          <Avatar user={user} size={40} />
          <div className="user-menu-info">
            <div className="user-menu-name">{name}</div>
            <div className="user-menu-email">{email}</div>
          </div>
        </div>

        <button className="user-menu-item" onClick={goToSettings}>
          <UilSetting size="18" /> Settings
        </button>

        <div className="user-menu-divider" />

        <button className="user-menu-item" onClick={logout}>
          <UilSignout size="18" /> Log out
        </button>
      </div>
    </div>
  );
}