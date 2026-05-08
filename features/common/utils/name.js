export function formatDisplayName(input) {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return '';

  // Convert to lower then title-case each word (supports Turkish casing via locale).
  const lower = raw.toLocaleLowerCase('tr-TR');
  return lower
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

export function getInitial(input) {
  const name = formatDisplayName(input);
  return name ? name.charAt(0) : '';
}

