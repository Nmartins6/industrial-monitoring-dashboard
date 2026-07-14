import type {
  MachineStatusTransport,
  MetricHistoryTransport,
} from '@industrial-monitoring/contracts';

type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

interface CreateMachineApiClientOptions {
  baseUrl: string;
  fetch: Fetch;
}

interface MachineApiClient {
  getMachineStatus(machineId: string): Promise<MachineStatusTransport>;
  getMetricHistory(machineId: string): Promise<MetricHistoryTransport[]>;
}

export class MachineApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);

    this.name = 'MachineApiError';
  }
}

export function createMachineApiClient({
  baseUrl,
  fetch,
}: CreateMachineApiClientOptions): MachineApiClient {
  return {
    async getMachineStatus(machineId: string): Promise<MachineStatusTransport> {
      const response = await fetch(
        `${baseUrl}/api/v1/machines/${machineId}/status`,
        {
          cache: 'no-store',
          headers: {
            accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new MachineApiError(
          `Failed to load machine status: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      return response.json() as Promise<MachineStatusTransport>;
    },

    async getMetricHistory(
      machineId: string,
    ): Promise<MetricHistoryTransport[]> {
      const response = await fetch(
        `${baseUrl}/api/v1/machines/${machineId}/metrics/history`,
        {
          cache: 'no-store',
          headers: {
            accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new MachineApiError(
          `Failed to load machine metric history: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      return response.json() as Promise<MetricHistoryTransport[]>;
    },
  };
}
