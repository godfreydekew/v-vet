from app.flows.base import BaseFlow
from app.flows.my_animals import MyAnimalsFlow
from app.flows.record_death import RecordDeathFlow
from app.flows.register_animal import RegisterAnimalFlow
from app.flows.report_sickness import ReportSicknessFlow

# Registry — maps flow_token (or intent ID) → flow handler instance.
FLOW_REGISTRY: dict[str, BaseFlow] = {
    RegisterAnimalFlow.flow_id: RegisterAnimalFlow(),
    ReportSicknessFlow.flow_id: ReportSicknessFlow(),
    MyAnimalsFlow.flow_id: MyAnimalsFlow(),
    RecordDeathFlow.flow_id: RecordDeathFlow(),
}
