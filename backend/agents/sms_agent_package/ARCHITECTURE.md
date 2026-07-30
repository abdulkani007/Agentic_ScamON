# SMS Agent Architecture

## Overview

`SMSAgent` is a reusable SMS analysis sub-agent. It analyzes one SMS at a time and returns a structured analysis result for a larger supervisor or multi-agent system.

The package is designed as a black box:

```python
from sms_agent import SMSAgent

agent = SMSAgent()
result = agent.analyze(sender, message, timestamp=None)
```

## Internal Flow

```text
SMSAgent.analyze()
  -> Observation
  -> Planner
  -> Tool Executor
  -> Evidence Collector
  -> Investigator
  -> Risk Engine
  -> Response Builder
  -> AnalysisResponse
```

## Stage Responsibilities

- Observation: normalizes the SMS and extracts features such as sender, organization, URLs, intents, entities, and keywords.
- Planner: decides which tools should run.
- Tool Executor: runs only registered tools.
- Evidence Collector: combines extracted features, planner output, and tool output into one evidence package.
- Investigator: interprets evidence and produces a structured reasoning result.
- Risk Engine: converts evidence and investigation output into a final risk assessment.
- Response Builder: converts the final internal state into the public response schema.

## Public Boundary

Only this interface should be used by outside systems:

```python
from sms_agent import SMSAgent
```

Do not import internal classes such as `Planner`, `Investigator`, `RiskEngine`, or `ToolExecutor` from the supervisor project.

## Notes

- The agent analyzes one SMS per call.
- If `GROQ_API_KEY` is available, the investigator can use live LLM reasoning.
- If the key is missing, the package still works with fallback behavior.
- The package is standalone and does not depend on the original `backend/` folder.

