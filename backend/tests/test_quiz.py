import pytest
from quiz_graph import start_quiz, submit_answer, QuizState

def test_start_quiz():
    result = start_quiz("Python", "Easy", 2)
    assert result['total_questions'] == 2
    assert result['current_question'] is not None
    assert result['score'] == 0

def test_submit_answer():
    state = start_quiz("Python", "Easy", 2)
    state['user_answer'] = 'A'
    
    from quiz_graph import evaluate_answer
    result = evaluate_answer(state)
    
    assert 'score' in result
    assert 'feedback' in result