import federationVersionJson from "./federation-version.json" with { type: "json" };
import loginJson from "./login.json" with { type: "json" };
import register401Json from "./register-401.json" with { type: "json" };
import versionsJson from "./versions.json" with { type: "json" };
import wellKnownClientJson from "./well-known-client.json" with { type: "json" };
import wellKnownSupportJson from "./well-known-support.json" with { type: "json" };

export const federationVersion: unknown = federationVersionJson;
export const login: unknown = loginJson;
export const register401: unknown = register401Json;
export const versions: unknown = versionsJson;
export const wellKnownClient: unknown = wellKnownClientJson;
export const wellKnownSupport: unknown = wellKnownSupportJson;
