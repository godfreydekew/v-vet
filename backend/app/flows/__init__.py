from app.flows.register_animal import RegisterAnimalFlow

# Registry — maps flow_token → flow handler instance.
FLOW_REGISTRY: dict[str, "RegisterAnimalFlow"] = {
    RegisterAnimalFlow.flow_id: RegisterAnimalFlow(),
}
