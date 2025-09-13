// ============================================================
// 1. INPUT ROI & VISUALISASI OUTLINE
// ============================================================
var roi = ee.FeatureCollection("projects/forestcanopydensity/assets/hutanpkl");

Map.centerObject(roi, 8);
Map.addLayer(
  ee.Image().byte().paint({
    featureCollection: roi,
    color: 1,
    width: 2
  }),
  {palette: 'red'},
  "ROI Outline"
);

// ============================================================
// 2. LANDSAT 8/9 → CLOUD MASKING & SCALING
// ============================================================
function maskL8sr(image) {
  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 3).neq(0) // cloud shadow
              .or(qa.bitwiseAnd(1 << 4).neq(0)) // snow
              .or(qa.bitwiseAnd(1 << 5).neq(0)) // cloud
              .or(qa.bitwiseAnd(1 << 7).neq(0)); // cirrus
  image = image.updateMask(cloud.not());

  // Scaling optical bands
  var optical = image.select('SR_B.*').multiply(0.0000275).add(-0.2);
  // Scaling thermal bands
  var thermal = image.select('ST_B.*').multiply(0.00341802).add(149.0);

  return image.addBands(optical, null, true)
              .addBands(thermal, null, true);
}

// Koleksi Landsat
var l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            .filterBounds(roi)
            .filterDate('2020-01-01','2020-12-31')
            .map(maskL8sr);

var l9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
            .filterBounds(roi)
            .filterDate('2020-01-01','2020-12-31')
            .map(maskL8sr);

// Gabungkan & median composite
var combined = l8.merge(l9);
var filled = combined.median().clip(roi);

// Visualisasi RGB
Map.addLayer(filled, {bands:['SR_B4','SR_B3','SR_B2'], min:0, max:0.3}, 'RGB Composite');

// ============================================================
// 3. SPECTRAL INDICES
// ============================================================
var ndvi = filled.normalizedDifference(['SR_B5','SR_B4']).rename('NDVI');

var L = 0.5;
var savi = filled.expression(
  '((NIR - RED)/(NIR + RED + L))*(1+L)',
  {'NIR': filled.select('SR_B5'), 'RED': filled.select('SR_B4'), 'L': L}
).rename('SAVI');

var bi = filled.expression(
  '((SWIR + RED) - (NIR + BLUE))/((SWIR + RED) + (NIR + BLUE))',
  {'SWIR': filled.select('SR_B6'),'RED': filled.select('SR_B4'),'NIR': filled.select('SR_B5'),'BLUE': filled.select('SR_B2')}
).rename('BI');

var ndmi = filled.normalizedDifference(['SR_B5','SR_B6']).rename('NDMI');

// Visualisasi indeks
Map.addLayer(ndvi,{min:-1,max:1,palette:['blue','white','green']},'NDVI');
Map.addLayer(savi,{min:-1,max:1,palette:['yellow','green']},'SAVI');
Map.addLayer(bi,{min:-1,max:1,palette:['brown','white','blue']},'BI');
Map.addLayer(ndmi,{min:-1,max:1,palette:['red','white','cyan']},'NDMI');

// ============================================================
// 4. VEGETATION DENSITY (VD) → QUANTILE SCALING
// ============================================================

// Rename NDVI agar key konsisten
var ndviRenamed = ndvi.rename('NDVI');

// Hitung percentile 2.5% & 97.5%
var ndviVals = ndviRenamed.reduceRegion({
  reducer: ee.Reducer.percentile([2.5,97.5]),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13,
  bestEffort: true
});

print('NDVI percentiles raw:', ndviVals);

// Ambil nilai percentile dengan default jika null
var p3 = ee.Number(ndviVals.get('NDVI_p3'));
var p98 = ee.Number(ndviVals.get('NDVI_p98'));

// Linear scaling NDVI → VD (0..1)
var vd_ndvi = ndviRenamed.subtract(p3)
                         .divide(p98.subtract(p3))
                         .clamp(0,1)
                         .rename('VD_NDVI');

Map.addLayer(vd_ndvi, {min:0,max:1,palette:['ffffff','d9f0a3','78c679','238443']}, 'VD NDVI');

// Smoothing
var vd_smoothed = vd_ndvi.focal_mean(30,'circle','meters').rename('VD_Smoothed');
Map.addLayer(vd_smoothed, {min:0,max:1,palette:['ffffff','d9f0a3','78c679','238443']}, 'VD Smoothed');

// Fusion dengan shadow
var bi_scaled = bi.unitScale(-1,1).clamp(0,1);
var ndmi_scaled = ndmi.unitScale(-1,1).clamp(0,1);
var s_index = bi_scaled.multiply(0.5).add(ndmi_scaled.multiply(0.5)).rename('SSI');

var vd_fused = vd_smoothed.multiply(0.7)
                  .add(ee.Image(1).subtract(s_index).multiply(0.3))
                  .clamp(0,1)
                  .rename('VD_Fused');
Map.addLayer(vd_fused,{min:0,max:1,palette:['ffffff','d9f0a3','78c679','005a32']},'VD Fused');

// ============================================================
// 5. FOREST MASKING
// ============================================================
var forestMask = vd_fused.gte(0.4).rename('ForestMask');
Map.addLayer(forestMask.updateMask(forestMask),{palette:['006400']},'Forest Mask');

var vd_forest = vd_fused.updateMask(forestMask).rename('VD_Forest');
Map.addLayer(vd_forest,{min:0,max:1,palette:['ffffff','d9f0a3','78c679','005a32']},'VD Forest');

// ============================================================
// 6. FOREST CANOPY DENSITY (FCD)
// ============================================================
var fcd = vd_forest.multiply(0.7)
                    .add(ee.Image(1).subtract(s_index).multiply(0.3))
                    .clamp(0,1)
                    .rename('FCD');

Map.addLayer(fcd, {min:0,max:1,palette:['ffffff','d9f0a3','78c679','005a32']}, 'FCD');

// Konversi ke persen & klasifikasi
var fcd_percent = fcd.multiply(100).rename('FCD_Percent');
var fcd_class = fcd_percent.expression(
  "b('FCD_Percent') < 40 ? 1 : (b('FCD_Percent') < 70 ? 2 : 3)",
  {'FCD_Percent': fcd_percent}
).rename('FCD_Class');

Map.addLayer(fcd_class, {min:1,max:3,palette:['ffffcc','a1dab4','238443']}, 'FCD Class');

// ============================================================
// 7. STATISTIK & EXPORT
// ============================================================
var stats = fcd_percent.addBands(fcd_class)
                      .reduceRegion({
                        reducer: ee.Reducer.mean()
                                 .combine({reducer2: ee.Reducer.min(), sharedInputs:true})
                                 .combine({reducer2: ee.Reducer.max(), sharedInputs:true}),
                        geometry: roi,
                        scale: 30,
                        maxPixels: 1e13
                      });
print('FCD stats:', stats);

Export.image.toDrive({
  image: fcd_percent.toFloat(),
  description: 'FCD_Percent_Export',
  folder: 'GEE_exports',
  fileNamePrefix: 'FCD_2020_2021',
  region: roi,
  scale: 30,
  maxPixels: 1e13
});
