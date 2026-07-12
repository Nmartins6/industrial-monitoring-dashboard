import type { MetricHistory } from '../src/index.js';

const validMetricHistory: MetricHistory = {
  timestamp: new Date(),
  temperature: 78,
  rpm: 1200,
  efficiency: 92,
};

const invalidMetricHistory: MetricHistory = {
  ...validMetricHistory,

  // @ts-expect-error RPM must be represented as a number.
  rpm: '1200',
};

export { invalidMetricHistory, validMetricHistory };
