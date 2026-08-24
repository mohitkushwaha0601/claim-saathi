export type IntentGoal =
  | "ACCESS_SOME_PF_FUNDS"
  | "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE"
  | "FINAL_PF_SETTLEMENT";

export type JourneyId =
  | "PF_PARTIAL_WITHDRAWAL"
  | "PF_TRANSFER"
  | "PF_FINAL_SETTLEMENT";

export type DecisionState =
  | "PASS"
  | "ACTION_REQUIRED"
  | "NOT_ELIGIBLE"
  | "UNABLE_TO_VERIFY"
  | "NOT_APPLICABLE"
  | "POLICY_REVIEW_REQUIRED";

export interface DemoMetadata {
  environment: "DEMO";
  synthetic_data: true;
  real_government_action_performed: false;
}

export interface DemoPersona {
  persona_id: string;
  display_name: string;
  scenario: string;
  compatible_goal: string;
}

export interface DemoPersonaListResponse {
  personas: DemoPersona[];
  demo: DemoMetadata;
}

export interface OfficialProcess {
  label: string;
  source_id: string;
}

export interface CreateJourneyRequest {
  persona_id: string;
  goal: IntentGoal;
  requested_amount_rupees?: number;
}

export interface JourneyCreatedResponse {
  journey_instance_id: string;
  persona_id: string;
  citizen_goal: IntentGoal;
  journey_id: JourneyId;
  journey_definition_version: number;
  created_at: string;
  official_process: OfficialProcess;
  citizen_state_revision: number;
  demo: DemoMetadata;
}

export interface DecisionSummary {
  decision_id: string;
  state: DecisionState;
  state_display: string;
  issue_codes: string[];
  resolution_ids: string[];
  citizen_state_revision: number;
  evaluated_at: string;
}

export interface JourneyResponse extends JourneyCreatedResponse {
  latest_decision: DecisionSummary | null;
}

export interface PrerequisiteResponse {
  node_id: string;
  label: string;
  state: DecisionState;
  state_display: string;
}

export interface JourneyEvaluationResponse {
  journey_instance_id: string;
  decision_id: string;
  journey_id: JourneyId;
  state: DecisionState;
  state_display: string;
  official_process: OfficialProcess;
  issue_codes: string[];
  resolution_ids: string[];
  policy_version: string;
  graph_version: string;
  journey_definition_version: number;
  citizen_state_revision: number;
  evaluated_at: string;
  prerequisites: PrerequisiteResponse[];
  sources: string[];
  ai_used_for_decision: false;
  demo: DemoMetadata;
}

export interface RuleResultResponse {
  rule_id: string;
  state: DecisionState;
  issue_code: string | null;
  resolution_id: string | null;
  source_id: string | null;
  policy_version: string;
}

export interface DecisionDetailResponse extends JourneyEvaluationResponse {
  rule_results: RuleResultResponse[];
}

export interface DecisionHistoryResponse {
  journey_instance_id: string;
  decisions: DecisionSummary[];
  demo: DemoMetadata;
}

export type ResolutionState =
  | "CREATED"
  | "CITIZEN_ACTION_REQUIRED"
  | "EXTERNAL_ACTION_REQUIRED"
  | "WAITING_FOR_UPDATE"
  | "RECHECKING"
  | "RESOLVED"
  | "STILL_BLOCKED";

export type ResolutionStepType =
  | "INFORMATION"
  | "EXTERNAL_ACTION"
  | "WAIT"
  | "SYSTEM_ACTION";

export interface ApprovedResolutionStepResponse {
  step_id: string;
  step_type: ResolutionStepType;
  title: string;
  canonical_guidance: string;
  official_route: string[];
}

export interface ResolutionResponse {
  resolution_instance_id: string;
  resolution_id: string;
  issue_code: string;
  state: ResolutionState;
  title: string;
  approved_steps: ApprovedResolutionStepResponse[];
  official_sources: string[];
  workflow_version: number;
  created_at: string;
  updated_at: string;
  last_checked_citizen_state_version: string | null;
  demo: DemoMetadata;
}

export interface ResolutionHistoryResponse {
  journey_instance_id: string;
  resolutions: ResolutionResponse[];
  demo: DemoMetadata;
}

export interface StartResolutionRequest {
  decision_id: string;
  issue_code: string;
}

export interface DemoEventResponse {
  journey_instance_id: string;
  event_type: string;
  synthetic_event: true;
  real_government_action_performed: false;
  changed: boolean;
  citizen_state_version: string;
  citizen_state_revision: number;
  demo: DemoMetadata;
}

export type PolicySourceStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUPERSEDED"
  | "REVIEW_REQUIRED";

export interface PolicySourceResponse {
  source_id: string;
  authority: string;
  title: string;
  document_type: string;
  published_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
  reference_url: string | null;
  corroborating_urls: string[];
  verified_at: string | null;
  scope: string | null;
  notes: string | null;
  status: PolicySourceStatus;
  demo: DemoMetadata;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    request_id: string | null;
  };
}
