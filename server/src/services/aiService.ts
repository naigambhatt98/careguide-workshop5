import { analyzeSafety } from './safetyService.js';

export type SimplificationInput = {
  appointmentType: string;
  reasonForVisit: string;
  officialInstructions: string;
  additionalNotes?: string;
  facilityName?: string;
};

export async function simplifyInstructions(input: SimplificationInput): Promise<{ summary: string; safetyNotice: string }> {
  const safetyCheck = analyzeSafety(`${input.reasonForVisit} ${input.officialInstructions} ${input.additionalNotes ?? ''}`);

  if (safetyCheck.emergency) {
    return {
      summary: 'This request needs urgent medical attention. Contact emergency services or seek immediate care.',
      safetyNotice: safetyCheck.safeResponse,
    };
  }

  const official = input.officialInstructions?.trim();
  const lines = [
    `CareGuide can explain the information in clear, simple language for ${input.appointmentType.toLowerCase()}.`,
    official
      ? `The instructions provided by the clinic or provider should be read first: "${official.slice(0, 220)}${official.length > 220 ? '...' : ''}".`
      : 'No provider instructions were entered, so this summary focuses on general preparation guidance and questions for the care team.',
    'Provider instructions always take priority. If anything is unclear, contact the healthcare professional or facility before changing routines, diet, medications, or travel plans.',
  ];

  return {
    summary: lines.join(' '),
    safetyNotice: safetyCheck.safeResponse,
  };
}

export async function createFallbackSummary(input: SimplificationInput): Promise<string> {
  const summaryParts: string[] = [];

  const base = `Your ${input.appointmentType.toLowerCase()} is scheduled at ${input.facilityName ?? 'your healthcare facility'}. CareGuide will help organize the instructions in clear language.`;
  summaryParts.push(base);

  if (input.reasonForVisit) {
    summaryParts.push(`The reason for the visit is to ${input.reasonForVisit.toLowerCase()}.`);
  }

  if (input.officialInstructions) {
    const trimmed = input.officialInstructions.trim();
    const instructionPreview = trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
    summaryParts.push(`The official guidance provided is: "${instructionPreview}". Please read it carefully and confirm any unclear details with the clinic.`);
  } else {
    summaryParts.push('No provider instructions were entered, so this guide uses general preparation suggestions and questions to discuss with your healthcare team.');
  }

  if (input.additionalNotes) {
    summaryParts.push(`Additional notes: ${input.additionalNotes.trim()}.`);
  }

  summaryParts.push('CareGuide does not replace your healthcare professional. The instructions from your provider or facility remain the primary source.');
  return summaryParts.join(' ');
}
