"""
Feature engineering: derives storm-precursor signals from raw IMDAA variables.
  Moisture   → IWV, IWV rate-of-change
  Instability → CAPE, CIN
  Lift       → wind convergence, vertical shear
"""
import numpy as np
import xarray as xr
from typing import Tuple
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import GRAVITY, Rd, Rv, Cp, Lv, EPSILON, GRID_RESOLUTION, PRESSURE_LEVELS_SELECTED


# ═══════════════════ MOISTURE ═══════════════════

def saturation_vapor_pressure(temperature_k):
    """Tetens formula → saturation vapor pressure (Pa)."""
    t_c = temperature_k - 273.15
    return 610.78 * np.exp(17.27 * t_c / (t_c + 237.3))


def compute_specific_humidity(rh, temperature_k, pressure_pa):
    e_sat = saturation_vapor_pressure(temperature_k)
    e = (rh / 100.0) * e_sat
    return np.clip(EPSILON * e / (pressure_pa - (1 - EPSILON) * e), 0, None)


def compute_iwv(rh: xr.DataArray, temperature: xr.DataArray, pressure_levels: np.ndarray) -> xr.DataArray:
    """Integrated Water Vapor: IWV = (1/g) ∫ q dp."""
    p_pa = pressure_levels * 100.0
    q = compute_specific_humidity(rh.values, temperature.values,
                                   p_pa[np.newaxis, :, np.newaxis, np.newaxis])
    dp = np.diff(p_pa)
    q_mean = (q[:, :-1] + q[:, 1:]) / 2.0
    iwv = np.sum(q_mean * dp[np.newaxis, :, np.newaxis, np.newaxis], axis=1) / GRAVITY
    return xr.DataArray(iwv, dims=["time", "latitude", "longitude"],
                        coords={"time": rh.time, "latitude": rh.latitude, "longitude": rh.longitude},
                        attrs={"units": "kg/m²", "long_name": "Integrated Water Vapor"})


def compute_iwv_rate(iwv: xr.DataArray) -> xr.DataArray:
    """IWV rate of change per timestep."""
    rate = iwv.diff(dim="time")
    pad = iwv.isel(time=0) * 0
    rate = xr.concat([pad, rate], dim="time")
    rate.attrs = {"units": "kg/m²/6h", "long_name": "IWV Rate of Change"}
    return rate


# ═══════════════════ INSTABILITY ═══════════════════

def compute_dewpoint(temperature_k, rh):
    t_c = temperature_k - 273.15
    rh_c = np.clip(rh, 1, 100)
    alpha = (17.27 * t_c) / (237.3 + t_c) + np.log(rh_c / 100.0)
    return (237.3 * alpha) / (17.27 - alpha) + 273.15


def compute_cape_cin(temperature: xr.DataArray, rh: xr.DataArray,
                     pressure_levels: np.ndarray) -> Tuple[xr.DataArray, xr.DataArray]:
    """Simplified CAPE/CIN via surface-based parcel lift."""
    temp_np, rh_np, p_hpa = temperature.values, rh.values, pressure_levels
    nt, nlev, nlat, nlon = temp_np.shape
    cape = np.zeros((nt, nlat, nlon), dtype=np.float32)
    cin = np.zeros((nt, nlat, nlon), dtype=np.float32)
    t_parcel = temp_np[:, -1, :, :].copy()

    for k in range(nlev - 2, -1, -1):
        dp = (p_hpa[k + 1] - p_hpa[k]) * 100.0
        e_sat = saturation_vapor_pressure(t_parcel)
        p_lev = p_hpa[k + 1] * 100.0
        w_sat = EPSILON * e_sat / (p_lev - e_sat + 1e-10)
        gamma_m = (Rd * t_parcel / (Cp * p_lev)) * \
                  (1 + Lv * w_sat / (Rd * t_parcel)) / \
                  (1 + Lv**2 * w_sat / (Cp * Rv * t_parcel**2) + 1e-10)
        t_parcel = t_parcel + gamma_m * dp
        t_env = temp_np[:, k, :, :]
        buoy = GRAVITY * (t_parcel - t_env) / (t_env + 1e-10)
        cape += np.maximum(buoy, 0) * abs(dp) / GRAVITY
        cin += np.minimum(buoy, 0) * abs(dp) / GRAVITY

    coords = {"time": temperature.time, "latitude": temperature.latitude, "longitude": temperature.longitude}
    return (xr.DataArray(np.clip(cape, 0, 10000), dims=["time","latitude","longitude"],
                         coords=coords, attrs={"units":"J/kg","long_name":"CAPE"}),
            xr.DataArray(np.clip(cin, -2000, 0), dims=["time","latitude","longitude"],
                         coords=coords, attrs={"units":"J/kg","long_name":"CIN"}))


