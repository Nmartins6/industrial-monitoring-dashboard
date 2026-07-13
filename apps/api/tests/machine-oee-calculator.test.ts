import { describe, expect, it } from '@jest/globals';

import { createMachineOeeCalculator } from '../src/machines/machine-oee-calculator.js';

describe('Machine OEE calculator', () => {
  it('calculates the overall OEE from availability, performance and quality', () => {
    const calculator = createMachineOeeCalculator();

    const result = calculator.calculate({
      availability: 96,
      performance: 94,
      quality: 98,
    });

    expect(result).toEqual({
      overall: 88.4,
      availability: 96,
      performance: 94,
      quality: 98,
    });
  });

  it('keeps OEE components within valid percentage limits', () => {
    const calculator = createMachineOeeCalculator();

    const result = calculator.calculate({
      availability: 105,
      performance: -5,
      quality: 120,
    });

    expect(result).toEqual({
      overall: 0,
      availability: 100,
      performance: 0,
      quality: 100,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects the non-finite availability value %s',
    (invalidAvailability) => {
      const calculator = createMachineOeeCalculator();

      expect(() => {
        calculator.calculate({
          availability: invalidAvailability,
          performance: 94,
          quality: 98,
        });
      }).toThrow('OEE components must be finite numbers');
    },
  );
});
