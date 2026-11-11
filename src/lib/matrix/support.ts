import { httpStatus, isRecord, requestJson } from "@/lib/matrix/http";
import type { Fetch } from "@/lib/matrix/types";
import type { ServerConfig } from "@/config/server";

export type Contact = { matrixId: string | null; email: string | null };

const adminRole = "m.role.admin";

const text = (value: unknown): string | null =>
  typeof value === "string" && value !== "" ? value : null;

const toContact = (entry: unknown): Contact | null => {
  if (!isRecord(entry) || entry.role !== adminRole) {
    return null;
  }
  const matrixId = text(entry.matrix_id);
  const email = text(entry.email_address);
  return matrixId === null && email === null ? null : { email, matrixId };
};

// The first admin contact that has an address, or null
export const getContact = async (
  fetchFn: Fetch,
  config: ServerConfig
): Promise<Contact | null> => {
  const result = await requestJson(
    fetchFn,
    `https://${config.serverName}/.well-known/matrix/support`
  );
  if (
    result.kind === "failed" ||
    result.status !== httpStatus.ok ||
    !isRecord(result.body) ||
    !Array.isArray(result.body.contacts)
  ) {
    return null;
  }
  for (const entry of result.body.contacts) {
    const contact = toContact(entry);
    if (contact !== null) {
      return contact;
    }
  }
  return null;
};

export const matrixToUrl = (matrixId: string): string =>
  `https://matrix.to/#/${matrixId}`;
