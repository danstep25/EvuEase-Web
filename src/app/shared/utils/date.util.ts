export class DateUtil {
  static formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  }

  static formatTimestamp(timestamp: string | null | undefined): string {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      const displaySeconds = seconds.toString().padStart(2, '0');
      
      return `${month}/${day}/${year}, ${displayHours}:${displayMinutes}:${displaySeconds} ${ampm}`;
    } catch {
      return timestamp;
    }
  }
}

