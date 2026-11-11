const messageDurationMs = 4000;

let clearTimer: ReturnType<typeof setTimeout> | null = null;

// Shows a line in the status bar, replacing any current one, and clears it after a few seconds
export function showMessage(text: string): void {
  const element = document.querySelector("[data-message]");
  if (element === null) {
    return;
  }
  if (clearTimer !== null) {
    clearTimeout(clearTimer);
  }
  element.textContent = text;
  clearTimer = setTimeout(() => {
    element.textContent = "";
    clearTimer = null;
  }, messageDurationMs);
}
