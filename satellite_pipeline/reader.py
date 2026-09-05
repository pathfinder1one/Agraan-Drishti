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
    def read_eumetsat_native(file_path: Path) -> Tuple[np.ndarray, Dict]:
        """Decode a Meteosat SEVIRI native file and resample IR 10.8um to India."""
        from satpy import Scene
        from scipy.ndimage import zoom

        file_path = Path(file_path)
        scene = Scene(reader="seviri_l1b_native", filenames=[str(file_path)])
        scene.load(["IR_108"])
        channel = scene["IR_108"]
        image = channel.compute().values.astype(np.float32)
        lons, lats = channel.attrs["area"].get_lonlats()
        valid = (
            np.isfinite(lats)
            & np.isfinite(lons)
            & (lats >= 5.04)
            & (lats <= 38.52)
            & (lons >= 65.04)
            & (lons <= 98.52)
        )
        if not valid.any():
            raise ValueError("EUMETSAT native product does not cover the project India grid")
        rows, cols = np.where(valid)
        image = image[rows.min():rows.max() + 1, cols.min():cols.max() + 1]
        image = zoom(image, (310 / image.shape[0], 310 / image.shape[1]), order=1)
        image = image[:310, :310]
        image = np.nan_to_num(image, nan=280.0, posinf=280.0, neginf=280.0).astype(np.float32)
        metadata = {
            "satellite": "Meteosat-9",
            "granule_id": file_path.stem,
            "variable_name": "IR_108",
            "shape": image.shape,
        }
        logger.info("Loaded EUMETSAT SEVIRI native product %s: IR_108", file_path.name)
        return image, metadata

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
        data = ds[var_name] if isinstance(ds, dict) else ds[var_name].values
        data = np.nan_to_num(data, nan=280.0)
        convective_index = np.clip((280.0 - data) / 80.0, 0.0, 1.0)
        return convective_index
