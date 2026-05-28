from ai.orchestrator import next_state, STATES


def test_state_order_starts_with_purpose():
    assert STATES[0] == "ask_purpose"


def test_next_state_advances():
    assert next_state("ask_purpose") == "ask_highlight"
    assert next_state("ask_highlight") == "ask_style"


def test_next_state_terminates_at_done():
    assert next_state("ask_identity") == "done"
    assert next_state("done") == "done"


def test_unknown_state_resets_to_first():
    assert next_state("garbage") == "ask_purpose"
