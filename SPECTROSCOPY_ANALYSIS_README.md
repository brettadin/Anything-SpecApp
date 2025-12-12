# Spectroscopy Data Analysis Web Application

A complete spectroscopy data analysis platform featuring file upload, parsing, spectral analysis, and interactive visualization.

## Features Implemented (Phase 1-2)

### Data Parsing
- **CSV/TSV Support**: Auto-detecting delimiter parsing via `papaparse` library
- **JCAMP-DX Support**: Architecture for JCAMP format (async dynamic import pattern)
- **Multi-Format Backend**: Python tools supporting HDF5, NetCDF, CSV, Excel, JCAMP

### Spectral Analysis
- **FFT (Fast Fourier Transform)**: Discrete Fourier Transform implementation for frequency domain analysis
- **Peak Detection**: Local maxima detection with configurable sensitivity
- **Baseline Correction**: Polynomial (default linear) baseline subtraction
- **Smoothing**: Moving average spectral smoothing
- **Normalization**: Min-max normalization to [0, 1] range
- **Statistics**: Mean, standard deviation, min, max, range, count

### API Endpoints
- **POST `/api/upload`**: File upload and parsing
  - Accepts CSV, TSV, JCAMP files
  - Returns parsed data and file ID
  - Stores parsed data in database
  
- **POST `/api/spectral-analysis`**: Run spectral analysis on uploaded files
  - Parameters: `fileId`, `yColumnName`, `analysisType` (all, stats, fft, peaks)
  - Returns analyzed spectrum with selected analysis results

### Frontend Components
- **SpectrumVisualizer**: Interactive Recharts visualization
  - Supports line, bar, and composed charts
  - Responsive design with 300px height
  - Tooltip and legend support

- **PeakDisplay**: Tabular peak results
  - Shows peak indices and intensities
  - Maps indices to x-axis values (wavelength/frequency)

- **SpectralStats**: Statistics grid display
  - 3-column responsive layout
  - Shows mean, std dev, min, max, range, count

### Pages
- **`/` (Home)**: File upload with drag-and-drop
  - Auto-redirects to spectral analysis for `.csv`, `.tsv`, `.jdx`, `.dx`, `.jcamp` files
  - Fallback to generic file viewer for other types

- **`/spectral/[fileId]` (Spectral Analysis)**: Full analysis interface
  - Spectrum visualization with original and processed data
  - Interactive controls for column selection and analysis type
  - Statistics summary, peak table, FFT results
  - Side-by-side normalized and smoothed spectrum views

## Project Structure

```
apps/web/src/
├── app/
│   ├── api/
│   │   ├── upload/route.js           # File upload endpoint
│   │   ├── spectral-analysis/route.js # Analysis endpoint
│   │   └── utils/
│   │       ├── parsers.js            # CSV/TSV/JCAMP parsing
│   │       └── spectral-analysis.js  # FFT, peaks, baseline, etc.
│   ├── spectral/[fileId]/page.tsx    # Main analysis UI
│   └── page.jsx                      # Upload page (modified)
├── components/
│   └── spectral-visualizer.tsx       # Recharts visualization components
└── ...

tools/python/parsers/
├── analyze_spectra.py                # CLI + library for spectral analysis
├── requirements.txt                  # Python dependencies
└── README.md                        # Python tool documentation

test/
├── parsers.test.ts                   # Parser unit tests (3 tests)
├── spectral-analysis.test.ts         # Analysis algorithm tests (6 tests)
└── integration.test.ts               # End-to-end pipeline tests (8 tests)
```

## Testing

All 17 tests passing:
```bash
npm exec vitest -- --run
```

**Test Coverage:**
- Parser unit tests: CSV, TSV, JCAMP detection and parsing
- Analysis algorithm tests: FFT, peaks, baseline, smoothing, normalization, stats
- Integration tests: Full upload → parse → analyze pipeline with 8 scenarios

## Python Tooling

### SpectrumAnalyzer Class
Located in `tools/python/parsers/analyze_spectra.py`

Supports multiple formats:
- JCAMP-DX (via `jcamp` package)
- HDF5 (via `h5py`)
- NetCDF (via `netCDF4`)
- CSV/TSV (via `pandas`)
- Excel (via `openpyxl`)

Methods:
- `load(filename)`: Load spectrum from file
- `compute_fft()`: Frequency domain analysis
- `detect_peaks(min_height, min_distance)`: Peak detection
- `baseline_correction(degree)`: Polynomial baseline subtraction
- `smooth(window_size)`: Moving average smoothing
- `stats()`: Compute statistics
- `analyze(all=True, **kwargs)`: Run selected analyses

