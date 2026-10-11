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

export type CareGuide = {
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

export type GenerateGuidePayload = {
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  facilityName: string;
  providerName: string;
  reasonForVisit: string;
  officialInstructions: string;
  additionalNotes: string;
};
