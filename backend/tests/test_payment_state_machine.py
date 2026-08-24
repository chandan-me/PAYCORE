import pytest
from app.models.payments import PaymentIntentStatus
from app.domain.payment_state_machine import PaymentStateMachine, PaymentStateError

def test_valid_transitions():
    assert PaymentStateMachine.validate_transition(
        PaymentIntentStatus.REQUIRES_PAYMENT_METHOD, PaymentIntentStatus.PROCESSING
    ) is True
    assert PaymentStateMachine.validate_transition(
        PaymentIntentStatus.PROCESSING, PaymentIntentStatus.SUCCEEDED
    ) is True
    assert PaymentStateMachine.validate_transition(
        PaymentIntentStatus.SUCCEEDED, PaymentIntentStatus.REFUNDED
    ) is True

def test_invalid_transitions():
    with pytest.raises(PaymentStateError):
        PaymentStateMachine.validate_transition(
            PaymentIntentStatus.FAILED, PaymentIntentStatus.SUCCEEDED
        )
    with pytest.raises(PaymentStateError):
        PaymentStateMachine.validate_transition(
            PaymentIntentStatus.CANCELLED, PaymentIntentStatus.PROCESSING
        )
