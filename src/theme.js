// Light is the default, whatever the system says. Dark is a charcoal grey,
// kept light enough that the pieces' shadows still show on the table.
export const THEMES = {
  light: {
    table: { center: '#f3f2ee', edge: '#e2e0da' },
    shadow: '#2b2418', // shadow colour under pieces
    dots: 'rgba(120, 112, 98, 0.32)', // the dotted assembly area
    browser: '#e2e0da', // phone address-bar colour
  },
  dark: {
    table: { center: '#38393d', edge: '#28292c' },
    shadow: '#0b0b0d',
    dots: 'rgba(214, 214, 220, 0.30)',
    browser: '#28292c',
  },
};

const KEY = 'jigglesaw-theme';

export function savedTheme() {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(name) {
  try {
    localStorage.setItem(KEY, name);
  } catch {
    // Private windows can refuse storage; the choice just won't be remembered.
  }
}
