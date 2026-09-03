"""
Complete Standalone Test Script.
"""

from satellite_pipeline.live_worker import LiveSatelliteWorker
from satellite_pipeline.mosdac_client import MOSDACClient

if __name__ == "__main__":
    print("=" * 60)
    print("  ISRO MOSDAC INSAT-3DR Satellite Live Pipeline Test")
    print("=" * 60)

    # 1. Check API Connection Status
    client = MOSDACClient()
    status = client.get_status()
    print(f"\n[1] MOSDAC Service: {status['service']}")
    print(f"    Satellite:       {status['satellite']}")
    print(f"    Status:          {status['status']}")

    # 2. Run Live Ingestion & Regridding Worker
    print("\n[2] Executing Ingestion & Feature Regridding...")
    worker = LiveSatelliteWorker(tensor_output_path="satellite_live.pt")
    res = worker.process_latest_granule()

    print(f"\n[✓] Ingestion Complete!")
    print(f"    Granule ID:      {res['granule_id']}")
    print(f"    Latency:         {res['processing_time_sec']}s")
    print(f"    Saved Tensor:    {res['tensor_shape']} -> satellite_live.pt")
    print("=" * 60)
