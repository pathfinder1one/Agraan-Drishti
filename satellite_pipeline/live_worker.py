"""
Pipeline Worker: Fetch Satellite -> Extract -> Regrid -> Save Feature Tensor.
"""

import torch
import numpy as np
import time
import logging
from pathlib import Path
from typing import Dict, Any

from .mosdac_client import MOSDACClient
from .reader import INSATReader
from .regridder import Regridder

logger = logging.getLogger("LiveSatelliteWorker")


class LiveSatelliteWorker:

    def __init__(self, tensor_output_path: str = "satellite_live.pt", cache_dir: str | None = None):
        self.tensor_output_path = Path(tensor_output_path)
        self.client = MOSDACClient(cache_dir=cache_dir)
        self.reader = INSATReader()
        self.regridder = Regridder(grid_size=310)

    def process_latest_granule(self) -> Dict[str, Any]:
        t0 = time.time()

        # 1. Fetch satellite granule
        granule_file = self.client.fetch_granule("INSAT3DR_IMG_L2B_CTT")

        # 2. Extract convective signals
        if granule_file.suffix.lower() == ".nat":
            native_image, meta = self.reader.read_eumetsat_native(granule_file)
            convective_index = self.reader.derive_convective_proxies(
                {"IR_108": native_image}, "IR_108"
            )
            regridded_convection = convective_index
        else:
            ds, meta = self.reader.read_granule(granule_file)
            convective_index = self.reader.derive_convective_proxies(ds, meta["variable_name"])

            # 3. Regrid to target spatial dimensions
            src_lats = ds.latitude.values
            src_lons = ds.longitude.values
            regridded_convection = self.regridder.regrid_array(convective_index, src_lats, src_lons)

        # 4. Save PyTorch tensor
        tensor = torch.from_numpy(regridded_convection).unsqueeze(0).unsqueeze(0) # (1, 1, 310, 310)
        torch.save(tensor, str(self.tensor_output_path))
        elapsed = round(time.time() - t0, 3)

        return {
            "granule_id": meta["granule_id"],
            "processing_time_sec": elapsed,
            "tensor_shape": list(tensor.shape),
            "status": "SUCCESS"
        }
