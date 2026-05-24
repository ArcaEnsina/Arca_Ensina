export interface Protocol {
  id: string;
  name: string;
  subtitle: string;
  group: string;
}

export interface GuidedProtocolStep {
  currentStep: number;
  totalSteps: number;
}
