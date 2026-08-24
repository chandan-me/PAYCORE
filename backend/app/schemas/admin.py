from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class SystemHealthResponse(BaseModel):
    status: str = "HEALTHY"
    database: str = "CONNECTED"
    redis: str = "CONNECTED"
    sandbox_provider: str = "ACTIVE"
    worker_queue: str = "HEALTHY"
    timestamp: datetime

class AuditLogResponse(BaseModel):
    id: str
    actor_id: str
    actor_type: str
    action: str
    resource_type: str
    resource_id: str
    metadata_json: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReconciliationReport(BaseModel):
    total_paycore_transactions: int
    total_provider_transactions: int
    matched_transactions: int
    mismatched_transactions: int
    missing_in_provider: List[str]
    missing_in_paycore: List[str]
    status: str  # BALANCED, MISMATCH_DETECTED
