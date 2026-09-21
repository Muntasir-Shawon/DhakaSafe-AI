"""
DhakaSafe AI - Core Configuration and Responsible AI Ethics Framework
Implements Points 45-48 of project specification:
- Ethical considerations (no demographic profiling, no neighborhood criminalization)
- Reported crime != Actual crime limitation acknowledgement
- News reporting bias disclosure
"""

PROJECT_NAME = "DhakaSafe AI"
VERSION = "1.0.0"
API_PREFIX = "/api"

ETHICS_DISCLOSURE = {
    "project_title": "DhakaSafe AI: Spatio-Temporal Street Theft Risk Prediction & Safer Routing",
    "ethical_design_principles": [
        "Focus on road infrastructure, lighting, time window, and historical reported theft events rather than demographic profiling.",
        "Strict non-use of ethnicity, religion, nationality, socioeconomic status, or individual identities in risk calculation.",
        "Predicts 'theft risk intensity' for navigation safety, never labels neighborhoods as 'criminal' or people as 'dangerous'."
    ],
    "scientific_limitations": {
        "reporting_gap": "Reported crime does not equal all actual crime. Certain areas or affluent victims have higher reporting rates, while marginalized communities face under-reporting.",
        "media_bias": "News media reports disproportionately cover commercial and arterial hotspots (e.g., Farmgate, Dhanmondi) compared to outlying peripheral zones.",
        "probabilistic_nature": "Predictions communicate statistical correlation with reported incident density and contextual road factors; they are not deterministic ground truth."
    },
    "guidance_for_users": "DhakaSafe AI is an urban safety decision-support tool designed to provide risk-aware route alternatives. Always exercise personal situational awareness."
}
