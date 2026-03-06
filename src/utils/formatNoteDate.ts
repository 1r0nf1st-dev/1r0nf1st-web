/**
 * Formats a note date as relative time ("2 hours ago") or absolute date.
 * Uses relative time for recent notes (< 7 days), absolute date for older notes.
 */
export function formatNoteDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) {
    const days = Math.floor(diffDays);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
