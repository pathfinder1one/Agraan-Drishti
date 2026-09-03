# 🛰️ ISRO MOSDAC INSAT Satellite Ingestion & Inference Module

Standalone Python package to ingest, parse, regrid, and preprocess **ISRO INSAT-3D/3DR satellite products** via the **MOSDAC Data Download API**.

## 📁 Package Structure

```
satellite_pipeline/
├── __init__.py
├── mosdac_client.py    # ISRO MOSDAC API Downloader & RSS Watcher
├── reader.py           # INSAT-3D/3DR NetCDF/HDF5 Parser (CTT, QPE, TPW)
├── regridder.py        # Spatial Resampler for any Lat/Lon Grid
├── live_worker.py      # Asynchronous Ingestion & Tensor Builder
└── example_usage.py    # Standalone runnable example
```

## 🚀 Quickstart

1. Install dependencies:
   ```bash
   pip install torch xarray netCDF4 scipy numpy
   ```

2. Run test script:
   ```bash
   python -m satellite_pipeline.example_usage
   ```
