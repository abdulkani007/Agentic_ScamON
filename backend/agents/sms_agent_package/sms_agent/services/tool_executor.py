from __future__ import annotations

from collections.abc import Callable

from ..schemas import AgentState, ToolExecutionResult
from .tools import (
    run_organization_verification,
    run_sender_reputation,
    run_website_verification,
)

ToolHandler = Callable[[AgentState], ToolExecutionResult]

TOOL_REGISTRY: dict[str, ToolHandler] = {
    "sender_reputation": run_sender_reputation,
    "organization_verification": run_organization_verification,
    "website_verification": run_website_verification,
}


def execute_planned_tools(state: AgentState) -> AgentState:
    for tool_name in state.planner_decision.required_tools:
        handler = TOOL_REGISTRY.get(tool_name)

        if handler is None:
            state.tool_results[tool_name] = ToolExecutionResult(
                tool=tool_name,
                status="failed",
                data={},
                metadata={"reason": "Tool is not registered for execution."},
            )
            continue

        try:
            result = handler(state)
        except Exception as exc:
            result = ToolExecutionResult(
                tool=tool_name,
                status="failed",
                data={},
                metadata={"reason": f"Tool execution failed: {exc}"},
            )

        state.tool_results[tool_name] = result
    return state
