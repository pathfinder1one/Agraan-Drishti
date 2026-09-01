"""
Data loader for IMDAA reanalysis NetCDF files.
Loads atmospheric (pressure-level) and surface variables from yearly .nc files.
"""
import xarray as xr
import numpy as np
from typing import Optional, List, Tuple
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import (
    ATMOSPHERIC_DIR, SURFACE_DIR, CONSTANTS_DIR, DATA_DIR,
    PRESSURE_LEVELS_SELECTED, YEAR_START, YEAR_END
)

ATMOSPHERIC_VARS = {
    "TMP":  "IMDAA_TMP_prl_1.08",
    "RH":   "IMDAA_RH_prl_1.08",
    "HGT":  "IMDAA_HGT_prl_1.08",
    "UGRD": "IMDAA_UGRD_prl_1.08",
    "VGRD": "IMDAA_VGRD_prl_1.08",
}

SURFACE_FILES = {
    "APCP":     "IMDAA_APCP_sfc_1.08_1990_2020.nc",
    "PRMSL":    "IMDAA_PRMSL_msl_1.08_1990_2020.nc",
    "TMP_2m":   "IMDAA_TMP_2m_1.08_1990_2020.nc",
    "UGRD_10m": "IMDAA_UGRD_10m_1.08_1990_2020.nc",
    "VGRD_10m": "IMDAA_VGRD_10m_1.08_1990_2020.nc",
}

CONSTANT_FILES = {
    "MTERH": "IMDAA_MTERH_sfc_1.08_1990_2020.nc",
    "LAND":  "IMDAA_LAND_sfc_1.08_1990_2020.nc",
}


def load_atmospheric_variable(
    var_name: str,
    years: Optional[List[int]] = None,
    pressure_levels: Optional[List[float]] = None,
) -> xr.DataArray:
    """Load an atmospheric variable from yearly NetCDF files."""
    if var_name not in ATMOSPHERIC_VARS:
        raise ValueError(f"Unknown variable: {var_name}")
    if years is None:
        years = list(range(YEAR_START, YEAR_END + 1))
    if pressure_levels is None:
        pressure_levels = PRESSURE_LEVELS_SELECTED

    dir_name = f"IMDAA_{var_name}_prl_1.08_{YEAR_START}_{YEAR_END}"
    var_dir = ATMOSPHERIC_DIR / dir_name
    prefix = ATMOSPHERIC_VARS[var_name]

    files = [str(var_dir / f"{prefix}_{y}.nc") for y in years
             if (var_dir / f"{prefix}_{y}.nc").exists()]
    if not files:
        raise FileNotFoundError(f"No files for {var_name}")

    ds = xr.open_mfdataset(files, combine="by_coords", parallel=False)
    data_var = f"{var_name}_prl"
    if data_var not in ds.data_vars:
        data_var = list(ds.data_vars)[0]
    return ds[data_var].sel(plevel=pressure_levels, method="nearest")


def load_surface_variable(var_name: str) -> xr.DataArray:
    """Load a surface variable."""
    if var_name not in SURFACE_FILES:
        raise ValueError(f"Unknown variable: {var_name}")
    ds = xr.open_dataset(str(SURFACE_DIR / SURFACE_FILES[var_name]))
    var_map = {"APCP": "APCP_sfc", "PRMSL": "PRMSL_msl",
               "TMP_2m": "TMP_2m", "UGRD_10m": "UGRD_10m", "VGRD_10m": "VGRD_10m"}
    data_var = var_map.get(var_name, var_name)
    if data_var not in ds.data_vars:
        data_var = list(ds.data_vars)[0]
    return ds[data_var]


def load_constants() -> Tuple[xr.DataArray, xr.DataArray]:
    """Load terrain height (DEM) and land mask — static fields."""
    ds_t = xr.open_dataset(str(CONSTANTS_DIR / CONSTANT_FILES["MTERH"]))
    ds_l = xr.open_dataset(str(CONSTANTS_DIR / CONSTANT_FILES["LAND"]))
    return ds_t["MTERH_sfc"].isel(time=0), ds_l["LAND_sfc"].isel(time=0)


def load_merged_dataset() -> xr.Dataset:
    """Load the pre-merged dataset (HGT_prl, TMP_prl, TMP_2m, APCP_sfc)."""
    return xr.open_dataset(str(DATA_DIR / "IMDAA_merged_1.08_1990_2020.nc"))


def load_full_dataset(years=None, pressure_levels=None) -> dict:
    """Load all variables needed for feature engineering."""
    print("Loading atmospheric variables...")
    atmospheric = {}
    for v in ATMOSPHERIC_VARS:
        print(f"  {v}...")
        atmospheric[v] = load_atmospheric_variable(v, years, pressure_levels)

    print("Loading surface variables...")
    surface = {}
    for v in SURFACE_FILES:
        print(f"  {v}...")
        surface[v] = load_surface_variable(v)

    print("Loading constants...")
    terrain, land_mask = load_constants()
    return {"atmospheric": atmospheric, "surface": surface,
            "terrain": terrain, "land_mask": land_mask}


def get_grid_coordinates() -> Tuple[np.ndarray, np.ndarray]:
    """Get lat/lon arrays for the 32×32 grid."""
    terrain, _ = load_constants()
    return terrain.latitude.values, terrain.longitude.values


if __name__ == "__main__":
    tmp = load_atmospheric_variable("TMP", years=[2020])
    print(f"TMP: {tmp.shape}, levels: {tmp.plevel.values}")
    terrain, _ = load_constants()
    print(f"Terrain: {terrain.shape}, {float(terrain.min()):.0f}–{float(terrain.max()):.0f} m")
