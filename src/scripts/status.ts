import {
  type Row,
  type StatusView,
  type Strings,
  describeStatus,
  describeToken
} from "@/lib/matrix/present";
import { checkServer } from "@/lib/matrix/check";
import { checkToken } from "@/lib/matrix/token";
import { fill } from "@/i18n/fill";
import { matrixToUrl } from "@/lib/matrix/support";
import { readStrings } from "@/scripts/strings";
import { serverConfig } from "@/config/server";
import { showMessage } from "@/scripts/message";

const refreshCooldownMs = 10_000;

// An unbound fetch throws "Illegal invocation" in some browsers
const fetchFn: typeof fetch = globalThis.fetch.bind(globalThis);

const tones = ["ok", "bad", "muted"] as const;

// Every element the script fills in is rendered by StatusPanel; a missing one is a bug
function find<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`The page has no ${selector}`);
  }
  return element;
}

function writeRow(name: string, row: Row): void {
  const element = find<HTMLElement>(document, `[data-row="${name}"]`);
  const dot = element.querySelector<HTMLElement>("[data-dot]");
  if (dot !== null) {
    dot.dataset.dot = row.dot;
  }
  const label = find<HTMLElement>(element, "[data-label]");
  // Only a real version is code; "unknown" and "checking…" are plain text
  label.classList.toggle(
    "code",
    element.hasAttribute("data-versioned") && row.note !== ""
  );
  const link = find<HTMLAnchorElement>(element, "[data-link]");
  if (row.href === null) {
    label.textContent = row.label;
    label.hidden = false;
    link.hidden = true;
  } else {
    link.textContent = row.label;
    link.href = row.href;
    link.hidden = false;
    label.hidden = true;
  }
  const note = find<HTMLElement>(element, "[data-note]");
  note.textContent = row.note;
  note.hidden = row.note === "";
}

function writeContact(contact: StatusView["contact"]): void {
  const element = find<HTMLElement>(document, '[data-row="contact"]');
  element.hidden = contact === null;
  const matrix = find<HTMLAnchorElement>(element, "[data-matrix]");
  const email = find<HTMLAnchorElement>(element, "[data-email]");
  const separator = find<HTMLElement>(element, "[data-separator]");
  const matrixId = contact?.matrixId ?? null;
  const address = contact?.email ?? null;
  matrix.hidden = matrixId === null;
  if (matrixId !== null) {
    matrix.href = matrixToUrl(matrixId);
    matrix.textContent = matrixId;
  }
  email.hidden = address === null;
  if (address !== null) {
    email.href = `mailto:${address}`;
  }
  separator.hidden = matrixId === null || address === null;
  // Step 3 of the getting-started list names the same person
  const ask = document.querySelector<HTMLElement>("[data-ask-token]");
  const askLink = ask?.querySelector<HTMLAnchorElement>("[data-contact-link]");
  if (ask && askLink) {
    ask.hidden = matrixId === null;
    if (matrixId !== null) {
      askLink.href = matrixToUrl(matrixId);
      askLink.textContent = matrixId;
    }
  }
}

function writeBar(view: StatusView, strings: Strings): void {
  const bar = find<HTMLElement>(document, "[data-bar-state]");
  find<HTMLElement>(bar, "[data-dot]").dataset.dot =
    view.bar === "online" ? "ok" : "bad";
  find<HTMLElement>(bar, "[data-bar-text]").textContent =
    strings[view.bar === "online" ? "status.online" : "status.offline"];
  bar.hidden = false;
}

function writeView(view: StatusView, strings: Strings): void {
  writeRow("server", view.server);
  writeRow("registration", view.registration);
  writeRow("spec", view.spec);
  writeRow("signIn", view.signIn);
  writeRow("discovery", view.discovery);
  writeContact(view.contact);
  writeBar(view, strings);
  find<HTMLElement>(document, "[data-token-checker]").hidden =
    !view.tokenChecker;
  const time = new Intl.DateTimeFormat(document.documentElement.lang, {
    timeStyle: "short"
  }).format(new Date());
  find<HTMLElement>(document, "[data-checked]").textContent = fill(
    strings["status.checked"],
    { time }
  );
}

function bindTokenForm(strings: Strings, baseUrl: () => string): void {
  const form = find<HTMLFormElement>(document, "[data-token-checker]");
  const input = find<HTMLInputElement>(form, "input[name=token]");
  const submit = find<HTMLButtonElement>(form, "button[type=submit]");
  const result = find<HTMLElement>(form, "[data-token-result]");
  const show = (text: string, tone: (typeof tones)[number]): void => {
    result.textContent = text;
    result.classList.remove(...tones.map((name) => `tone-${name}`));
    result.classList.add(`tone-${tone}`);
  };
  // An answer says nothing about a token that was edited since
  let version = {};
  input.addEventListener("input", () => {
    version = {};
    result.textContent = "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) {
      return;
    }
    submit.disabled = true;
    try {
      show(strings["status.checking"], "muted");
      const versionBefore = version;
      const outcome = await checkToken(fetchFn, baseUrl(), input.value);
      if (outcome === null || version !== versionBefore) {
        result.textContent = "";
        return;
      }
      const { text, tone } = describeToken(outcome, strings);
      show(text, tone);
    } finally {
      submit.disabled = false;
    }
  });
}

export function initStatus(): void {
  const strings = readStrings();
  const refresh = find<HTMLButtonElement>(document, "[data-refresh]");
  let baseUrl: string = serverConfig.fallbackBaseUrl;
  let checking = false;
  let cooling = false;

  const update = (): void => {
    refresh.disabled = checking || cooling;
  };

  // Never rejects; the result says whether the check was shown
  const run = async (): Promise<boolean> => {
    checking = true;
    update();
    try {
      const status = await checkServer(fetchFn, serverConfig);
      ({ baseUrl } = status.discovery);
      writeView(
        describeStatus(status, strings, serverConfig.serverName),
        strings
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      checking = false;
      update();
    }
  };

  bindTokenForm(strings, () => baseUrl);

  refresh.addEventListener("click", async () => {
    if (checking || cooling) {
      return;
    }
    cooling = true;
    if (await run()) {
      showMessage(strings["message.refreshed"]);
    }
    // The cooldown is counted from the end of the check, however it ended
    setTimeout(() => {
      cooling = false;
      update();
    }, refreshCooldownMs);
  });

  run();
}
