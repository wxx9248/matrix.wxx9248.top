import { httpStatus, isRecord, requestJson } from "@/lib/matrix/http";
import type { Fetch } from "@/lib/matrix/types";

export type SignInMethod =
  { kind: "password" } | { kind: "sso"; providers: string[] };

export type Auth =
  | { api: "oauth"; accountUrl: string | null; canRegister: boolean }
  | { api: "legacy"; signIn: SignInMethod[] | null };

const passwordFlow = "m.login.password";
const ssoFlow = "m.login.sso";
const createPrompt = "create";

const providerNames = (flow: Record<string, unknown>): string[] => {
  const { identity_providers: providers } = flow;
  if (!Array.isArray(providers)) {
    return [];
  }
  const names: string[] = [];
  for (const provider of providers) {
    if (isRecord(provider) && typeof provider.name === "string") {
      names.push(provider.name);
    }
  }
  return names;
};

// Only the flows a person picks from; token and appservice flows are left out
const toSignIn = (flows: readonly unknown[]): SignInMethod[] => {
  const methods: SignInMethod[] = [];
  for (const flow of flows) {
    if (isRecord(flow) && flow.type === passwordFlow) {
      methods.push({ kind: "password" });
    } else if (isRecord(flow) && flow.type === ssoFlow) {
      methods.push({ kind: "sso", providers: providerNames(flow) });
    }
  }
  return methods;
};

const getSignIn = async (
  fetchFn: Fetch,
  baseUrl: string
): Promise<SignInMethod[] | null> => {
  const result = await requestJson(
    fetchFn,
    `${baseUrl}/_matrix/client/v3/login`
  );
  if (
    result.kind === "failed" ||
    result.status !== httpStatus.ok ||
    !isRecord(result.body)
  ) {
    return null;
  }
  const { flows } = result.body;
  return Array.isArray(flows) ? toSignIn(flows) : null;
};

const fromMetadata = (body: unknown): Auth => {
  const metadata = isRecord(body) ? body : {};
  const {
    account_management_uri: accountUrl,
    prompt_values_supported: prompts
  } = metadata;
  return {
    accountUrl: typeof accountUrl === "string" ? accountUrl : null,
    api: "oauth",
    canRegister: Array.isArray(prompts) && prompts.includes(createPrompt)
  };
};

export const getAuth = async (
  fetchFn: Fetch,
  baseUrl: string
): Promise<Auth> => {
  const metadata = await requestJson(
    fetchFn,
    `${baseUrl}/_matrix/client/v1/auth_metadata`
  );
  if (metadata.kind === "response" && metadata.status === httpStatus.ok) {
    return fromMetadata(metadata.body);
  }
  return { api: "legacy", signIn: await getSignIn(fetchFn, baseUrl) };
};