### CLI Usage
```bash
python analyze_spectra.py --file spectrum.jdx --peaks --fft --baseline --output result.json

# Parameters:
#   --file: Input file path (required)
#   --peaks: Detect peaks
#   --fft: Compute FFT
#   --baseline: Correct baseline
#   --smooth: Smooth spectrum
#   --stats: Compute statistics
#   --all: Run all analyses
#   --output: Output JSON file
```

### Library Usage
```python
from analyze_spectra import SpectrumAnalyzer

analyzer = SpectrumAnalyzer()
analyzer.load('spectrum.csv')
results = analyzer.analyze(peaks=True, fft=True)
print(results)
```

## Dependencies

### Frontend
- `papaparse`: ^5.4.1 (CSV/TSV parsing)
- `jcamp`: ^1.0.4 (JCAMP format support)
- `recharts`: ^2.12.0 (Visualization)
- `react`: ^18.2.0
- `react-router`: ^7.6.0
- `tailwindcss`: Latest (Styling)

### Python Backend
- `numpy`: Scientific computing
- `scipy`: Advanced algorithms (FFT, signal processing)
- `jcamp`: JCAMP-DX format reading
- `h5py`: HDF5 file support
- `netCDF4`: NetCDF format support
- `pandas`: Data manipulation
- `openpyxl`: Excel file support
- `scikit-learn`: Machine learning (optional enhancements)
- `matplotlib`: Visualization (optional)

## Getting Started

### Development
```bash
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

Visit `http://localhost:4002` (or 4003/4004 if ports are in use)

### Upload Spectrum Data
1. Drag and drop or select a CSV/TSV/JCAMP file
2. System auto-detects format and columns
3. Redirected to `/spectral/[fileId]` analysis page

### Analyze Spectrum
1. Select Y column (defaults to "intensity")
2. Choose analysis type (all, stats, FFT, peaks)
3. View interactive visualization and results
4. Re-analyze with different parameters

### Sample Data
A sample CSV spectrum file is provided at `public/sample-spectrum.csv`:
```csv
wavelength,intensity,absorbance
400,100,0.5
410,120,0.48
...
```

## Known Limitations & Future Work

### Phase 1 (Complete ✓)
- ✓ CSV/TSV parsing
- ✓ JCAMP architecture
- ✓ FFT implementation
- ✓ Peak detection
- ✓ Baseline correction
- ✓ Smoothing & normalization
- ✓ Web UI with visualization

### Phase 2 (Partial ✓)
- ✓ HDF5 support (Python backend)
- ✓ NetCDF support (Python backend)
- ⏳ JavaScript FITS support (fitsjs not yet integrated)
- ⏳ Enhanced peak fitting (Gaussian optimization)

### Future Enhancements
- Multi-spectrum comparison
- Export results (PDF, Excel, JSON)
- Custom FFT optimization (Cooley-Tukey)
- Machine learning classification
- Integration with spectroscopy databases
- Real-time streaming analysis

## API Examples

### Upload Spectrum
```bash
POST /api/upload
Content-Type: application/json

{
  "fileUrl": "https://...",
  "filename": "sample.csv",
  "fileSize": 1024,
  "mimeType": "text/csv"
}

Response:
{
  "fileId": "file_xyz123",
  "parsed": {
    "columnNames": ["wavelength", "intensity", "absorbance"],
    "rowCount": 15,
    "detectedFormat": "csv"
  }
}
```

### Analyze Spectrum
```bash
POST /api/spectral-analysis
Content-Type: application/json

{
  "fileId": "file_xyz123",
  "yColumnName": "intensity",
  "xColumnName": "wavelength",
  "analysisType": "all"
}

Response:
{
  "fileId": "file_xyz123",
  "yColumn": [100, 120, 150, ...],
  "xColumn": [400, 410, 420, ...],
  "analyses": {
    "stats": {
      "mean": 150.5,
      "stdDev": 45.2,
      "min": 70,
      "max": 300,
      "range": 230,
      "count": 15
    },
    "fft": {
      "magnitude": [1500, 450, 200, ...],
      "phase": [0, 1.57, 3.14, ...]
    },
    "peaks": {
      "indices": [9, 15],
      "intensities": [300, 280]
    },
    "normalized": [0.33, 0.4, 0.5, ...],
    "smoothed": [105, 118, 145, ...],
    "baseline": [98, 115, 140, ...]
  }
}
```

## Performance Notes

- **FFT**: Naive DFT implementation, O(n²) complexity. Suitable for typical spectra (< 10k points). Consider Cooley-Tukey FFT for larger datasets.
- **Peak Detection**: Simple local maxima, O(n). Can be enhanced with SNR thresholding and Gaussian fitting.
- **Visualization**: Recharts handles up to ~1000 points smoothly. Larger datasets may need aggregation.

## License

Part of the Anything-SpecApp spectroscopy analysis platform.
