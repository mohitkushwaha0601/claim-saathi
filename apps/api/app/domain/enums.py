"""Strongly typed values shared by ClaimSaathi domain contracts."""

from enum import Enum


class DecisionState(str, Enum):
    """Canonical states emitted by future deterministic decision logic."""

    PASS = "PASS"
    ACTION_REQUIRED = "ACTION_REQUIRED"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    POLICY_REVIEW_REQUIRED = "POLICY_REVIEW_REQUIRED"


class PrerequisiteAggregation(str, Enum):
    """Closed aggregation vocabulary for prerequisite groups."""

    ALL_OF = "ALL_OF"


class JourneyId(str, Enum):
    """Stable domain identifiers for supported citizen journeys."""

    PF_PARTIAL_WITHDRAWAL = "PF_PARTIAL_WITHDRAWAL"
    PF_TRANSFER = "PF_TRANSFER"
    PF_FINAL_SETTLEMENT = "PF_FINAL_SETTLEMENT"


class JourneyDefinitionStatus(str, Enum):
    """Lifecycle state for immutable journey catalog definitions."""

    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"


class IntentGoal(str, Enum):
    """Citizen goals, kept distinct from government journey identifiers."""

    ACCESS_SOME_PF_FUNDS = "ACCESS_SOME_PF_FUNDS"
    TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE = "TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE"
    FINAL_PF_SETTLEMENT = "FINAL_PF_SETTLEMENT"


class VerificationStatus(str, Enum):
    """Small factual status vocabulary for synthetic citizen snapshots."""

    VERIFIED = "VERIFIED"
    NOT_VERIFIED = "NOT_VERIFIED"
    PENDING = "PENDING"
    UNAVAILABLE = "UNAVAILABLE"
    INCONSISTENT = "INCONSISTENT"


class ExitRecordStatus(str, Enum):
    """Recorded status of an employment exit fact without inference."""

    RECORDED = "RECORDED"
    NOT_RECORDED = "NOT_RECORDED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNAVAILABLE = "UNAVAILABLE"
    INCONSISTENT = "INCONSISTENT"


class EmploymentRecordType(str, Enum):
    """Explicit role of an employment record; never inferred from dates."""

    PREVIOUS = "PREVIOUS"
    CURRENT = "CURRENT"


class PolicySourceStatus(str, Enum):
    """Review status controlling whether a source can back active policy."""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUPERSEDED = "SUPERSEDED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class PolicyLifecycleStatus(str, Enum):
    """Immutable policy-version and rule lifecycle states."""

    DRAFT = "DRAFT"
    REVIEWED = "REVIEWED"
    TESTED = "TESTED"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"


class PolicyRuleType(str, Enum):
    """Semantics of a deterministic policy-engine rule."""

    DATA_CHECK = "DATA_CHECK"
    POLICY_RULE = "POLICY_RULE"
    AUTHORITATIVE_CAPABILITY = "AUTHORITATIVE_CAPABILITY"

    # Phase 1 compatibility alias. Serialized policy configuration uses
    # POLICY_RULE and no legacy PREREQUISITE value is accepted from JSON.
    PREREQUISITE = "POLICY_RULE"


class PolicyOperator(str, Enum):
    """Closed deterministic operator vocabulary."""

    EXISTS = "exists"
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GTE = "gte"
    LTE = "lte"
    IN = "in"
    NOT_IN = "not_in"

    # Phase 1 attribute compatibility aliases.
    GREATER_THAN_OR_EQUAL = "gte"
    LESS_THAN_OR_EQUAL = "lte"


class PolicyRuleDisposition(str, Enum):
    """Whether a rule may execute or must fail closed for review."""

    EXECUTABLE = "EXECUTABLE"
    POLICY_REVIEW_REQUIRED = "POLICY_REVIEW_REQUIRED"


class PolicyEvaluatorId(str, Enum):
    """Allowlisted named evaluators; arbitrary expressions are forbidden."""

    PARTIAL_WITHDRAWAL_75_PERCENT_LIMIT = (
        "PARTIAL_WITHDRAWAL_75_PERCENT_LIMIT"
    )
    PREVIOUS_EMPLOYMENT_EXISTS = "PREVIOUS_EMPLOYMENT_EXISTS"
    PREVIOUS_EMPLOYMENT_EXIT_DATE_EXISTS = (
        "PREVIOUS_EMPLOYMENT_EXIT_DATE_EXISTS"
    )


class CapabilityValue(str, Enum):
    """Trusted result supplied by an authoritative external capability."""

    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"
    UNKNOWN = "UNKNOWN"


class ResolutionActor(str, Enum):
    """Actor responsible for an approved resolution workflow."""

    CITIZEN = "CITIZEN"
    EMPLOYER = "EMPLOYER"
    GOVERNMENT_AUTHORITY = "GOVERNMENT_AUTHORITY"


class ResolutionStepType(str, Enum):
    """Closed vocabulary for pre-approved resolution workflow steps."""

    INFORMATION = "INFORMATION"
    EXTERNAL_ACTION = "EXTERNAL_ACTION"
    WAIT = "WAIT"
    SYSTEM_ACTION = "SYSTEM_ACTION"


class ResolutionSuccessVerifier(str, Enum):
    """Allowlisted deterministic checks for resolution success."""

    PREVIOUS_EMPLOYMENT_EXIT_DATE_PRESENT = (
        "PREVIOUS_EMPLOYMENT_EXIT_DATE_PRESENT"
    )


class ResolutionWorkflowStatus(str, Enum):
    """Lifecycle state for immutable resolution workflow versions."""

    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"


class ResolutionVerificationCode(str, Enum):
    """Non-sensitive reason recorded by a resolution success verifier."""

    SUCCESS_CONDITION_SATISFIED = "SUCCESS_CONDITION_SATISFIED"
    EXIT_DATE_STILL_MISSING = "EXIT_DATE_STILL_MISSING"
    PREVIOUS_EMPLOYMENT_RECORD_NOT_UNIQUE = (
        "PREVIOUS_EMPLOYMENT_RECORD_NOT_UNIQUE"
    )


class ResolutionState(str, Enum):
    """States reserved for a future resolution state machine."""

    CREATED = "CREATED"
    CITIZEN_ACTION_REQUIRED = "CITIZEN_ACTION_REQUIRED"
    EXTERNAL_ACTION_REQUIRED = "EXTERNAL_ACTION_REQUIRED"
    WAITING_FOR_UPDATE = "WAITING_FOR_UPDATE"
    RECHECKING = "RECHECKING"
    RESOLVED = "RESOLVED"
    STILL_BLOCKED = "STILL_BLOCKED"
