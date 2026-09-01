"""
Cascade engine: chains hazards instead of treating them as independent classifiers.
6-stage cascade: Precursors → Hazard → Precipitation → Runoff → Exposure → Response
"""
import numpy as np
from typing import Dict
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import ALERT_THRESHOLDS, CAPE_THRESHOLDS, IWV_RATE_THRESHOLD, CONVERGENCE_THRESHOLD


def compute_convective_initiation_score(features: dict) -> np.ndarray:
    """Stage 1: Score atmospheric precursors for convective initiation."""
    cape = features.get("cape", np.zeros((32, 32)))
    cin = features.get("cin", np.zeros((32, 32)))
    iwv_rate = features.get("iwv_rate", np.zeros((32, 32)))
    convergence = features.get("convergence", np.zeros((32, 32)))
    shear = features.get("wind_shear", np.zeros((32, 32)))

    # Normalize each to 0-1 range
    cape_score = np.clip(cape / CAPE_THRESHOLDS["extreme"], 0, 1)
    cin_score = 1 - np.clip(np.abs(cin) / 200, 0, 1)  # Low CIN = more likely to fire
    iwv_score = np.clip(iwv_rate / (IWV_RATE_THRESHOLD * 3), 0, 1)
    conv_score = np.clip(convergence / (CONVERGENCE_THRESHOLD * 10), 0, 1)
    shear_score = np.clip(shear / 30, 0, 1)

    # Weighted combination
    score = (0.30 * cape_score + 0.20 * cin_score + 0.25 * iwv_score +
             0.15 * conv_score + 0.10 * shear_score)
    return np.clip(score, 0, 1)


def compute_precipitation_impact(hazard_prob: np.ndarray, precip: np.ndarray) -> np.ndarray:
    """Stage 3: Expected precipitation impact from hazard probability."""
    return hazard_prob * np.clip(precip / 50.0, 0, 1)  # Normalize precip by 50mm threshold


def compute_runoff_susceptibility(
    precip_impact: np.ndarray,
    terrain: np.ndarray,
    land_mask: np.ndarray,
) -> np.ndarray:
    """Stage 4: Runoff susceptibility from precipitation × terrain."""
    # Terrain vulnerability: low elevation + steep gradient = higher risk
    terrain_norm = (terrain - terrain.min()) / (terrain.max() - terrain.min() + 1e-10)

    # Compute simple slope proxy (gradient magnitude)
    dy, dx = np.gradient(terrain)
    slope = np.sqrt(dx**2 + dy**2)
    slope_norm = np.clip(slope / slope.max(), 0, 1) if slope.max() > 0 else np.zeros_like(slope)

    # Low elevation + high upstream slope = vulnerable
    vulnerability = (1 - terrain_norm) * 0.6 + slope_norm * 0.4

    # Apply land mask
    vulnerability *= land_mask.astype(float)

    return precip_impact * vulnerability


def compute_exposure(hazard_footprint: np.ndarray, population: np.ndarray = None) -> dict:
    """Stage 5: Exposure assessment — who/what is in the hazard zone."""
    # For now, estimate based on hazard area
    threshold = 0.5
    affected_cells = (hazard_footprint > threshold).sum()
    area_per_cell_km2 = (1.08 * 111) ** 2  # ~14,500 km² per cell

    result = {
        "affected_area_km2": float(affected_cells * area_per_cell_km2),
        "affected_cells": int(affected_cells),
        "max_risk": float(hazard_footprint.max()),
        "mean_risk": float(hazard_footprint[hazard_footprint > threshold].mean()) if affected_cells > 0 else 0,
    }

    if population is not None:
        result["affected_population"] = float((population * (hazard_footprint > threshold)).sum())

    return result


def determine_response_tier(
    probability: float,
    exposure: dict,
    persistence: int = 1,
) -> str:
    """Stage 6: Determine alert severity tier."""
    if persistence >= 2 and probability > 0.85:
        return "emergency"
    elif persistence >= 2 and probability > 0.70:
        return "warning"
    elif probability > 0.50:
        return "watch"
    return "none"


def run_cascade(
    model_outputs: dict,
    features: dict,
    terrain: np.ndarray,
    land_mask: np.ndarray,
    precip: np.ndarray = None,
) -> dict:
    """
    Full 6-stage cascade chain.

    Args:
        model_outputs: {thunderstorm, cloudburst, flash_flood} probability maps
        features: raw feature values (for initiation score)
        terrain: DEM array (H, W)
        land_mask: land mask array (H, W)
        precip: precipitation data (H, W), optional
    """
    # Stage 1: Convective initiation score
    initiation = compute_convective_initiation_score(features)

    # Stage 2: Model hazard probabilities (already computed)
    ts_prob = model_outputs["thunderstorm"]
    cb_prob = model_outputs["cloudburst"]
    ff_prob = model_outputs["flash_flood"]

    # Stage 3: Precipitation impact
    if precip is None:
        precip = np.zeros_like(ts_prob)
    precip_impact = compute_precipitation_impact(cb_prob, precip)

    # Stage 4: Runoff susceptibility
    runoff = compute_runoff_susceptibility(precip_impact, terrain, land_mask)

    # Stage 5: Exposure for each hazard type
    exposure = {
        "thunderstorm": compute_exposure(ts_prob),
        "cloudburst": compute_exposure(cb_prob),
        "flash_flood": compute_exposure(ff_prob + runoff * 0.3),  # Enhance with runoff
    }

    # Stage 6: Response tier per event type
    response = {}
    for etype in ["thunderstorm", "cloudburst", "flash_flood"]:
        prob = model_outputs[etype]
        response[etype] = determine_response_tier(
            float(prob.max()),
            exposure[etype],
        )

    return {
        "initiation_score": initiation,
        "hazard_probability": model_outputs,
        "precipitation_impact": precip_impact,
        "runoff_susceptibility": runoff,
        "exposure": exposure,
        "response_tier": response,
    }
