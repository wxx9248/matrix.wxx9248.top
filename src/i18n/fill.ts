const placeholderPattern = /\{(?<name>\w+)\}/gu;

export type Params = Readonly<Record<string, string | number>>;

export function fill(template: string, params: Params = {}): string {
  return template.replace(
    placeholderPattern,
    (_match: string, name: string) => {
      if (!Object.hasOwn(params, name)) {
        throw new Error(`UI string "${template}" needs a "${name}" param`);
      }
      return String(params[name]);
    }
  );
}
