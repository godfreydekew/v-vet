"""The WhatsApp assistant: everything that decides how V-Vet replies to a farmer.

Shared by both agents: client.py (OpenAI calls), router.py (which agent handles a
message), state.py (what the farmer is doing), messaging.py (saving and sending).

guest/   farmers who haven't finished onboarding
farmer/  onboarded farmers (to come)

In each agent, the files that call the model only return results; agent.py decides
what to send and what to save.
"""
