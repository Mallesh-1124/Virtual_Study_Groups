"""
AI Service — Gemini-powered AI teacher, session summaries, and quiz generation.
"""
import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ─── Gemini Setup ────────────────────────────────────────────

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

_model = None

def get_model():
    """Lazy-load the Gemini model."""
    global _model
    if _model is None:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel('gemini-2.5-flash')
    return _model


def call_gemini(prompt, max_tokens=2048):
    """Call Gemini API with a prompt and return text response."""
    try:
        model = get_model()
        response = model.generate_content(
            prompt,
            generation_config={
                'max_output_tokens': max_tokens,
                'temperature': 0.7,
            }
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return f"I'm sorry, I encountered an issue processing your request. Please try again. (Error: {str(e)[:100]})"


# ─── AI Teacher ──────────────────────────────────────────────

def ask_ai_teacher(question, room, recent_messages=None):
    """
    Generate an AI teacher response using Gemini.
    Uses room settings (subject, teaching style, difficulty) and recent chat context.
    """
    # Build context from recent messages
    chat_context = ""
    if recent_messages:
        chat_lines = []
        for msg in recent_messages[-10:]:  # Last 10 messages for context
            sender = "AI Teacher" if msg.is_ai else (msg.user.username if msg.user else "Unknown")
            chat_lines.append(f"{sender}: {msg.content[:200]}")
        chat_context = "\n".join(chat_lines)

    # Teaching style instructions
    style_instructions = {
        'guided': "Guide the student step-by-step. Give hints and ask guiding questions rather than direct answers. Encourage them to think through the problem.",
        'direct': "Provide clear, direct explanations and answers. Be thorough but concise. Include formulas, definitions, and examples where relevant.",
        'socratic': "Use the Socratic method — ask probing questions to help the student discover the answer themselves. Never give the answer directly.",
    }

    difficulty_instructions = {
        'easy': "Keep explanations simple and beginner-friendly. Use everyday analogies. Avoid jargon.",
        'medium': "Balance clarity with depth. Use proper terminology but explain it. Include some worked examples.",
        'hard': "Provide rigorous, detailed explanations. Challenge the student with follow-up problems. Use advanced terminology.",
    }

    prompt = f"""You are an AI Teacher Assistant in a virtual study room.

SUBJECT: {room.subject or 'General'}
TEACHING STYLE: {style_instructions.get(room.ai_teaching_style, style_instructions['guided'])}
DIFFICULTY LEVEL: {difficulty_instructions.get(room.ai_difficulty, difficulty_instructions['medium'])}
ADMIN INSTRUCTIONS: {room.ai_instructions or 'Help students learn effectively.'}

{"RECENT CHAT CONTEXT:" + chr(10) + chat_context if chat_context else ""}

STUDENT QUESTION: {question}

Respond as a helpful, encouraging teacher. Use markdown formatting (bold, lists, code blocks) where appropriate. 
Keep your response focused and under 300 words unless the topic requires more detail.
If the question is about a math/science problem, show your work step by step.
End with an encouraging note or a follow-up question to keep the student engaged."""

    return call_gemini(prompt)


# ─── Session Summary ─────────────────────────────────────────

def generate_session_summary(room, messages):
    """
    Generate an AI-powered summary of the study session.
    """
    if not messages:
        return {
            'summary': 'No messages in this session yet.',
            'key_topics': [],
            'key_takeaways': [],
            'questions_asked': 0,
            'ai_responses': 0,
        }

    # Build conversation log
    conversation_lines = []
    questions_count = 0
    ai_count = 0
    for msg in messages:
        sender = "AI Teacher" if msg.is_ai else (msg.user.username if msg.user else "Unknown")
        conversation_lines.append(f"[{sender}]: {msg.content[:300]}")
        if msg.is_ai:
            ai_count += 1
        elif not msg.is_ai and '?' in msg.content:
            questions_count += 1

    conversation_text = "\n".join(conversation_lines[-50:])  # Last 50 messages

    prompt = f"""Analyze this study session conversation and generate a structured summary.

SUBJECT: {room.subject or 'General'}
ROOM: {room.name}

CONVERSATION:
{conversation_text}

Generate a JSON response with this EXACT structure (no markdown code blocks, just raw JSON):
{{
    "summary": "A 2-3 sentence overview of what was discussed in this study session.",
    "key_topics": ["Topic 1", "Topic 2", "Topic 3"],
    "key_takeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
    "study_tips": ["Actionable study tip 1", "Actionable study tip 2"],
    "difficulty_assessment": "How well the students seem to understand the material (beginner/intermediate/advanced)",
    "suggested_next_topics": ["Next topic 1", "Next topic 2"]
}}

Return ONLY valid JSON, no other text."""

    response_text = call_gemini(prompt, max_tokens=1024)

    # Parse JSON response
    try:
        # Clean up response — remove markdown code fences if present
        cleaned = response_text.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('\n', 1)[1] if '\n' in cleaned else cleaned[3:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        result = json.loads(cleaned)
        result['questions_asked'] = questions_count
        result['ai_responses'] = ai_count
        result['total_messages'] = len(messages)
        return result
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Failed to parse summary JSON: {e}")
        return {
            'summary': response_text[:500],
            'key_topics': [],
            'key_takeaways': [],
            'study_tips': [],
            'questions_asked': questions_count,
            'ai_responses': ai_count,
            'total_messages': len(messages),
        }


# ─── Quiz Generation ─────────────────────────────────────────

def generate_quiz(room, messages, num_questions=5):
    """
    Generate a quiz based on the study session content.
    """
    # Build context from chat
    conversation_lines = []
    for msg in messages[-30:]:
        sender = "AI Teacher" if msg.is_ai else (msg.user.username if msg.user else "Unknown")
        conversation_lines.append(f"[{sender}]: {msg.content[:200]}")

    conversation_text = "\n".join(conversation_lines) if conversation_lines else "No conversation yet."

    prompt = f"""Generate a quiz for students based on this study session.

SUBJECT: {room.subject or 'General Studies'}
ROOM: {room.name}
DIFFICULTY: {room.ai_difficulty}

STUDY SESSION CONTEXT:
{conversation_text}

Generate {num_questions} multiple-choice questions. Return a JSON response with this EXACT structure (no markdown code blocks, just raw JSON):
{{
    "quiz_title": "Quiz title based on the topic",
    "questions": [
        {{
            "id": 1,
            "question": "The question text",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            "correct_answer": "A",
            "explanation": "Why this is the correct answer and why others are wrong"
        }}
    ]
}}

Make questions that test understanding, not just memorization.
Include a mix of easy and challenging questions.
If there isn't enough context, generate questions about the subject "{room.subject or 'General Studies'}" in general.
Return ONLY valid JSON, no other text."""

    response_text = call_gemini(prompt, max_tokens=2048)

    try:
        cleaned = response_text.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('\n', 1)[1] if '\n' in cleaned else cleaned[3:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        result = json.loads(cleaned)
        return result
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Failed to parse quiz JSON: {e}")
        return {
            'quiz_title': f'{room.subject or "General"} Quiz',
            'questions': [],
            'error': f'Failed to generate quiz: {str(e)[:100]}',
            'raw_response': response_text[:500],
        }


def evaluate_quiz_answers(quiz_data, user_answers):
    """
    Evaluate user's quiz answers and generate feedback.
    quiz_data: the original quiz JSON
    user_answers: dict of {question_id: selected_answer}
    """
    results = []
    correct_count = 0
    total = len(quiz_data.get('questions', []))

    for q in quiz_data.get('questions', []):
        qid = q['id']
        user_answer = user_answers.get(str(qid), '')
        is_correct = user_answer.upper() == q['correct_answer'].upper()
        if is_correct:
            correct_count += 1

        results.append({
            'id': qid,
            'question': q['question'],
            'your_answer': user_answer,
            'correct_answer': q['correct_answer'],
            'is_correct': is_correct,
            'explanation': q.get('explanation', ''),
        })

    score_percent = round((correct_count / total * 100) if total > 0 else 0)

    # Generate encouraging feedback
    if score_percent >= 90:
        feedback = "🌟 Outstanding! You've mastered this material!"
    elif score_percent >= 70:
        feedback = "👏 Great job! You have a solid understanding. Review the missed questions to strengthen your knowledge."
    elif score_percent >= 50:
        feedback = "📚 Good effort! You're on the right track. Focus on the topics you missed and try again."
    else:
        feedback = "💪 Keep studying! Review the explanations carefully and don't hesitate to ask the AI Teacher for help."

    return {
        'score': correct_count,
        'total': total,
        'percentage': score_percent,
        'feedback': feedback,
        'results': results,
    }
