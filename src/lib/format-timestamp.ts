
const pad = (n: number) => n.toString().padStart(2, "0");

export function formatMessageTimestamp(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const time = `${hours}:${minutes}`;

  if (diffDays === 0) {
    return time;
  } else if (diffDays === 1) {
    return `Ontem às ${time}`;
  } else if (diffDays === 2) {
    return `Anteontem às ${time}`;
  } else {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${time} ${day}/${month}/${year}`;
  }
}
