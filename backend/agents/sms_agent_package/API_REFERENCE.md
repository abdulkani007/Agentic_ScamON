# SMS Agent API Reference

## Public Import

```python
from sms_agent import SMSAgent
```

## Public Method

```python
SMSAgent.analyze(sender, message, timestamp=None)
```

### Parameters

- `sender`: SMS sender ID or phone number.
- `message`: SMS body text.
- `timestamp`: Optional timestamp string.

### Returns

An `AnalysisResponse` object with the following top-level shape:

```json
{
  "agent": "sms_agent",
  "version": "1.0.0",
  "status": "success",
  "error": null,
  "sms": {},
  "analysis": {},
  "planner": {},
  "investigation": {},
  "tool_results": [],
  "social_engineering": [],
  "evidence": {},
  "metadata": {}
}
```

## Response Fields

- `agent`: fixed agent name.
- `version`: package version.
- `status`: success or error status.
- `error`: error message when the analysis fails.
- `sms`: original SMS inputs passed into the agent.
- `analysis`: final classification, score, severity, confidence, summary, and recommendation.
- `planner`: selected tools and planner reason.
- `investigation`: LLM reasoning summary.
- `tool_results`: structured results from each executed tool.
- `social_engineering`: detected manipulation techniques.
- `evidence`: evidence package used for reasoning.
- `metadata`: analysis ID, timestamp, execution time, and tools used.

## Configuration

If you want live LLM reasoning:

```bash
GROQ_API_KEY=your_key_here
```

If the key is absent, the agent still runs using fallback behavior.

