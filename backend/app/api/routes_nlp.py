"""
NLP Extraction Endpoint (English & Bangla)
Points 11-12 in project specification
"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.data_pipeline.nlp_extractor import extract_crime_info

router = APIRouter(tags=["NLP Pipeline"])

class ExtractionRequest(BaseModel):
    text: str

@router.post("/nlp/extract")
def extract_incident_from_text(req: ExtractionRequest):
    """
    Accepts raw unstructured news headlines/reports in English or Bangla
    and extracts structured crime attributes.
    """
    result = extract_crime_info(req.text)
    return result