# ═══════════════════ LIFT ═══════════════════

def compute_wind_convergence(u_wind, v_wind, level_hpa=925.0):
    """Low-level convergence: −(∂u/∂x + ∂v/∂y) at 925 hPa."""
    u = u_wind.sel(plevel=level_hpa, method="nearest")
    v = v_wind.sel(plevel=level_hpa, method="nearest")
    dx = GRID_RESOLUTION * 111000 * np.cos(np.radians(20))
    dy = GRID_RESOLUTION * 111000
    du_dx = u.diff(dim="longitude").reindex_like(u, method="nearest") / dx
    dv_dy = v.diff(dim="latitude").reindex_like(v, method="nearest") / dy
    conv = -(du_dx + dv_dy)
    conv.attrs = {"units": "1/s", "long_name": "Wind Convergence (925hPa)"}
    return conv


def compute_vertical_wind_shear(u_wind, v_wind, lower=850.0, upper=200.0):
    """Vertical wind shear |V_upper − V_lower|."""
    du = u_wind.sel(plevel=upper, method="nearest") - u_wind.sel(plevel=lower, method="nearest")
    dv = v_wind.sel(plevel=upper, method="nearest") - v_wind.sel(plevel=lower, method="nearest")
    shear = np.sqrt(du**2 + dv**2)
    shear.attrs = {"units": "m/s", "long_name": f"Wind Shear ({int(lower)}-{int(upper)}hPa)"}
    return shear


def compute_mslp_gradient(prmsl):
    """MSLP gradient magnitude (Pa/m)."""
    dx = GRID_RESOLUTION * 111000 * np.cos(np.radians(20))
    dy = GRID_RESOLUTION * 111000
    dp_dx = prmsl.diff(dim="longitude").reindex_like(prmsl, method="nearest") / dx
    dp_dy = prmsl.diff(dim="latitude").reindex_like(prmsl, method="nearest") / dy
    grad = np.sqrt(dp_dx**2 + dp_dy**2)
    grad.attrs = {"units": "Pa/m", "long_name": "MSLP Gradient"}
    return grad


# ═══════════════════ SUPPLEMENTARY ═══════════════════

def compute_t2m_anomaly(t2m):
    clim = t2m.groupby("time.dayofyear").mean(dim="time")
    anom = t2m.groupby("time.dayofyear") - clim
    anom = anom.transpose("time", "latitude", "longitude")
    anom = anom.drop_vars("dayofyear", errors="ignore")
    anom.attrs = {"units": "K", "long_name": "2m Temp Anomaly"}
    return anom


def compute_column_rh(rh):
    col = rh.mean(dim="plevel")
    col.attrs = {"units": "%", "long_name": "Column-Mean RH"}
    return col


# ═══════════════════ MASTER ═══════════════════

def compute_all_features(data: dict) -> xr.Dataset:
    """Compute all 10 storm-precursor features."""
    atm, sfc = data["atmospheric"], data["surface"]
    plevels = np.array(PRESSURE_LEVELS_SELECTED, dtype=np.float32)

    print("Computing features...")
    iwv = compute_iwv(atm["RH"], atm["TMP"], plevels)
    iwv_rate = compute_iwv_rate(iwv)
    cape, cin = compute_cape_cin(atm["TMP"], atm["RH"], plevels)
    conv = compute_wind_convergence(atm["UGRD"], atm["VGRD"])
    shear = compute_vertical_wind_shear(atm["UGRD"], atm["VGRD"])
    mslp = compute_mslp_gradient(sfc["PRMSL"])
    t2m_a = compute_t2m_anomaly(sfc["TMP_2m"])
    col_rh = compute_column_rh(atm["RH"])

    return xr.Dataset({
        "cape": cape, "cin": cin, "iwv": iwv, "iwv_rate": iwv_rate,
        "convergence": conv, "wind_shear": shear, "mslp_gradient": mslp,
        "precip": sfc["APCP"], "t2m_anomaly": t2m_a, "rh_column": col_rh,
    })


def normalize_features(features: xr.Dataset) -> Tuple[xr.Dataset, dict]:
    """Robust z-score normalization (median + IQR)."""
    stats, normed = {}, {}
    for name in features.data_vars:
        da = features[name]
        med = float(da.median())
        iqr = max(float(da.quantile(0.75)) - float(da.quantile(0.25)), 1e-10)
        # Keep rare missing/extreme reanalysis values from overflowing the
        # ConvLSTM, especially when training with mixed precision.
        scaled = (da - med) / iqr
        normed[name] = scaled.where(np.isfinite(scaled), 0.0).clip(min=-10.0, max=10.0)
        stats[name] = {"median": med, "iqr": iqr}
    return xr.Dataset(normed), stats
