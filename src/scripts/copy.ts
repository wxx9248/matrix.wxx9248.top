import { fill } from "@/i18n/fill";
import { readStrings } from "@/scripts/strings";
import { showMessage } from "@/scripts/message";

// Copies the button's data-copy value and says in the status bar how it went
export function bindCopyButtons(): void {
  const strings = readStrings();
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "button[data-copy]"
  )) {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy ?? "";
      try {
        await navigator.clipboard.writeText(text);
        showMessage(fill(strings["message.copied"], { text }));
      } catch {
        // No clipboard (an insecure page) or the browser refused
        showMessage(strings["message.copyFailed"]);
      }
    });
  }
}
