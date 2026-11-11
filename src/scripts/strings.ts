import type { Strings } from "@/lib/matrix/present";

// The layout puts the page's dictionary in the page, so no dictionary ships in the script
export function readStrings(): Strings {
  const json = document.getElementById("ui-strings")?.textContent;
  if (typeof json !== "string") {
    throw new Error("The page has no #ui-strings data");
  }
  return JSON.parse(json) as Strings;
}
