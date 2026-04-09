from fastapi import FastAPI
from pydantic import BaseModel
import spacy
from collections import defaultdict

app = FastAPI(title="AI Complaint Analyzer", version="1.0.0")

sentiment_model = None
classifier_model = None

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = spacy.blank("en")

department_map = {
    "traffic": "Police",
    "water": "Water Department",
    "electricity": "Electricity Board",
    "medical": "Health Department",
    "lost_and_found": "Security",
    "sanitation": "Municipal Corporation",
}

priority_keywords = {
    "high": ["urgent", "help", "stuck", "missing", "lost child", "ambulance", "outage", "blackout", "fainted"],
    "medium": ["delay", "not working", "not cleaned", "overflowing", "cut", "blocked"],
}

known_locations = [
    "Panchavati",
    "Ramkund",
    "main ghat",
    "sector A",
    "sector B",
    "tent city",
    "Godavari",
]

category_keywords = {
    "traffic": ["traffic", "jam", "road blocked", "signal", "congestion"],
    "water": ["water", "tap", "drinking water", "tanker", "supply cut"],
    "electricity": ["power", "electricity", "outage", "blackout", "streetlights"],
    "medical": ["medical", "doctor", "ambulance", "fainted", "health"],
    "lost_and_found": ["lost", "missing", "stolen", "found", "child"],
    "sanitation": ["garbage", "cleaning", "dustbin", "toilet", "waste"],
}

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    isComplaint: bool
    category: str
    department: str
    priority: str
    locationName: str
    confidence: float
    reviewRecommendation: str


class FeedbackRequest(BaseModel):
    text: str
    predictedCategory: str
    correctedCategory: str
    predictedPriority: str
    correctedPriority: str
    note: str | None = None


feedback_store = []


def extract_location(text: str) -> str:
    lowered = text.lower()
    for loc in known_locations:
        if loc.lower() in lowered:
            return loc

    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ["GPE", "LOC", "FAC"]:
            return ent.text

    return "Unknown"


def detect_priority(text: str, is_complaint: bool) -> str:
    lowered = text.lower()
    for keyword in priority_keywords["high"]:
        if keyword in lowered:
            return "high"

    for keyword in priority_keywords["medium"]:
        if keyword in lowered:
            return "medium"

    return "medium" if is_complaint else "low"


def infer_category_rule_based(text: str) -> str:
    lowered = text.lower()
    score = defaultdict(int)

    for category, words in category_keywords.items():
        for word in words:
            if word in lowered:
                score[category] += 1

    if not score:
        return "sanitation"

    return max(score, key=score.get)


def infer_confidence(text: str, category: str) -> float:
    lowered = text.lower()
    hits = sum(1 for token in category_keywords.get(category, []) if token in lowered)
    if hits >= 3:
        return 0.92
    if hits == 2:
        return 0.82
    if hits == 1:
        return 0.66
    return 0.54


def infer_sentiment_complaint(text: str) -> bool:
    lowered = text.lower()
    complaint_tokens = [
        "no ",
        "not ",
        "lost",
        "stuck",
        "outage",
        "garbage",
        "help",
        "missing",
        "delay",
        "blocked",
        "overflowing",
    ]

    if sentiment_model is not None:
        try:
            sentiment = sentiment_model(text)[0]
            label = str(sentiment.get("label", "")).lower()
            score = float(sentiment.get("score", 0))
            model_negative = ("negative" in label or "1 star" in label) and score > 0.45
            if model_negative:
                return True
        except Exception:
            pass

    return any(token in lowered for token in complaint_tokens)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "rule_based", "feedbackCount": len(feedback_store)}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    text = req.text.strip()
    if not text:
        return {
            "isComplaint": False,
            "category": "sanitation",
            "department": "Municipal Corporation",
            "priority": "low",
            "locationName": "Unknown",
            "confidence": 0.51,
            "reviewRecommendation": "needs_review",
        }

    is_complaint = infer_sentiment_complaint(text)

    category = infer_category_rule_based(text)
    department = department_map.get(category, "General Administration")

    location = extract_location(text)
    priority = detect_priority(text, is_complaint)
    confidence = infer_confidence(text, category)
    review_recommendation = "needs_review" if confidence < 0.6 else "auto_approve"

    return {
        "isComplaint": bool(is_complaint),
        "category": category,
        "department": department,
        "priority": priority,
        "locationName": location,
        "confidence": confidence,
        "reviewRecommendation": review_recommendation,
    }


@app.post("/feedback")
def feedback(req: FeedbackRequest):
    payload = req.model_dump()
    payload["createdAt"] = str(__import__("datetime").datetime.utcnow())
    feedback_store.append(payload)
    return {"message": "feedback_saved", "count": len(feedback_store)}
