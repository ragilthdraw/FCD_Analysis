# Forest Canopy Density (FCD) Analysis using Landsat 8/9 on GEE

This repository contains a workflow for analyzing **Forest Canopy Density (FCD) in Pekalongan Regency (Petungkriyono Rainforest)** using Landsat 8 and Landsat 9 imagery in **Google Earth Engine (GEE)**.

## 🌱 Overview
Forest Canopy Density (FCD) is an important parameter to measure the quality of forest ecosystems.  
This workflow combines vegetation indices and shadow information to estimate canopy density.

The analysis is implemented in **Google Earth Engine JavaScript API**.

## 🛰️ Data
- Landsat 8/9 Collection 2, Level-2 (Surface Reflectance)
- Study Area: ROI (custom feature collection)

## 🔎 Methodology
1. **Cloud Masking & Scaling**  
   Landsat SR bands are scaled and masked for clouds/cirrus.
2. **Spectral Indices**  
   - NDVI (Normalized Difference Vegetation Index)  
   - SAVI (Soil Adjusted Vegetation Index)  
   - BI (Bare Soil Index)  
   - NDMI (Normalized Difference Moisture Index)  
3. **Vegetation Density (VD)**  
   Quantile-based scaling of NDVI (2.5%–97.5%) + smoothing.  
4. **Shadow + Moisture Fusion**  
   Combine Bare Soil Index and NDMI → Shadow Soil Index (SSI).  
5. **Forest Masking**  
   Threshold on VD to mask out forest areas.  
6. **Forest Canopy Density (FCD)**  
   Fusion of VD and SSI → final FCD % and classification.

## 📊 Results
- FCD % map (0–100)
- FCD classes:
  - 1: Low canopy density (< 40%)
  - 2: Medium canopy density (40–70%)
  - 3: High canopy density (> 70%)

## 📷 Example Output
![FCD Map](results/fcd_classification.png)

## 📑 References
- Rikimaru, A., Miyatake, S., & Singh, S. (2002). "Forest Canopy Density Mapping and Monitoring in Cambodia".  
- GEE Documentation: [Google Earth Engine](https://developers.google.com/earth-engine)

## ⚖️ License
MIT License
