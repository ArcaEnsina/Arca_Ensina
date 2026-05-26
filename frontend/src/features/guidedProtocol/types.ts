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

export interface Patient{
  id: number;
  name: string;
  dateOfBirth: string;
  gender: string;
  weight: number;
  height: number;
  phone: string;
  allergies: string[];
  symptoms: string[];
}

export interface Protocol{
  id: string;
  title: string;
  specialty: string;
  cid: string;
  author: string;
  tags: string[];
  isActive: boolean;
}

export interface ProtocolVersion{
  id: number;
  protocolId: string;
  versionNumber: number;
  protocolType: string;
  isCurrent: boolean;
}

export interface ProtocolStep{
  stepNumber: number;
  title: string;
  description: string;
  questions: string[];
  validations: string[];
}

export interface ProtocolExecution {
  id: number;
  protocolId: string;
  patientId: number;
  currentStep: number;
  status: string;
  startedAt: string;
  answers: string[];
}