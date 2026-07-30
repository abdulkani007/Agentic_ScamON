# sms_agent_package

Standalone handoff package for the SMS analysis agent.

## Install

```bash
pip install -r requirements.txt
```

Or install the package directly:

```bash
pip install .
```

## Use

```python
from sms_agent import SMSAgent

agent = SMSAgent()
result = agent.analyze(
    sender="VM-SBI",
    message="Your account is blocked. Visit https://sbi-login.xyz",
    timestamp="2026-07-29T10:30:00+05:30",
)

print(result.model_dump())
```

## What to import

Your friend should only import:

```python
from sms_agent import SMSAgent
```

Everything else stays internal to the package.

## Quick Test

Run the included smoke test from inside `sms_agent_package`:

```bash
python test_package.py
```

## Environment

If your friend wants live LLM reasoning, they should set:

```bash
GROQ_API_KEY=their_api_key_here
```

If the key is missing, the agent still works with its fallback logic.

## What this package includes

- Observation
- Planner
- Tool execution
- Evidence collection
- Investigation
- Risk scoring
- Response building

The public entry point is only:

```python
from sms_agent import SMSAgent
```
