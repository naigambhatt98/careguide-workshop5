export type SafetyAnalysis = {
  emergency: boolean;
  diagnosis: boolean;
  medicationChange: boolean;
  treatmentRecommendation: boolean;
  medicalClearance: boolean;
  safeResponse: string;
};

const emergencyPatterns = [
  /severe chest pain/i,
  /trouble breathing/i,
  /loss of consciousness/i,
  /unconscious/i,
  /choking/i,
  /stroke/i,
  /heart attack/i,
  /severe bleeding/i,
  /fainting/i,
  /not breathing/i,
  /serious allergic reaction/i,
];

const diagnosisPatterns = [
  /diagnose/i,
  /do i have/i,
  /am i having/i,
  /what is wrong with me/i,
  /what disease/i,
  /is this cancer/i,
  /symptom.*diagnosis/i,
  /can you tell if/i,
];

const medicationPatterns = [
  /stop taking/i,
  /stop.*medication/i,
  /skip.*medication/i,
  /skip.*my/i,
  /change.*medication/i,
  /start.*medication/i,
  /increase.*dose/i,
  /decrease.*dose/i,
  /blood thinner/i,
  /prescription/i,
  /medication.*before/i,
  /should i stop/i,
  /should i take/i,
];

const treatmentPatterns = [
  /treat this/i,
  /what treatment/i,
  /best treatment/i,
  /what should i do for/i,
  /recommend.*treatment/i,
  /home remedy/i,
];

const medicalClearancePatterns = [
  /safe for the procedure/i,
  /can i have the procedure/i,
  /am i cleared/i,
  /medical clearance/i,
  /clearance for/i,
  /is it safe to proceed/i,
];

export function analyzeSafety(input: string): SafetyAnalysis {
  const text = input.trim();
  const emergency = emergencyPatterns.some((pattern) => pattern.test(text));
  const diagnosis = diagnosisPatterns.some((pattern) => pattern.test(text));
  const medicationChange = medicationPatterns.some((pattern) => pattern.test(text));
  const treatmentRecommendation = treatmentPatterns.some((pattern) => pattern.test(text));
  const medicalClearance = medicalClearancePatterns.some((pattern) => pattern.test(text));

  let safeResponse = 'CareGuide supports appointment preparation and clear communication, but it does not replace your healthcare professional\'s instructions.';

  if (emergency) {
    safeResponse = 'If you believe you may be experiencing a medical emergency, seek immediate medical help or contact local emergency services. CareGuide does not provide emergency medical guidance.';
  } else if (diagnosis) {
    safeResponse = 'CareGuide cannot provide diagnosis or interpret symptoms. Please share your concerns with your healthcare provider or a clinician for evaluation.';
  } else if (medicationChange) {
    safeResponse = 'CareGuide cannot advise you to start, stop, skip, or change medication. Contact the healthcare professional who prescribed it or the team performing your procedure for specific instructions.';
  } else if (treatmentRecommendation) {
    safeResponse = 'CareGuide does not recommend treatment plans or medication changes. Please review recommendations with your healthcare professional.';
  } else if (medicalClearance) {
    safeResponse = 'CareGuide cannot provide medical clearance or determine whether a procedure is safe for you. Your provider or facility can confirm that information.';
  }

  return {
    emergency,
    diagnosis,
    medicationChange,
    treatmentRecommendation,
    medicalClearance,
    safeResponse,
  };
}

export function isEmergencyRequest(analysis: Pick<SafetyAnalysis, 'emergency'>): boolean {
  return Boolean(analysis.emergency);
}
