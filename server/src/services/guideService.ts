import crypto from 'node:crypto';
import { z } from 'zod';
import { analyzeSafety } from './safetyService.js';
import { createFallbackSummary, simplifyInstructions } from './aiService.js';
import { sanitizeText } from '../utils/security.js';

const cleanField = (label: string, maxLength: number, required = true) =>
  z
    .string()
    .transform((value) => sanitizeText(value))
    .refine((value) => (required ? value.length > 0 : true), {
      message: `${label} is required`,
    })
    .refine((value) => value.length <= maxLength, {
      message: `${label} is too long`,
    });

export const guideInputSchema = z.object({
  appointmentType: cleanField('Appointment type', 120),
  appointmentDate: z
    .string()
    .transform((value) => sanitizeText(value))
    .refine((value) => value.length > 0 && !Number.isNaN(Date.parse(value)), {
      message: 'Appointment date must be a valid date',
    }),
  appointmentTime: z
    .string()
    .optional()
    .transform((value) => sanitizeText(value ?? '')),
  facilityName: cleanField('Facility name', 160),
  providerName: z
    .string()
    .optional()
    .transform((value) => sanitizeText(value ?? ''))
    .refine((value) => value.length <= 160, {
      message: 'Provider name is too long',
    }),
  reasonForVisit: cleanField('Reason for visit', 500),
  officialInstructions: z
    .string()
    .optional()
    .transform((value) => sanitizeText(value ?? ''))
    .refine((value) => value.length <= 4000, {
      message: 'Official instructions are too long',
    }),
  additionalNotes: z
    .string()
    .optional()
    .transform((value) => sanitizeText(value ?? ''))
    .refine((value) => value.length <= 1500, {
      message: 'Additional notes are too long',
    }),
});

export type GuideInput = z.infer<typeof guideInputSchema>;

export type ChecklistItem = {
  id: string;
  text: string;
  category: string;
  completed: boolean;
};

export type SuggestedQuestion = {
  id: string;
  text: string;
  category: string;
};

export type GuideRecord = {
  id: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  facilityName: string;
  providerName: string;
  reasonForVisit: string;
  officialInstructions: string;
  additionalNotes: string;
  generatedSummary: string;
  safetyNotice: string;
  providerPriority: string;
  whatToBring: string[];
  importantReminders: string[];
  whatToExpect: string[];
  checklist: ChecklistItem[];
  questions: SuggestedQuestion[];
  createdAt: string;
  updatedAt: string;
};

