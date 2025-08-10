export interface AlertState {
  type: 'success' | 'error' | 'warning' | 'info' | undefined;
  text: string;
  show: boolean;
}

export type ServerStatus = 'operational' | 'offline' | 'error' | undefined;
export type RegistrationStatus = 'open' | 'invitation' | 'closed' | 'error' | undefined;

export interface ServerState {
  state: ServerStatus;
  latestClientVersionSupported: string;
  registration: RegistrationStatus;
}

export interface ServerConfig {
  serverName: string;
  serverEntryPoint: string;
}
