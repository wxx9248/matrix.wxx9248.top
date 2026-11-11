import { httpStatus, isRecord, requestJson } from "@/lib/matrix/http";
import type { Fetch } from "@/lib/matrix/types";

export type Versions =
  { online: true; spec: string | null } | { online: false };

export type Software = { name: string; version: string };

const specVersion = /^v(?<major>\d+)\.(?<minor>\d+)$/u;

type SpecVersion = { major: number; minor: number };

const parseSpecVersion = (entry: unknown): SpecVersion | null => {
  if (typeof entry !== "string") {
    return null;
  }
  const groups = specVersion.exec(entry)?.groups ?? null;
  if (groups === null) {
    return null;
  }
  const { major, minor } = groups;
  return { major: Number(major), minor: Number(minor) };
};

const isHigher = (candidate: SpecVersion, best: SpecVersion): boolean =>
  candidate.major > best.major ||
  (candidate.major === best.major && candidate.minor > best.minor);

// The highest vX.Y entry compared numerically; rX.Y.Z and junk are ignored
export const highestSpecVersion = (
  versions: readonly unknown[]
): string | null => {
  let best: SpecVersion | null = null;
  for (const entry of versions) {
    const parsed = parseSpecVersion(entry);
    if (parsed !== null && (best === null || isHigher(parsed, best))) {
      best = parsed;
    }
  }
  return best === null ? null : `v${best.major}.${best.minor}`;
};

export const getVersions = async (
  fetchFn: Fetch,
  baseUrl: string
): Promise<Versions> => {
  const result = await requestJson(
    fetchFn,
    `${baseUrl}/_matrix/client/versions`
  );
  if (
    result.kind === "failed" ||
    result.status !== httpStatus.ok ||
    !isRecord(result.body)
  ) {
    return { online: false };
  }
  const { versions } = result.body;
  if (!Array.isArray(versions)) {
    return { online: false };
  }
  return { online: true, spec: highestSpecVersion(versions) };
};

export const getSoftware = async (
  fetchFn: Fetch,
  baseUrl: string
): Promise<Software | null> => {
  const result = await requestJson(
    fetchFn,
    `${baseUrl}/_matrix/federation/v1/version`
  );
  if (
    result.kind === "failed" ||
    result.status !== httpStatus.ok ||
    !isRecord(result.body)
  ) {
    return null;
  }
  const { server } = result.body;
  if (!isRecord(server)) {
    return null;
  }
  const { name, version } = server;
  if (typeof name !== "string" || typeof version !== "string") {
    return null;
  }
  return { name, version };
};
