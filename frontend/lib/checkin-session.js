const SELECTED_EVENT_KEY = "smencore_checkin_event";

export function saveSelectedCheckinEvent(event) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    SELECTED_EVENT_KEY,
    JSON.stringify(event)
  );
}

export function clearSelectedCheckinEvent() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(SELECTED_EVENT_KEY);
}

export function getSelectedCheckinEvent() {
  if (typeof window === "undefined") return null;

  const storedEvent = window.sessionStorage.getItem(SELECTED_EVENT_KEY);

  if (!storedEvent) return null;

  try {
    const event = JSON.parse(storedEvent);

    return event && event.id != null && event.title
      ? event
      : null;
  } catch {
    window.sessionStorage.removeItem(SELECTED_EVENT_KEY);
    return null;
  }
}
