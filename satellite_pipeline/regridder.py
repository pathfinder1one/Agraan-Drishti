"""
Spatial Grid Resampler.
Interpolates raw satellite swath arrays onto any custom grid resolution.
"""

import numpy as np
import scipy.interpolate as interp
import logging

logger = logging.getLogger("SpatialRegridder")


class Regridder:

    def __init__(self, lat_min=5.04, lat_max=38.52, lon_min=65.04, lon_max=98.52, grid_size=310):
        self.grid_size = grid_size
        self.target_lats = np.linspace(lat_min, lat_max, grid_size)
        self.target_lons = np.linspace(lon_min, lon_max, grid_size)
        self.target_grid_lon, self.target_grid_lat = np.meshgrid(self.target_lons, self.target_lats)

    def regrid_array(self, src_array: np.ndarray, src_lats: np.ndarray, src_lons: np.ndarray) -> np.ndarray:
        """Regrid source array to target grid size."""
        if src_array.shape == (self.grid_size, self.grid_size):
            return src_array.astype(np.float32)

        logger.info(f"Regridding array from {src_array.shape} to ({self.grid_size}, {self.grid_size})")

        f = interp.RegularGridInterpolator(
            (src_lats, src_lons), src_array, bounds_error=False, fill_value=0.0
        )
        pts = np.array([self.target_grid_lat.flatten(), self.target_grid_lon.flatten()]).T
        regrid_flat = f(pts)
        return regrid_flat.reshape(self.grid_size, self.grid_size).astype(np.float32)
