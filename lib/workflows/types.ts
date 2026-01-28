/**
 * Workflow configuration types
 * Used for declarative workflow definitions
 */

export interface WorkflowStepConfig {
  id: string;
  title: string;
  component: string; // Component name or identifier
  canProceed?: (state: Record<string, any>) => boolean;
  next?: string | ((state: Record<string, any>) => string | null);
  back?: string | ((state: Record<string, any>) => string | null);
}

export interface WorkflowConfig {
  id: string;
  steps: WorkflowStepConfig[];
  initialStep?: string;
}
