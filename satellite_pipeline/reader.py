"""
INSAT-3D/3DR Satellite Data Reader.
Parses MOSDAC HDF5/NetCDF files and derives convective intensity indices.
"""

import xarray as xr
import numpy as np
import logging
from pathlib import Path
from typing import Dict, Tuple

logger = logging.getLogger("SatelliteReader")


class INSATReader:

    @staticmethod
    def read_granule(file_path: Path) -> Tuple[xr.Dataset, Dict]:
        """Open INSAT NetCDF/HDF5 product and extract dataset + metadata."""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        ds = xr.open_dataset(str(file_path))
        main_var = None
        for candidate in ["CTT", "QPE", "TPW", "temp", "rain"]:
            if candidate in ds.data_vars:
                main_var = candidate
                break
        if main_var is None:
            main_var = list(ds.data_vars)[0]

        metadata = {
            "satellite": ds.attrs.get("satellite", "INSAT-3DR"),
            "granule_id": ds.attrs.get("granule_id", file_path.stem),
            "variable_name": main_var,
            "shape": ds[main_var].shape,
        }
        logger.info(f"Loaded INSAT product {file_path.name}: var={main_var}")
        return ds, metadata

    @staticmethod
    def derive_convective_proxies(ds: xr.Dataset, var_name: str = "CTT") -> np.ndarray:
        """
        Derive Convective Intensity Proxy (0.0 to 1.0) from Cloud Top Temperature (CTT).
        280K (warm cloud/surface) -> 0.0, 200K (deep convective cloud top) -> 1.0.
        """
        data = ds[var_name].values
        data = np.nan_to_num(data, nan=280.0)
        convective_index = np.clip((280.0 - data) / 80.0, 0.0, 1.0)
        return convective_index
