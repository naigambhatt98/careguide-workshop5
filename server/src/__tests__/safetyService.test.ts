import { describe, it, expect } from 'vitest';
import { analyzeSafety, isEmergencyRequest } from '../services/safetyService.js';

describe('safetyService', () => {
  it('flags emergency messages', () => {
    const result = analyzeSafety('I have severe chest pain and trouble breathing');
    expect(isEmergencyRequest(result)).toBe(true);
  });

  it('blocks medication change requests', () => {
    const result = analyzeSafety('Should I stop taking my blood thinner before the procedure?');
    expect(result.medicationChange).toBe(true);
    expect(result.safeResponse).toContain('CareGuide cannot advise');
  });

  it('handles diagnosis questions safely', () => {
    const result = analyzeSafety('Do I have diabetes based on my symptoms?');
    expect(result.diagnosis).toBe(true);
    expect(result.safeResponse).toContain('diagnosis');
  });
});
