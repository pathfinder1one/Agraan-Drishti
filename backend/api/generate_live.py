import torch
import numpy as np
import os

# Resolution 0.108
# Lat: 5.04 to 38.52 => 310 grids
# Lon: 65.04 to 98.52 => 310 grids
GLOBAL_GRID = 310

def generate_live_india():
    # 6 hours, 10 features, 310x310
    india_features = torch.zeros((6, 10, GLOBAL_GRID, GLOBAL_GRID), dtype=torch.float32)
    
    # Generate low resolution noise and upscale to create smooth spatial weather patterns
    # Keep noise low so after /3.0 in inference, background stays in green/yellow range (0.05-0.13)
    import torch.nn.functional as F
    low_res_noise = torch.rand(6, 10, 15, 15) * 0.4
    smooth_noise = F.interpolate(low_res_noise, size=(GLOBAL_GRID, GLOBAL_GRID), mode='bicubic', align_corners=False)
    india_features += smooth_noise
    
    # 1. UTTARAKHAND (Entire State) - Massive Cloudburst Risk
    # Center: Lat ~30.0, Lon ~79.0 (r=231, c=129)
    # Covering ~350x350 km area
    r_uk, c_uk = 231, 129
    for t in range(6):
        intensity = 1.0 - 0.2 * abs(t - 3)
        india_features[t, 0, r_uk-15:r_uk+15, c_uk-15:c_uk+20] = 3.0 * intensity
        india_features[t, 2, r_uk-15:r_uk+15, c_uk-15:c_uk+20] = 2.5 * intensity
        india_features[t, 3, r_uk-15:r_uk+15, c_uk-15:c_uk+20] = 3.5 * intensity
        india_features[t, 4, r_uk-15:r_uk+15, c_uk-15:c_uk+20] = 2.0 * intensity

    # 2. SIKKIM / TEESTA (Entire State) - Flash Flood Risk
    # Center: Lat ~27.5, Lon ~88.5 (r=207, c=217)
    r_sk, c_sk = 207, 217
    for t in range(6):
        intensity = 1.0 - 0.15 * abs(t - 2)
        india_features[t, 0, r_sk-10:r_sk+10, c_sk-10:c_sk+10] = 2.8 * intensity
        india_features[t, 2, r_sk-10:r_sk+10, c_sk-10:c_sk+10] = 3.0 * intensity
        india_features[t, 3, r_sk-10:r_sk+10, c_sk-10:c_sk+10] = 2.5 * intensity
        india_features[t, 4, r_sk-10:r_sk+10, c_sk-10:c_sk+10] = 2.5 * intensity

    # 3. MAHARASHTRA / KONKAN COAST (Western Belt) - Severe Thunderstorm
    # Center: Lat ~18.5, Lon ~73.5 (r=124, c=78)
    # Spanning a long N-S strip (approx 600km long, 100km wide)
    r_mh, c_mh = 124, 78
    for t in range(6):
        intensity = 1.0 - 0.1 * abs(t - 1)
        india_features[t, 0, r_mh-30:r_mh+30, c_mh-10:c_mh+10] = 2.5 * intensity
        india_features[t, 2, r_mh-30:r_mh+30, c_mh-10:c_mh+10] = 2.0 * intensity
        india_features[t, 3, r_mh-30:r_mh+30, c_mh-10:c_mh+10] = 2.8 * intensity
        india_features[t, 4, r_mh-30:r_mh+30, c_mh-10:c_mh+10] = 1.5 * intensity

    # ===== MODERATE RISK ZONES (Yellow/Orange) =====

    # 4. KERALA - Monsoon Heavy Rainfall
    # Center: Lat ~10.0, Lon ~76.5 (r=46, c=106)
    r_kl, c_kl = 46, 106
    for t in range(6):
        intensity = 0.8 - 0.1 * abs(t - 4)
        india_features[t, 0, r_kl-12:r_kl+12, c_kl-6:c_kl+6] = 1.8 * intensity
        india_features[t, 2, r_kl-12:r_kl+12, c_kl-6:c_kl+6] = 1.5 * intensity
        india_features[t, 3, r_kl-12:r_kl+12, c_kl-6:c_kl+6] = 2.0 * intensity

    # 5. BIHAR / NORTH BIHAR - Flood Risk (Kosi/Gandak belt)
    # Center: Lat ~26.0, Lon ~86.0 (r=194, c=194)
    r_bh, c_bh = 194, 194
    for t in range(6):
        intensity = 0.7 - 0.1 * abs(t - 2)
        india_features[t, 0, r_bh-10:r_bh+10, c_bh-12:c_bh+12] = 1.6 * intensity
        india_features[t, 2, r_bh-10:r_bh+10, c_bh-12:c_bh+12] = 1.8 * intensity
        india_features[t, 4, r_bh-10:r_bh+10, c_bh-12:c_bh+12] = 1.4 * intensity

    # 6. ASSAM / BRAHMAPUTRA VALLEY - Flash Flood Risk
    # Center: Lat ~26.5, Lon ~92.0 (r=199, c=249)
    r_as, c_as = 199, 249
    for t in range(6):
        intensity = 0.75 - 0.12 * abs(t - 3)
        india_features[t, 0, r_as-8:r_as+8, c_as-15:c_as+15] = 2.0 * intensity
        india_features[t, 2, r_as-8:r_as+8, c_as-15:c_as+15] = 1.6 * intensity
        india_features[t, 3, r_as-8:r_as+8, c_as-15:c_as+15] = 1.8 * intensity

    # 7. RAJASTHAN / JAISALMER - Thunderstorm Risk
    # Center: Lat ~27.0, Lon ~71.0 (r=203, c=55)
    r_rj, c_rj = 203, 55
    for t in range(6):
        intensity = 0.6 - 0.08 * abs(t - 1)
        india_features[t, 0, r_rj-10:r_rj+10, c_rj-10:c_rj+10] = 1.4 * intensity
        india_features[t, 3, r_rj-10:r_rj+10, c_rj-10:c_rj+10] = 1.8 * intensity

    # 8. TAMIL NADU / CHENNAI COAST - Cyclone Risk
    # Center: Lat ~13.0, Lon ~80.0 (r=74, c=138)
    r_tn, c_tn = 74, 138
    for t in range(6):
        intensity = 0.65 - 0.1 * abs(t - 5)
        india_features[t, 0, r_tn-10:r_tn+10, c_tn-8:c_tn+8] = 1.5 * intensity
        india_features[t, 2, r_tn-10:r_tn+10, c_tn-8:c_tn+8] = 1.3 * intensity
        india_features[t, 3, r_tn-10:r_tn+10, c_tn-8:c_tn+8] = 1.6 * intensity

    # 9. ODISHA COAST - Cyclone + Heavy Rain
    # Center: Lat ~20.5, Lon ~85.5 (r=143, c=189)
    r_od, c_od = 143, 189
    for t in range(6):
        intensity = 0.7 - 0.1 * abs(t - 4)
        india_features[t, 0, r_od-10:r_od+10, c_od-10:c_od+10] = 1.7 * intensity
        india_features[t, 2, r_od-10:r_od+10, c_od-10:c_od+10] = 1.5 * intensity
        india_features[t, 3, r_od-10:r_od+10, c_od-10:c_od+10] = 1.9 * intensity

    # 10. PUNJAB / HARYANA - Heavy Rain Belt
    # Center: Lat ~30.5, Lon ~76.0 (r=235, c=101)
    r_pb, c_pb = 235, 101
    for t in range(6):
        intensity = 0.55 - 0.08 * abs(t - 2)
        india_features[t, 0, r_pb-8:r_pb+8, c_pb-10:c_pb+10] = 1.3 * intensity
        india_features[t, 2, r_pb-8:r_pb+8, c_pb-10:c_pb+10] = 1.2 * intensity
        india_features[t, 3, r_pb-8:r_pb+8, c_pb-10:c_pb+10] = 1.5 * intensity

    out_path = "backend/api/live_india.pt"
    torch.save(india_features, out_path)
    print("Generated", out_path, "of shape:", india_features.shape)

if __name__ == "__main__":
    generate_live_india()
