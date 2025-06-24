import React from 'react';

// Función para generar un color único basado en el nombre
const stringToColor = (str) => {
  let hash = 0;
  if (!str || str.length === 0) return '#ccc';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
};

// Función para obtener las iniciales del nombre
const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  const initials = names
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return initials || '?';
};

const Avatar = ({ name, size = 60 }) => {
  const avatarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: stringToColor(name),
    color: 'white',
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size / 2.5}px`,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
    flexShrink: 0,
  };

  return <div style={avatarStyle}>{getInitials(name)}</div>;
};

export default Avatar;
