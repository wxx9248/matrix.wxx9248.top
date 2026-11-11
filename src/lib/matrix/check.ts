import { type Auth, getAuth } from "@/lib/matrix/auth";
import { type Contact, getContact } from "@/lib/matrix/support";
import { type Discovery, discover } from "@/lib/matrix/discovery";
import {
  type Registration,
  probeRegistration
} from "@/lib/matrix/registration";
import {
  type Software,
  type Versions,
  getSoftware,
  getVersions
} from "@/lib/matrix/versions";
import type { Fetch } from "@/lib/matrix/types";
import type { ServerConfig } from "@/config/server";

export type ServerStatus = {
  discovery: Discovery;
  versions: Versions;
  software: Software | null;
  auth: Auth | null;
  registration: Registration;
  contact: Contact | null;
};

const unknownRegistration: Registration = {
  requirements: [],
  state: "unknown"
};

// With OAuth there is nothing to probe: the metadata says whether sign-up exists
const registrationFor = (
  fetchFn: Fetch,
  baseUrl: string,
  auth: Auth
): Promise<Registration> => {
  if (auth.api === "oauth") {
    return Promise.resolve({
      requirements: [],
      state: auth.canRegister ? "open" : "closed"
    });
  }
  return probeRegistration(fetchFn, baseUrl);
};

// Runs the checks in the spec's order; never throws, since each step handles its own failures
export const checkServer = async (
  fetchFn: Fetch,
  config: ServerConfig
): Promise<ServerStatus> => {
  const contactPending = getContact(fetchFn, config);
  const discovery = await discover(fetchFn, config);
  const versions = await getVersions(fetchFn, discovery.baseUrl);
  const contact = await contactPending;
  if (!versions.online) {
    return {
      auth: null,
      contact,
      discovery,
      registration: unknownRegistration,
      software: null,
      versions
    };
  }
  const [software, auth] = await Promise.all([
    getSoftware(fetchFn, discovery.baseUrl),
    getAuth(fetchFn, discovery.baseUrl)
  ]);
  const registration = await registrationFor(fetchFn, discovery.baseUrl, auth);
  return { auth, contact, discovery, registration, software, versions };
};