const appointmentTemplates: Record<string, { safeSuggestions: string[]; generalQuestions: string[]; checklist: string[]; whatToExpect: string[] }> = {
  'Primary Care Visit': {
    safeSuggestions: [
      'Bring a list of your current symptoms or concerns.',
      'Bring your insurance information and photo identification if needed for check-in.',
      'Bring a list of your current medications or supplements.',
    ],
    generalQuestions: [
      'What should I expect during this visit?',
      'What follow-up steps, if any, should I expect after the visit?',
      'Are there any forms, tests, or records I should bring or review before the appointment?',
    ],
    checklist: [
      'Confirm appointment date and time',
      'Review clinic instructions',
      'Prepare identification',
      'Prepare insurance information',
      'Write down current medications',
      'Prepare questions for your provider',
    ],
    whatToExpect: [
      'Your visit may include reviewing symptoms, discussing health concerns, and updating your medical history.',
      'Depending on your clinic and reason for the visit, you may be asked about recent changes in your health or lifestyle.',
    ],
  },
  'Specialist Consultation': {
    safeSuggestions: [
      'Bring referral documents or appointment information if your clinic requested them.',
      'Bring a list of current medications and allergies.',
      'Bring relevant records or recent test results if you have them.',
    ],
    generalQuestions: [
      'What is the purpose of this consultation?',
      'Are there any tests or records I should bring before the visit?',
      'When should I expect follow-up or next steps?',
    ],
    checklist: [
      'Confirm the appointment date and time',
      'Review any referral or visit instructions',
      'Compile recent records',
      'Write down current medications',
      'Prepare questions for the specialist',
    ],
    whatToExpect: [
      'Your consultation may involve reviewing your history, symptoms, and any relevant records.',
      'Your specialist may discuss next steps, testing, or follow-up plans depending on your situation.',
    ],
  },
  'Blood Test': {
    safeSuggestions: [
      'Bring the lab order or appointment instructions if the clinic provided them.',
      'Bring a photo ID and any insurance information required by the facility.',
      'Follow the specific fasting or preparation instructions from your care team.',
    ],
    generalQuestions: [
      'Do I need to fast for this blood test?',
      'Should I continue my regular medications before the test?',
      'When will the results be available?',
    ],
    checklist: [
      'Review preparation instructions',
      'Confirm fasting requirements',
      ' Bring lab order or paperwork',
      'Bring identification',
      'Ask about medication guidance',
    ],
    whatToExpect: [
      'Some blood tests require fasting, while others do not. Confirm the instructions for your specific test.',
      'Your care team can tell you exactly what to expect before, during, and after the blood draw.',
    ],
  },
  'MRI': {
    safeSuggestions: [
      'Review the imaging center\'s instructions carefully and bring your appointment information.',
      'Tell the imaging center if you have implanted devices, metal, or any safety concerns before the scan.',
      'Bring a list of any implanted medical devices, previous procedures, or questions you want to ask.',
    ],
    generalQuestions: [
      'Is contrast expected for this MRI?',
      'Is there anything I should remove before the scan?',
      'Should I tell the imaging center about implanted devices or metal in my body?',
    ],
    checklist: [
      'Review imaging center instructions',
      'Prepare identification',
      'Bring insurance information',
      'Check for implanted devices or metal',
      'Prepare questions for the imaging team',
    ],
    whatToExpect: [
      'The MRI process can vary depending on the body area being scanned and the facility\'s instructions.',
      'Your imaging center can tell you what to expect during the scan and whether any contrast or additional preparation is needed.',
    ],
  },
  'CT Scan': {
    safeSuggestions: [
      'Bring the appointment information and any required documents from the clinic.',
      'Ask the facility whether any preparation instructions apply to your specific scan.',
      'Bring a list of current medications and any questions you have for the care team.',
    ],
    generalQuestions: [
      'Do I need to do anything before the CT scan?',
      'Will contrast be used for this scan?',
      'Are there any restrictions or follow-up steps I should know about?',
    ],
    checklist: [
      'Review CT preparation instructions',
      'Bring identification',
      'Prepare insurance information',
      'Ask about contrast or fasting instructions',
      'Write down questions',
    ],
    whatToExpect: [
      'A CT scan may involve lying still while images are taken, and preparation can depend on the type of exam.',
      'Your facility can provide the most accurate explanation of what to expect before and during your CT scan.',
    ],
  },
  'Ultrasound': {
    safeSuggestions: [
      'Bring identification and any materials given by the clinic.',
      'Follow the facility instructions for the type of ultrasound you are having.',
      'Bring a list of questions or symptoms you want to discuss.',
    ],
    generalQuestions: [
      'Are there any instructions I should follow before the ultrasound?',
      'Do I need to bring anything specific?',
      'When should I expect follow-up or results?',
    ],
    checklist: [
      'Review appointment instructions',
      'Bring identification',
      'Prepare insurance information',
      'Write down questions',
      'Check whether follow-up is expected',
    ],
    whatToExpect: [
      'Ultrasound appointments can vary depending on the area being examined and the clinic\'s process.',
      'Your care team can explain the details, what to expect during the exam, and any follow-up steps.',
    ],
  },
  'Routine Screening': {
    safeSuggestions: [
      'Bring any required paperwork or screening instructions from the clinic.',
      'Bring a list of your medications and any health questions you want to discuss.',
      'Review whether the screening needs any preparation before your appointment.',
    ],
    generalQuestions: [
      'What should I expect during the screening?',
      'Do I need to bring anything specific to the visit?',
      'What follow-up steps, if any, will happen after the screening?',
    ],
    checklist: [
      'Confirm appointment date and time',
      'Review screening instructions',
      'Prepare identification',
      'Bring relevant records',
      'Prepare questions',
    ],
    whatToExpect: [
      'Routine screenings are often meant to review health status, discuss preventive care, or identify follow-up needs.',
      'Your healthcare provider can explain what to expect and whether any additional steps or tests are recommended.',
    ],
  },
  'Follow-Up Visit': {
    safeSuggestions: [
      'Bring notes about your symptoms, test results, or questions since your last visit.',
      'Bring your medication list and any questions about follow-up care.',
      'Bring your insurance information and identification if the clinic asks for it.',
    ],
    generalQuestions: [
      'What follow-up steps are recommended?',
      'When should I expect results or another appointment?',
      'Are there any changes I should make before my next visit?',
    ],
    checklist: [
      'Confirm appointment date and time',
      'Review prior visit notes',
      'Bring medication list',
      'Prepare questions',
      'Bring relevant records',
    ],
    whatToExpect: [
      'A follow-up visit often focuses on progress, symptoms, treatment plans, or next steps.',
      'Your healthcare provider can explain the expected plan and answer questions specific to your care.',
    ],
  },
};

