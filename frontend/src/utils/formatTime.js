export default function formatTime(timeString) {
  if (!timeString) return "";
  if (timeString.includes("AM") || timeString.includes("PM")) return timeString;
  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) return timeString;
    const period = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${minutes} ${period}`;
  } catch {
    return timeString;
  }
}
