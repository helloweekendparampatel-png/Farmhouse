import { parseMoneyAmount } from './farm-validation';

export function formatCurrency(raw?: string | null): string {
  if (!raw || !raw.toString().trim()) return '—';
  const s = String(raw).trim();

  // Check if it's a range
  const hasHyphen = s.includes('-');
  const hasTo = /\s+to\s+/i.test(s);
  if (hasHyphen || hasTo) {
    const parts = hasHyphen ? s.split('-') : s.split(/\s+to\s+/i);
    if (parts.length === 2) {
      const p1 = formatCurrency(parts[0]);
      const p2 = formatCurrency(parts[1]);
      if (p1 !== '—' && p2 !== '—') {
        return `${p1} - ${p2}`;
      }
    }
  }

  const n = parseMoneyAmount(s);
  if (n === null) {
    // Fallback: strip common currency symbols and show raw trimmed with ₹
    const cleaned = s
      .replace(/^[\s$€£₹]+/u, '')
      .replace(/,/g, '')
      .trim();
    return cleaned ? `₹${cleaned}` : '—';
  }
  try {
    // Use en-IN grouping for thousands formatting
    return `₹${n.toLocaleString('en-IN')}`;
  } catch (e) {
    return `₹${n}`;
  }
}

/** Render capacity as "Up to X people" when it contains a number. */
export function formatCapacity(raw?: string | null): string {
  if (!raw || !String(raw).trim()) return '—';
  const s = String(raw).trim();
  const m = s.match(/(\d+)/);
  if (m) return `Up to ${m[1]} people`;
  return s;
}
