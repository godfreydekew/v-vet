"""Decides what happens with each incoming WhatsApp message.

This is the only layer that uses both app.ai (model calls) and
app.services.whatsapp (sending messages), and that writes conversation
records to the database.
"""