function buildWhatToBring(appointmentType: string, officialInstructions: string): string[] {
  const template = appointmentTemplates[appointmentType] ?? appointmentTemplates['Primary Care Visit'];
  const items = [...template.safeSuggestions];

  if (officialInstructions.toLowerCase().includes('insurance')) {
    items.push('Insurance information or card');
  }

  if (officialInstructions.toLowerCase().includes('id') || officialInstructions.toLowerCase().includes('identification')) {
    items.push('Photo identification');
  }

  if (officialInstructions.toLowerCase().includes('medication') || officialInstructions.toLowerCase().includes('meds')) {
    items.push('Current medication list');
  }

  if (officialInstructions.toLowerCase().includes('referral') || officialInstructions.toLowerCase().includes('records')) {
    items.push('Referral documents or previous records');
  }

  return Array.from(new Set(items));
}

function buildChecklist(appointmentType: string): ChecklistItem[] {
  const template = appointmentTemplates[appointmentType] ?? appointmentTemplates['Primary Care Visit'];
  return template.checklist.map((item) => ({
    id: crypto.randomUUID(),
    text: item,
    category: 'Preparation',
    completed: false,
  }));
}

function buildQuestions(appointmentType: string): SuggestedQuestion[] {
  const template = appointmentTemplates[appointmentType] ?? appointmentTemplates['Primary Care Visit'];
  return template.generalQuestions.map((text) => ({
    id: crypto.randomUUID(),
    text,
    category: 'General',
  }));
}

function buildImportantReminders(officialInstructions: string): string[] {
  const reminders: string[] = [];
  const text = officialInstructions.trim();

  if (!text) {
    reminders.push('No clinic-specific instructions were entered. Confirm any timing, fasting, or arrival instructions with the facility before the visit.');
    return reminders;
  }

  const normalized = text.toLowerCase();

  if (normalized.includes('npo') || normalized.includes('nothing by mouth') || normalized.includes('after midnight')) {
    reminders.push('Follow time-based intake instructions exactly. If a fasting or NPO instruction is unclear, contact the clinic before changing what you eat or drink.');
  }

  if (normalized.includes('arrive') && /\d+\s*minutes/.test(normalized)) {
    reminders.push('Plan to arrive early enough to complete check-in before the scheduled appointment or procedure time.');
  }

  if (normalized.includes('bring')) {
    reminders.push('Review the instructions for items you should bring, such as identification, referral records, or insurance information.');
  }

  reminders.push('If anything in the instructions is unclear, contact the clinic or care team before your appointment.');
  return reminders;
}

export async function generateGuideRecord(input: GuideInput): Promise<GuideRecord> {
  const parsed = guideInputSchema.parse(input);
  const combinedText = `${parsed.reasonForVisit} ${parsed.officialInstructions} ${parsed.additionalNotes}`;
  const safety = analyzeSafety(combinedText);

  if (safety.emergency) {
    throw new Error('Emergency symptoms require immediate medical attention. Please seek urgent care or emergency assistance.');
  }

  const dateText = new Date(parsed.appointmentDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const template = appointmentTemplates[parsed.appointmentType] ?? appointmentTemplates['Primary Care Visit'];
  const summaryResult = await simplifyInstructions({
    appointmentType: parsed.appointmentType,
    reasonForVisit: parsed.reasonForVisit,
    officialInstructions: parsed.officialInstructions,
    additionalNotes: parsed.additionalNotes,
    facilityName: parsed.facilityName,
  });

  const fallbackSummary = await createFallbackSummary({
    appointmentType: parsed.appointmentType,
    reasonForVisit: parsed.reasonForVisit,
    officialInstructions: parsed.officialInstructions,
    additionalNotes: parsed.additionalNotes,
    facilityName: parsed.facilityName,
  });

  const generatedSummary = summaryResult.summary || fallbackSummary;

  const now = new Date().toISOString();
  const record: GuideRecord = {
    id: crypto.randomUUID(),
    appointmentType: parsed.appointmentType,
    appointmentDate: dateText,
    appointmentTime: parsed.appointmentTime || 'Time not specified',
    facilityName: parsed.facilityName,
    providerName: parsed.providerName || 'Not provided',
    reasonForVisit: parsed.reasonForVisit,
    officialInstructions: parsed.officialInstructions || 'No provider instructions were entered.',
    additionalNotes: parsed.additionalNotes || 'No additional notes provided.',
    generatedSummary,
    safetyNotice: safety.safeResponse,
    providerPriority: 'Always follow the instructions provided directly by your healthcare professional or facility. CareGuide organizes and explains information but does not replace provider instructions.',
    whatToBring: buildWhatToBring(parsed.appointmentType, parsed.officialInstructions),
    importantReminders: buildImportantReminders(parsed.officialInstructions),
    whatToExpect: template.whatToExpect,
    checklist: buildChecklist(parsed.appointmentType),
    questions: buildQuestions(parsed.appointmentType),
    createdAt: now,
    updatedAt: now,
  };

  return record;
}
