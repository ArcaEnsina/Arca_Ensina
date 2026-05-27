import type { Patient } from '@/features/patient/types';

export type { Patient };

export interface ProtocolStep {
  stepNumber: number;
  title: string;
  description: string;
  questions: string[];
  validations: string[];
}

export interface Protocol {
  id: string;
  name: string;
  subtitle: string;
  group: string;
  isActive: boolean;
}

export interface ProtocolVersion {
  id: number;
  protocolId: string;
  versionNumber: number;
  protocolType: string;
  isCurrent: boolean;
  stepsData: Record<number, ProtocolStep>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface GuidedProtocolStep {
  currentStep: number;
  totalSteps: number;
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