# Forest Canopy Density (FCD) — GEE Project


Project ini menghitung Forest Canopy Density (FCD) menggunakan data Landsat 8/9 di Google Earth Engine.


## Tujuan
- Menunjukkan workflow pengolahan citra satelit di GEE: import ROI → cloud masking → composite → spectral indices → vegetation density → scaled shadow index → forest mask → FCD.
- Menyediakan kode reproducible (GEE JS + GEE Python/Colab).


## Cara pakai
1. **GEE JavaScript (Code Editor)**
- Buka `gee_js/fcd_analysis.js` di Code Editor (https://code.earthengine.google.com)
- Update path asset ROI (`var roi = ee.FeatureCollection('...')`) jika perlu
- Jalankan script, periksa layer dan Console
- Publikasikan App (optional) dari Code Editor: *File → New → App* atau *Get link to app*


2. **GEE Python (Google Colab)**
- Buka `colab/fcd_colab.ipynb` di Google Colab
- Follow cell pertama untuk authentication (OAuth or Service Account)
- Jalankan seluruh cell untuk menghasilkan dan mengekspor FCD


3. **Export**
- Export GeoTIFF lewat `Export.image.toDrive()` atau `ee.batch.Export` di Python
- Download dan unggah ke `results/` atau buat Kaggle Dataset jika perlu


## File penting
- `gee_js/fcd_analysis.js`: script utama untuk Code Editor (JS)
- `colab/fcd_colab.ipynb`: notebook Colab yang bisa di-run di cloud (Python)
- `results/`: simpan preview peta & GeoTIFF


## Lisensi
Lisensi: MIT
