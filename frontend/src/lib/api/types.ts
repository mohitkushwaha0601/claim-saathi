export type IntentGoal =
  | "ACCESS_SOME_PF_FUNDS"
  | "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE"
  | "FINAL_PF_SETTLEMENT";

export type JourneyId =
  | "PF_PARTIAL_WITHDRAWAL"
  | "PF_TRANSFER"
  | "PF_FINAL_SETTLEMENT";

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
  state: string;
  state_display: string;
  issue_codes: string[];
  resolution_ids: string[];
  citizen_state_revision: number;
  evaluated_at: string;
}

export interface JourneyResponse extends JourneyCreatedResponse {
  latest_decision: DecisionSummary | null;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    request_id: string | null;
  };
}
