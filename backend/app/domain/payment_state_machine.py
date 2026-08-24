from typing import Dict, Set
from app.models.payments import PaymentIntentStatus

class PaymentStateError(Exception):
    def __init__(self, current_status: PaymentIntentStatus, target_status: PaymentIntentStatus):
        self.current_status = current_status
        self.target_status = target_status
        super().__init__(f"Invalid payment state transition from {current_status.value} to {target_status.value}")

class PaymentStateMachine:
    # Map of current_status -> set of allowed next statuses
    ALLOWED_TRANSITIONS: Dict[PaymentIntentStatus, Set[PaymentIntentStatus]] = {
        PaymentIntentStatus.REQUIRES_PAYMENT_METHOD: {
            PaymentIntentStatus.REQUIRES_CONFIRMATION,
            PaymentIntentStatus.PROCESSING,
            PaymentIntentStatus.CANCELLED,
            PaymentIntentStatus.FAILED,
        },
        PaymentIntentStatus.REQUIRES_CONFIRMATION: {
            PaymentIntentStatus.PROCESSING,
            PaymentIntentStatus.SUCCEEDED,
            PaymentIntentStatus.FAILED,
            PaymentIntentStatus.CANCELLED,
        },
        PaymentIntentStatus.PROCESSING: {
            PaymentIntentStatus.SUCCEEDED,
            PaymentIntentStatus.FAILED,
            PaymentIntentStatus.CANCELLED,
        },
        PaymentIntentStatus.SUCCEEDED: {
            PaymentIntentStatus.REFUNDED,
            PaymentIntentStatus.PARTIALLY_REFUNDED,
        },
        PaymentIntentStatus.FAILED: set(),  # Terminal state
        PaymentIntentStatus.CANCELLED: set(),  # Terminal state
        PaymentIntentStatus.REFUNDED: set(),  # Terminal state
        PaymentIntentStatus.PARTIALLY_REFUNDED: {
            PaymentIntentStatus.REFUNDED,
        },
    }

    @classmethod
    def validate_transition(cls, current: PaymentIntentStatus, target: PaymentIntentStatus) -> bool:
        if current == target:
            return True
        allowed = cls.ALLOWED_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise PaymentStateError(current, target)
        return True
