import { useState } from 'react';

const COLORS = ['#e8710a', '#1a73e8', '#188038', '#d93025', '#9334e6', '#007b83', '#c2185b', '#5f6368'];

function colorFor(text) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function getDisplayName(user) {
  const meta = user?.user_metadata || {};
  const email = user?.email || '';
  return meta.full_name || meta.name || email.split('@')[0] || 'User';
}

export default function Avatar({ user, size = 38 }) {
  const [broken, setBroken] = useState(false);
  const meta = user?.user_metadata || {};
  const photo = meta.avatar_url || meta.picture;
  const name = getDisplayName(user);
  const letters = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  if (photo && !broken) {
    return (
      <img
        className="avatar-circle"
        src={photo}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="avatar-circle"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}
    >
      {letters}
    </span>
  );
}