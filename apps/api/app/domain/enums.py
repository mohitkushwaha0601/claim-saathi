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


class JourneyId(str, Enum):
    """Stable domain identifiers for supported citizen journeys."""

    PF_PARTIAL_WITHDRAWAL = "PF_PARTIAL_WITHDRAWAL"
    PF_TRANSFER = "PF_TRANSFER"
    PF_FINAL_SETTLEMENT = "PF_FINAL_SETTLEMENT"


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


class PolicyLifecycleStatus(str, Enum):
    """Lifecycle metadata for future policy sources and rules."""

    DRAFT = "DRAFT"
    VERIFIED = "VERIFIED"
    ACTIVE = "ACTIVE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    RETIRED = "RETIRED"


class PolicyRuleType(str, Enum):
    """Contract-level category for a future prerequisite rule."""

    PREREQUISITE = "PREREQUISITE"


class PolicyOperator(str, Enum):
    """Declarative operators that a future policy engine may implement."""

    EQUALS = "EQUALS"
    NOT_EQUALS = "NOT_EQUALS"
    GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL"
    LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL"
    IN = "IN"
    IS_TRUE = "IS_TRUE"
    IS_FALSE = "IS_FALSE"


class ResolutionActor(str, Enum):
    """Actor responsible for an approved resolution workflow."""

    CITIZEN = "CITIZEN"
    EMPLOYER = "EMPLOYER"
    GOVERNMENT_AUTHORITY = "GOVERNMENT_AUTHORITY"


class ResolutionState(str, Enum):
    """States reserved for a future resolution state machine."""

    CREATED = "CREATED"
    CITIZEN_ACTION_REQUIRED = "CITIZEN_ACTION_REQUIRED"
    EXTERNAL_ACTION_REQUIRED = "EXTERNAL_ACTION_REQUIRED"
    WAITING_FOR_UPDATE = "WAITING_FOR_UPDATE"
    RECHECKING = "RECHECKING"
    RESOLVED = "RESOLVED"
    STILL_BLOCKED = "STILL_BLOCKED"
