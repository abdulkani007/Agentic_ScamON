# SMS Agent Dependency Map

## Public Entry Point

- `sms_agent/__init__.py`
- `sms_agent/agent.py`

## Core Flow

- `sms_agent/services/feature_extraction.py`
- `sms_agent/services/planner.py`
- `sms_agent/services/tool_executor.py`
- `sms_agent/services/evidence_collector.py`
- `sms_agent/services/investigator.py`
- `sms_agent/services/risk_engine.py`
- `sms_agent/services/response_builder.py`
- `sms_agent/services/sms_pipeline.py`

## Tools

- `sms_agent/services/tools/sender_reputation.py`
- `sms_agent/services/tools/organization_verification.py`
- `sms_agent/services/tools/website_verification.py`

## LLM Integration

- `sms_agent/services/llm/groq_client.py`

## Schemas

- `sms_agent/schemas/agent_state.py`
- `sms_agent/schemas/api_request.py`
- `sms_agent/schemas/api_response.py`

## Configuration and Data

- `sms_agent/core/config.py`
- `sms_agent/prompts/planner_prompt.txt`
- `sms_agent/prompts/investigation_prompt.txt`
- `sms_agent/prompts/risk_config.json`
- `sms_agent/datasets/trusted_senders.json`
- `sms_agent/datasets/organizations.json`
- `sms_agent/datasets/official_domains.json`

## External Dependencies

- `pydantic`
- `httpx`
- `python-dotenv`
- `groq`

