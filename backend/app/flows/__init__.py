from app.flows.base import BaseFlow
from app.flows.register_animal import RegisterAnimalFlow
from app.flows.report_sickness import ReportSicknessFlow

# Registry — maps flow_token (or intent ID) → flow handler instance.
FLOW_REGISTRY: dict[str, BaseFlow] = {
    RegisterAnimalFlow.flow_id: RegisterAnimalFlow(),
    ReportSicknessFlow.flow_id: ReportSicknessFlow(),
}
