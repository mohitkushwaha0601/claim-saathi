"""Versioned policy metadata contracts without policy evaluation."""

from datetime import date
from typing import Annotated

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    StrictBool,
    StrictInt,
    StrictStr,
    model_validator,
)

from .enums import (
    DecisionState,
    JourneyId,
    PolicyEvaluatorId,
    PolicyLifecycleStatus,
    PolicyOperator,
    PolicyRuleDisposition,
    PolicyRuleType,
    PolicySourceStatus,
)

NonEmptyString = Annotated[str, Field(min_length=1)]
PolicyScalar = StrictBool | StrictInt | StrictStr


class IntegerRatio(BaseModel):
    """An immutable integer ratio used by an allowlisted named evaluator."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    numerator: Annotated[int, Field(ge=0, strict=True)]
    denominator: Annotated[int, Field(gt=0, strict=True)]


PolicyExpected = PolicyScalar | tuple[PolicyScalar, ...] | IntegerRatio | None


class PolicySource(BaseModel):
    """Source provenance for a future verified government policy."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    source_id: str = Field(min_length=1)
    authority: str = Field(min_length=1)
    title: str = Field(min_length=1)
    document_type: str = Field(min_length=1)
    published_at: date | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    reference_url: HttpUrl | None = None
    corroborating_urls: tuple[HttpUrl, ...] = ()
    verified_at: AwareDatetime | None = None
    status: PolicySourceStatus
    notes: str | None = None
    scope: str | None = None


class PolicyRule(BaseModel):
    """Declarative rule data for a future deterministic policy engine."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    rule_id: str = Field(min_length=1)
    version: str = Field(min_length=1)
    requirement_id: str = Field(min_length=1)
    journeys: tuple[JourneyId, ...]
    rule_type: PolicyRuleType
    input_path: NonEmptyString | None = None
    trust_status_path: NonEmptyString | None = None
    operator: PolicyOperator | None = None
    expected: PolicyExpected = None
    evaluator_id: PolicyEvaluatorId | None = None
    pass_state: DecisionState | None = None
    failure_state: DecisionState | None = None
    issue_code: NonEmptyString | None = None
    resolution_id: str | None = None
    source_id: NonEmptyString | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    status: PolicyLifecycleStatus
    disposition: PolicyRuleDisposition = PolicyRuleDisposition.EXECUTABLE
    notes: str | None = None

    @model_validator(mode="after")
    def validate_rule_shape(self) -> "PolicyRule":
        """Reject ambiguous rule shapes before they reach the engine."""

        if self.disposition is PolicyRuleDisposition.POLICY_REVIEW_REQUIRED:
            if any(
                value is not None
                for value in (
                    self.input_path,
                    self.trust_status_path,
                    self.operator,
                    self.expected,
                    self.evaluator_id,
                    self.pass_state,
                    self.failure_state,
                )
            ):
                raise ValueError("policy-review rules must not be executable")
            return self

        if self.pass_state is None or self.failure_state is None:
            raise ValueError("executable rules require pass and failure states")

        if self.rule_type is PolicyRuleType.AUTHORITATIVE_CAPABILITY:
            if any(
                value is not None
                for value in (
                    self.input_path,
                    self.trust_status_path,
                    self.operator,
                    self.expected,
                    self.evaluator_id,
                )
            ):
                raise ValueError(
                    "authoritative capability rules cannot define local evaluation"
                )
            return self

        if self.evaluator_id is not None:
            if any(
                value is not None
                for value in (
                    self.input_path,
                    self.trust_status_path,
                    self.operator,
                )
            ):
                raise ValueError(
                    "named evaluator rules cannot also define path operators"
                )
            required_rule_type = {
                PolicyEvaluatorId.PARTIAL_WITHDRAWAL_75_PERCENT_LIMIT: (
                    PolicyRuleType.POLICY_RULE
                ),
                PolicyEvaluatorId.PREVIOUS_EMPLOYMENT_EXISTS: (
                    PolicyRuleType.DATA_CHECK
                ),
                PolicyEvaluatorId.PREVIOUS_EMPLOYMENT_EXIT_DATE_EXISTS: (
                    PolicyRuleType.POLICY_RULE
                ),
            }[self.evaluator_id]
            if self.rule_type is not required_rule_type:
                raise ValueError(
                    "named evaluator rule type does not match its safety semantics"
                )
            if (
                self.evaluator_id
                is PolicyEvaluatorId.PARTIAL_WITHDRAWAL_75_PERCENT_LIMIT
                and not isinstance(self.expected, IntegerRatio)
            ):
                raise ValueError(
                    "partial-withdrawal amount evaluator requires an integer ratio"
                )
            if (
                self.evaluator_id
                is PolicyEvaluatorId.PARTIAL_WITHDRAWAL_75_PERCENT_LIMIT
                and isinstance(self.expected, IntegerRatio)
                and (self.expected.numerator, self.expected.denominator)
                != (75, 100)
            ):
                raise ValueError(
                    "75-percent evaluator requires the reviewed 75/100 ratio"
                )
            if (
                self.evaluator_id
                is not PolicyEvaluatorId.PARTIAL_WITHDRAWAL_75_PERCENT_LIMIT
                and self.expected is not None
            ):
                raise ValueError(
                    "employment evaluators do not accept ignored expected data"
                )
            return self

        if self.input_path is None or self.operator is None:
            raise ValueError("operator rules require input_path and operator")
        if self.operator is PolicyOperator.EXISTS:
            if self.expected is not None:
                raise ValueError("exists does not accept an expected operand")
        elif self.expected is None:
            raise ValueError("comparison operators require an expected operand")
        return self


class PolicyVersion(BaseModel):
    """Immutable collection of rules for one journey policy version."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    policy_id: str = Field(min_length=1)
    version: str = Field(min_length=1)
    journey_id: JourneyId
    status: PolicyLifecycleStatus
    rules: tuple[PolicyRule, ...]
    is_conflict_demo: bool = False
    notes: str | None = None

    @model_validator(mode="after")
    def validate_conflict_demo(self) -> "PolicyVersion":
        if self.is_conflict_demo and any(
            rule.disposition is not PolicyRuleDisposition.POLICY_REVIEW_REQUIRED
            for rule in self.rules
        ):
            raise ValueError("conflict-demo policy rules must be non-executable")
        return self
