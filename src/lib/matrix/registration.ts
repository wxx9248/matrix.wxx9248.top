import { httpStatus, isRecord, requestJson } from "@/lib/matrix/http";
import type { Fetch } from "@/lib/matrix/types";

type Requirement = "email" | "phone" | "captcha" | "terms";

export type Registration = {
  state: "open" | "invite" | "closed" | "unknown";
  requirements: Requirement[];
};

const tokenStage = "m.login.registration_token";

// Listed in the order they are shown
const requirementStages: readonly (readonly [string, Requirement])[] = [
  ["m.login.email.identity", "email"],
  ["m.login.msisdn", "phone"],
  ["m.login.recaptcha", "captcha"],
  ["m.login.terms", "terms"]
];

const noFlows = 0;

const unknown: Registration = { requirements: [], state: "unknown" };

const stagesOf = (flow: unknown): string[] | null => {
  if (!isRecord(flow) || !Array.isArray(flow.stages)) {
    return null;
  }
  return flow.stages.filter((stage) => typeof stage === "string");
};

// Reads the flows of a 401 answer to a register request without auth
export const registrationFromFlows = (flows: unknown): Registration => {
  if (!Array.isArray(flows)) {
    return unknown;
  }
  const allStages: string[][] = [];
  for (const flow of flows) {
    const stages = stagesOf(flow);
    if (stages !== null) {
      allStages.push(stages);
    }
  }
  if (allStages.length === noFlows) {
    return unknown;
  }
  const needsToken = allStages.every((stages) => stages.includes(tokenStage));
  const requirements = requirementStages
    .filter(([stage]) => allStages.some((stages) => stages.includes(stage)))
    .map(([, requirement]) => requirement);
  return { requirements, state: needsToken ? "invite" : "open" };
};

// The spec's way to discover flows: register with an empty body and no auth
export const probeRegistration = async (
  fetchFn: Fetch,
  baseUrl: string
): Promise<Registration> => {
  const result = await requestJson(
    fetchFn,
    `${baseUrl}/_matrix/client/v3/register`,
    {
      body: "{}",
      headers: { "content-type": "application/json" },
      method: "POST"
    }
  );
  if (result.kind === "failed") {
    return unknown;
  }
  if (result.status === httpStatus.forbidden) {
    return { requirements: [], state: "closed" };
  }
  if (result.status === httpStatus.unauthorized && isRecord(result.body)) {
    return registrationFromFlows(result.body.flows);
  }
  return unknown;
};
