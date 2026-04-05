// Estilos Duoc UC compartidos para React-Select
export const duocSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? '#6c757d' : '#ced4da',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(108,117,125,0.25)' : 'none',
    borderRadius: '0.375rem',
    fontSize: '0.9rem',
    minHeight: '38px',
    '&:hover': { borderColor: '#6c757d' },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#1a1a1a'
      : state.isFocused
        ? '#f0f0f0'
        : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#2d2d2d',
    fontSize: '0.9rem',
    padding: '6px 12px',
    cursor: 'pointer',
    ':active': { backgroundColor: '#d6d8db', color: '#1a1a1a' },
  }),
  singleValue: (base) => ({ ...base, color: '#2d2d2d' }),
  placeholder: (base) => ({ ...base, color: '#6c757d' }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({
    ...base,
    color: '#6c757d',
    padding: '0 8px',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: '#6c757d',
    '&:hover': { color: '#1a1a1a' },
  }),
};

export const duocSelectStylesDisabled = {
  ...duocSelectStyles,
  control: (base) => ({
    ...duocSelectStyles.control(base, {}),
    backgroundColor: '#e9ecef',
    borderColor: '#ced4da',
    cursor: 'not-allowed',
    opacity: 0.7,
  }),
};
