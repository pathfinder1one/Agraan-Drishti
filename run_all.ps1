Write-Host "=========================================="
Write-Host "STAGE 1: MINING DATASET (4000 Disasters / 16000 Normals)"
Write-Host "=========================================="
python -u precompute_dataset.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error in precomputation! Aborting training."
    exit $LASTEXITCODE
}

Write-Host "=========================================="
Write-Host "STAGE 2: TRAINING MODEL (FP16 / RTX 4050)"
Write-Host "=========================================="
python -u train_pipeline.py
