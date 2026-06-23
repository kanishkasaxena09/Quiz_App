from typing import TypedDict, List, Optional
import json
import re
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
import os
from dotenv import load_dotenv

load_dotenv()

# ==================== STATE ====================
class QuizState(TypedDict):
    topic: str
    difficulty: str
    num_questions: int
    current_index: int
    score: int
    questions: List[dict]
    user_answer: Optional[str]
    quiz_complete: bool
    feedback: Optional[str]
    step: str

# ==================== LLM ====================
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=2048,
    api_key=os.getenv("GROQ_API_KEY")
)

# ==================== HELPERS ====================
def parse_questions(text: str) -> List[dict]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError("Could not parse questions from LLM response")

# ==================== GRAPH NODES ====================
def generate_questions(state: QuizState):
    prompt = f"""Generate {state['num_questions']} {state['difficulty']} difficulty quiz questions about {state['topic']}.
    
    Return ONLY a JSON array:
    [
        {{
            "question": "What is...?",
            "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
            "correct_answer": "A",
            "explanation": "Brief explanation"
        }}
    ]"""

    response = llm.invoke([
        SystemMessage(content="You are a quiz generator. Return only valid JSON."),
        HumanMessage(content=prompt)
    ])

    questions = parse_questions(response.content)

    return {
        "questions": questions,
        "current_index": 0,
        "score": 0,
        "quiz_complete": False,
        "feedback": None,
        "user_answer": None,
        "step": "present"
    }

def present_question(state: QuizState):
    user_answer = state.get('user_answer')
    
    if user_answer is None or str(user_answer).strip() == "":
        return {
            "step": "present",
            "feedback": None
        }
    
    return {
        "step": "evaluate"
    }

def evaluate_answer(state: QuizState):
    user_ans_raw = state.get('user_answer')
    
    if user_ans_raw is None:
        user_ans = ""
    else:
        user_ans = str(user_ans_raw).strip().upper()
    
    current_q = state['questions'][state['current_index']]
    correct_ans = str(current_q['correct_answer']).strip().upper()

    if not user_ans or user_ans not in ['A', 'B', 'C', 'D']:
        is_correct = False
    else:
        is_correct = user_ans == correct_ans
    
    new_score = state['score'] + (1 if is_correct else 0)

    feedback = f"{'Correct!' if is_correct else 'Wrong!'}\n\n"
    feedback += f"Your answer: {user_ans}\n"
    feedback += f"Correct answer: {correct_ans}\n\n"
    feedback += f"Explanation: {current_q['explanation']}"

    return {
        "score": new_score,
        "feedback": feedback,
        "step": "check"
    }

def check_completion(state: QuizState):
    next_index = state['current_index'] + 1
    is_complete = next_index >= len(state['questions'])

    if is_complete:
        return {
            "quiz_complete": True,
            "step": "end"
        }
    
    return {
        "current_index": next_index,
        "user_answer": None,
        "step": "present"
    }

def end_quiz(state: QuizState):
    total = len(state['questions'])
    score = state['score']
    percentage = (score / total) * 100 if total > 0 else 0

    return {
        "feedback": f"Quiz Complete! Score: {score}/{total} ({percentage:.1f}%)",
        "step": "end"
    }

# ==================== GRAPH BUILDER ====================
def create_quiz_graph():
    workflow = StateGraph(QuizState)

    workflow.add_node("generate", generate_questions)
    workflow.add_node("present", present_question)
    workflow.add_node("evaluate", evaluate_answer)
    workflow.add_node("check", check_completion)
    workflow.add_node("end", end_quiz)

    workflow.set_entry_point("generate")
    workflow.add_edge("generate", "present")
    
    def present_router(state: QuizState):
        user_ans = state.get('user_answer')
        if user_ans is not None and str(user_ans).strip() != "":
            return "evaluate"
        return "wait"
    
    workflow.add_conditional_edges(
        "present",
        present_router,
        {
            "evaluate": "evaluate",
            "wait": END
        }
    )
    
    workflow.add_edge("evaluate", "check")
    
    def check_router(state: QuizState):
        if state['quiz_complete']:
            return "end"
        return "present"
    
    workflow.add_conditional_edges(
        "check",
        check_router,
        {
            "present": "present",
            "end": "end"
        }
    )
    
    workflow.add_edge("end", END)

    return workflow.compile()

quiz_graph = create_quiz_graph()

# ==================== API FUNCTIONS (for FastAPI/Flask) ====================
def start_quiz(topic: str, difficulty: str, num_questions: int):
    """Start a new quiz session"""
    initial_state = QuizState(
        topic=topic,
        difficulty=difficulty,
        num_questions=num_questions,
        current_index=0,
        score=0,
        questions=[],
        user_answer=None,
        quiz_complete=False,
        feedback=None,
        step="generate"
    )
    
    result = quiz_graph.invoke(initial_state)
    return {
        "session_id": id(result),  # In production, use UUID
        "questions": result['questions'],
        "current_index": result['current_index'],
        "total_questions": len(result['questions']),
        "score": result['score'],
        "quiz_complete": result['quiz_complete'],
        "current_question": result['questions'][0] if result['questions'] else None
    }

def submit_answer(session_state: dict, answer: str):
    """Submit an answer and get feedback"""
    # Set answer
    session_state['user_answer'] = answer
    
    # Evaluate
    eval_result = evaluate_answer(session_state)
    session_state.update(eval_result)
    
    # Check completion
    completion_result = check_completion(session_state)
    session_state.update(completion_result)
    
    response = {
        "feedback": session_state['feedback'],
        "score": session_state['score'],
        "quiz_complete": session_state['quiz_complete'],
        "is_correct": "Correct!" in session_state['feedback']
    }
    
    if session_state['quiz_complete']:
        end_result = end_quiz(session_state)
        session_state.update(end_result)
        response['final_result'] = session_state['feedback']
    else:
        # Present next question
        present_result = present_question(session_state)
        session_state.update(present_result)
        response['next_question'] = session_state['questions'][session_state['current_index']]
        response['current_index'] = session_state['current_index'] + 1
        response['total_questions'] = len(session_state['questions'])
    
    return response, session_state

def get_next_question(session_state: dict):
    """Get next question after feedback"""
    if session_state['quiz_complete']:
        return {
            "quiz_complete": True,
            "final_result": session_state.get('feedback', '')
        }
    
    return {
        "question": session_state['questions'][session_state['current_index']],
        "current_index": session_state['current_index'],
        "total_questions": len(session_state['questions']),
        "score": session_state['score']
    }

# ==================== SIMPLE TEST ====================
if __name__ == "__main__":
    print("Testing Quiz Backend...")
    result = start_quiz("Python Programming", "Medium", 3)
    print(f"Started quiz with {result['total_questions']} questions")
    print(f"Q1: {result['current_question']['question']}")