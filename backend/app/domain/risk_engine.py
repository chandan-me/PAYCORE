from typing import Dict, Any, List, Tuple

class RiskEvaluation:
    def __init__(self, score: int, level: str, triggered_rules: List[str]):
        self.score = score
        self.level = level  # LOW, MEDIUM, HIGH, BLOCKED
        self.triggered_rules = triggered_rules

class RiskEngine:
    """
    Extensible rule-based Risk & Fraud Evaluation Engine.
    """

    @classmethod
    def evaluate_payment(
        cls,
        amount: int,
        currency: str,
        customer_email: str,
        ip_address: str = "127.0.0.1",
        payment_method_type: str = "CARD",
        card_number: str = ""
    ) -> RiskEvaluation:
        score = 0
        triggered_rules = []

        # Rule 1: High Amount Check (Amount > ₹100,000 / $1,000)
        HIGH_AMOUNT_THRESHOLD = 10_000_000  # 10,000,000 paise = ₹100,000
        if amount > HIGH_AMOUNT_THRESHOLD:
            score += 35
            triggered_rules.append(f"HIGH_AMOUNT_EXCEEDED: amount {amount} > threshold {HIGH_AMOUNT_THRESHOLD}")

        # Rule 2: Suspicious Email domain or test pattern
        if "fraud" in customer_email.lower() or "suspicious" in customer_email.lower():
            score += 50
            triggered_rules.append("SUSPICIOUS_CUSTOMER_EMAIL_PATTERN")

        # Rule 3: Test card error simulation check
        if card_number and card_number.endswith("9999"):
            score += 90
            triggered_rules.append("KNOWN_FRAUD_CARD_PATTERN")

        # Determine level
        if score >= 80:
            level = "BLOCKED"
        elif score >= 50:
            level = "HIGH"
        elif score >= 20:
            level = "MEDIUM"
        else:
            level = "LOW"

        return RiskEvaluation(score=score, level=level, triggered_rules=triggered_rules)
