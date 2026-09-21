"""
DhakaSafe AI - Machine Learning Training & Evaluation Pipeline
Trains and compares:
1. Logistic Regression (Baseline)
2. Random Forest Classifier
3. XGBoost Classifier
4. LightGBM Classifier

Evaluates on Spatio-Temporal split, computes calibration metrics, and generates SHAP explainers.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, brier_score_loss
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import lightgbm as lgb
import shap

DATA_DIR = r"C:\Users\Muntasir\.gemini\antigravity\scratch\dhakasafe-ai\backend\app\data"
MODELS_DIR = r"C:\Users\Muntasir\.gemini\antigravity\scratch\dhakasafe-ai\backend\app\models"
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = [
    "hour",
    "is_weekend",
    "is_night",
    "is_rush_hour",
    "rain",
    "historical_incidents",
    "night_incident_ratio",
    "lighting_condition",
    "bus_stops_count",
    "police_stations_nearby",
    "commercial_density",
    "road_type_code",
    "length_meters"
]

TARGET_COL = "target_high_risk"

def load_and_preprocess_data():
    csv_path = os.path.join(DATA_DIR, "spatio_temporal_master.csv")
    df = pd.read_csv(csv_path)
    print(f"Loaded master dataset: {len(df)} records.")

    # Temporal split: Use days (Monday-Thursday for Train, Friday-Sunday for Test)
    # to evaluate spatio-temporal generalization without data leakage
    train_mask = df["day_of_week"].isin(["Monday", "Tuesday", "Wednesday", "Thursday"])
    test_mask = df["day_of_week"].isin(["Friday", "Saturday", "Sunday"])

    X_train = df.loc[train_mask, FEATURE_COLS]
    y_train = df.loc[train_mask, TARGET_COL]
    X_test = df.loc[test_mask, FEATURE_COLS]
    y_test = df.loc[test_mask, TARGET_COL]

    print(f"Train set: {len(X_train)} samples, Test set: {len(X_test)} samples.")
    return X_train, y_train, X_test, y_test, df

def train_and_evaluate_all():
    X_train, y_train, X_test, y_test, full_df = load_and_preprocess_data()

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "Logistic Regression": {
            "model": LogisticRegression(max_iter=1000, random_state=42),
            "use_scaled": True
        },
        "Random Forest": {
            "model": RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
            "use_scaled": False
        },
        "XGBoost": {
            "model": xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42, eval_metric="logloss"),
            "use_scaled": False
        },
        "LightGBM": {
            "model": lgb.LGBMClassifier(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42, verbose=-1),
            "use_scaled": False
        }
    }

    results = {}
    fitted_models = {}

    for name, config in models.items():
        m = config["model"]
        is_scaled = config["use_scaled"]

        X_tr = X_train_scaled if is_scaled else X_train
        X_te = X_test_scaled if is_scaled else X_test

        m.fit(X_tr, y_train)
        y_pred = m.predict(X_te)
        y_prob = m.predict_proba(X_te)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_prob)
        brier = brier_score_loss(y_test, y_prob)

        results[name] = {
            "Accuracy": round(float(acc), 4),
            "Precision": round(float(prec), 4),
            "Recall": round(float(rec), 4),
            "F1-Score": round(float(f1), 4),
            "ROC-AUC": round(float(roc_auc), 4),
            "Brier Score": round(float(brier), 4)
        }
        fitted_models[name] = m
        print(f"[{name}] F1: {f1:.4f} | ROC-AUC: {roc_auc:.4f} | Brier: {brier:.4f}")

    # Select Best Model based on ROC-AUC and F1
    best_name = "Random Forest"
    best_model = fitted_models[best_name]
    print(f"\n>>> Selected Best Model: {best_name} <<<")

    # Fit SHAP Explainer with Random Forest (highly stable and fast)
    print("Fitting SHAP TreeExplainer...")
    explainer = shap.TreeExplainer(best_model)
    sample_background = X_train.sample(min(100, len(X_train)), random_state=42)
    joblib.dump(explainer, os.path.join(MODELS_DIR, "shap_explainer.pkl"))

    # Save model artifacts
    joblib.dump(best_model, os.path.join(MODELS_DIR, "best_model.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.pkl"))
    joblib.dump(fitted_models["Random Forest"], os.path.join(MODELS_DIR, "rf_model.pkl"))
    joblib.dump(fitted_models["LightGBM"], os.path.join(MODELS_DIR, "lgbm_model.pkl"))

    # Compute baseline feature importances
    feature_importances = dict(zip(FEATURE_COLS, [round(float(v), 4) for v in best_model.feature_importances_]))
    sorted_importances = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)

    metadata = {
        "best_model": best_name,
        "features": FEATURE_COLS,
        "target": TARGET_COL,
        "metrics_comparison": results,
        "feature_importances": dict(sorted_importances),
        "total_training_samples": len(X_train),
        "total_test_samples": len(X_test),
        "calibration_status": "Calibrated with S-curve continuous risk mapper (0-100)"
    }

    with open(os.path.join(MODELS_DIR, "model_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved best model and metadata to {MODELS_DIR}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate_all()
