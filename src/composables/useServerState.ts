import { reactive } from 'vue';
import type { ServerState, ServerStatus, RegistrationStatus } from '@/types';

export function useServerState() {
  const serverState = reactive<ServerState>({
    state: undefined,
    latestClientVersionSupported: "",
    registration: undefined
  });

  const getServerState = async (): Promise<void> => {
    serverState.state = undefined;
    serverState.latestClientVersionSupported = "";
    serverState.registration = undefined;

    try {
      // Get if operational
      const response = await fetch("/_matrix/client/versions");

      switch (response.status) {
        case 200:
          serverState.state = "operational";
          const json = await response.json();
          // Get latest supported client version
          serverState.latestClientVersionSupported =
            json["versions"][json["versions"].length - 1];
          break;
        case 502:
          serverState.state = "offline";
          break;
        default:
          serverState.state = "error";
          break;
      }
    } catch (error) {
      serverState.state = "error";
      console.error(error);
    }

    try {
      // Get if registrable
      const response = await fetch("/_matrix/client/r0/register", {
        method: "POST",
        body: JSON.stringify({ initial_device_display_name: "dummy" })
      });

      switch (response.status) {
        case 200:
          serverState.registration = "open";
          break;
        case 401:
          const json = await response.json();
          if (
            json["flows"].some((flow: any) =>
              flow["stages"].includes("m.login.registration_token")
            )
          ) {
            serverState.registration = "invitation";
          } else {
            serverState.registration = "open";
          }
          break;
        case 403:
          serverState.registration = "closed";
          break;
        case 429:
          break;
        case 400:
        default:
          serverState.registration = "error";
      }
    } catch (error) {
      serverState.registration = "error";
      console.error(error);
    }
  };

  return {
    serverState,
    getServerState
  };
}
