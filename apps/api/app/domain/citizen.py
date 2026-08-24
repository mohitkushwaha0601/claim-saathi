"""Versioned, synthetic citizen fact snapshots."""

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from .enums import EmploymentRecordType, ExitRecordStatus, VerificationStatus

NonNegativeInteger = Annotated[int, Field(ge=0, strict=True)]


class AccessState(BaseModel):
    """Synthetic account-access facts."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    uan_status: VerificationStatus


class IdentityState(BaseModel):
    """Synthetic identity-verification facts without identity numbers."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    aadhaar_status: VerificationStatus


class BankState(BaseModel):
    """Synthetic bank-verification facts without account details."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    verification_status: VerificationStatus


class EmploymentRecord(BaseModel):
    """A supplied employment fact record; dates do not imply decisions."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    employment_id: str = Field(min_length=1)
    employer_label: str = Field(min_length=1)
    employment_type: EmploymentRecordType
    start_date: date
    exit_date: date | None = None
    exit_record_status: ExitRecordStatus


class EmploymentState(BaseModel):
    """Synthetic employment facts supplied to future journey planning."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    currently_employed: bool
    records: tuple[EmploymentRecord, ...]


class ServiceState(BaseModel):
    """Supplied aggregate service facts without eligibility interpretation."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    total_service_months: NonNegativeInteger
    status: VerificationStatus


class PFState(BaseModel):
    """Supplied PF balance facts represented in integer rupees."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    available_balance_rupees: NonNegativeInteger
    status: VerificationStatus


class ClaimsState(BaseModel):
    """Supplied claim-history facts without outcome interpretation."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    active_transfer: bool
    transfer_already_completed: bool


class CitizenState(BaseModel):
    """An immutable versioned snapshot of trusted synthetic facts."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
    )

    citizen_id: str = Field(min_length=1)
    state_version: str = Field(min_length=1)
    is_synthetic: Literal[True]
    access: AccessState
    identity: IdentityState
    bank: BankState
    employment: EmploymentState
    service: ServiceState
    pf: PFState
    claims: ClaimsState
