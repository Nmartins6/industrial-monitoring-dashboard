import { describe, expect, it, jest } from '@jest/globals';

import type {
  MachineStatusTransport,
  MetricHistoryTransport,
} from '@industrial-monitoring/contracts';

import { createMachineApiClient } from './machine-api-client';

describe('Machine API client', () => {
  it('loads the current machine status from the API', async () => {
    const machineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T12:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 72,
        rpm: 1200,
        uptime: 28_800,
        efficiency: 92,
      },
      oee: {
        overall: 88.4,
        availability: 96,
        performance: 94,
        quality: 98,
      },
    };

    const fetchMock = jest.fn(
      async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        expect(input).toBe(
          'http://localhost:3333/api/v1/machines/mixer-01/status',
        );

        expect(init).toEqual({
          cache: 'no-store',
          headers: {
            accept: 'application/json',
          },
        });

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => machineStatus,
        } as Response;
      },
    );

    const client = createMachineApiClient({
      baseUrl: 'http://localhost:3333',
      fetch: fetchMock,
    });

    await expect(client.getMachineStatus('mixer-01')).resolves.toEqual(
      machineStatus,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects when the API returns an unsuccessful response', async () => {
    const fetchMock = jest.fn(
      async (): Promise<Response> =>
        ({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({
            error: {
              code: 'MACHINE_NOT_FOUND',
              message: 'Machine was not found',
            },
          }),
        }) as Response,
    );

    const client = createMachineApiClient({
      baseUrl: 'http://localhost:3333',
      fetch: fetchMock,
    });

    await expect(
      client.getMachineStatus('missing-machine'),
    ).rejects.toMatchObject({
      name: 'MachineApiError',
      message: 'Failed to load machine status: 404 Not Found',
      status: 404,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loads the machine metric history from the API', async () => {
    const metricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T12:00:00.000Z',
        temperature: 72,
        rpm: 1200,
        efficiency: 92,
      },
      {
        timestamp: '2026-07-13T12:00:03.000Z',
        temperature: 73,
        rpm: 1220,
        efficiency: 93,
      },
    ];

    const fetchMock = jest.fn(
      async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        expect(input).toBe(
          'http://localhost:3333/api/v1/machines/mixer-01/metrics/history',
        );

        expect(init).toEqual({
          cache: 'no-store',
          headers: {
            accept: 'application/json',
          },
        });

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => metricHistory,
        } as Response;
      },
    );

    const client = createMachineApiClient({
      baseUrl: 'http://localhost:3333',
      fetch: fetchMock,
    });

    await expect(client.getMetricHistory('mixer-01')).resolves.toEqual(
      metricHistory,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects when the metric history API returns an unsuccessful response', async () => {
    const fetchMock = jest.fn(
      async (): Promise<Response> =>
        ({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({
            error: 'Machine not found',
          }),
        }) as Response,
    );

    const client = createMachineApiClient({
      baseUrl: 'http://localhost:3333',
      fetch: fetchMock,
    });

    await expect(
      client.getMetricHistory('missing-machine'),
    ).rejects.toMatchObject({
      name: 'MachineApiError',
      message: 'Failed to load machine metric history: 404 Not Found',
      status: 404,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
