"""Pipeline orchestration for SMS analysis.

This module coordinates the agent stages as they are introduced.
"""

from ..schemas import AgentState
from .evidence_collector import collect_evidence
from .feature_extraction import observe_sms
from .investigator import Investigator
from .planner import LLMPlanner, Planner, RuleBasedPlanner, validate_planner_decision
from .risk_engine import build_risk_assessment
from .response_builder import ResponseBuilder
from .tool_executor import execute_planned_tools


def initialize_agent_state(raw_sms: str, source_timestamp: str | None = None) -> AgentState:
    return AgentState(raw_sms=raw_sms, source_timestamp=source_timestamp)


def run_observation_step(raw_sms: str, source_timestamp: str | None = None) -> AgentState:
    state = initialize_agent_state(raw_sms, source_timestamp=source_timestamp)
    return observe_sms(state)


def run_planning_step(state: AgentState, planner: Planner | None = None) -> AgentState:
    active_planner = planner or LLMPlanner()
    decision = active_planner.plan(state)
    state.planner_decision = validate_planner_decision(decision)
    return state


def run_decision_layer(
    raw_sms: str,
    planner: Planner | None = None,
    source_timestamp: str | None = None,
) -> AgentState:
    state = run_observation_step(raw_sms, source_timestamp=source_timestamp)
    return run_planning_step(state, planner=planner)


def run_tool_execution_step(state: AgentState) -> AgentState:
    return execute_planned_tools(state)


def run_execution_layer(
    raw_sms: str,
    planner: Planner | None = None,
    source_timestamp: str | None = None,
) -> AgentState:
    state = run_decision_layer(raw_sms, planner=planner, source_timestamp=source_timestamp)
    return run_tool_execution_step(state)


def run_evidence_collection_step(state: AgentState) -> AgentState:
    return collect_evidence(state)


def run_evidence_layer(
    raw_sms: str,
    planner: Planner | None = None,
    source_timestamp: str | None = None,
) -> AgentState:
    state = run_execution_layer(raw_sms, planner=planner, source_timestamp=source_timestamp)
    return run_evidence_collection_step(state)


def run_investigation_step(
    state: AgentState,
    investigator: Investigator | None = None,
) -> AgentState:
    active_investigator = investigator or Investigator()
    return active_investigator.investigate(state)


def run_investigation_layer(
    raw_sms: str,
    planner: Planner | None = None,
    investigator: Investigator | None = None,
    source_timestamp: str | None = None,
) -> AgentState:
    state = run_evidence_layer(raw_sms, planner=planner, source_timestamp=source_timestamp)
    return run_investigation_step(state, investigator=investigator)


def run_risk_engine_step(state: AgentState) -> AgentState:
    return build_risk_assessment(state)


def run_risk_engine_layer(
    raw_sms: str,
    planner: Planner | None = None,
    investigator: Investigator | None = None,
    source_timestamp: str | None = None,
) -> AgentState:
    state = run_investigation_layer(
        raw_sms,
        planner=planner,
        investigator=investigator,
        source_timestamp=source_timestamp,
    )
    return run_risk_engine_step(state)


def build_response(state: AgentState, builder: ResponseBuilder | None = None):
    active_builder = builder or ResponseBuilder()
    return active_builder.build_success_response(state)
