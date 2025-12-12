# Quick Start Guide - Spectroscopy Analysis Platform

## 🚀 Start the Application

### 1. Install Dependencies
```bash
cd c:\Code\Anything-SpecApp\apps\web
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm run dev
```

Server will start on **http://localhost:4001/** (or 4002/4003 if ports are in use)

### 3. Test the Installation
```bash
npm exec vitest -- --run
# Expected: Test Files 3 passed (3), Tests 17 passed (17)
```

---

## 📊 Quick Workflow

### Option A: Use Sample Data
1. **Start server** → http://localhost:4001/
2. **Upload file** → `apps/web/public/sample-spectrum.csv`
3. **Auto-redirects** to analysis page at `/spectral/[fileId]`
4. **Explore results** → View spectrum, peaks, FFT, statistics

### Option B: Create Your Own CSV
Create a file like `my-spectrum.csv`:
```csv
wavelength,intensity,absorbance
400,100,0.5
410,120,0.48
420,150,0.45
430,200,0.40
440,250,0.35
450,280,0.32
460,300,0.30
```

Then:
1. Upload via drag-and-drop
2. See automatic analysis
3. Export or re-analyze

---

## 🐍 Using Python Tools

### Basic Analysis
```bash
cd c:\Code\Anything-SpecApp\tools\python\parsers

# Install dependencies
pip install -r requirements.txt

# Analyze a spectrum
python analyze_spectra.py --file spectrum.csv --all

# Save results
python analyze_spectra.py --file spectrum.csv --all --output results.json
```

### As a Library
```python
from analyze_spectra import SpectrumAnalyzer

analyzer = SpectrumAnalyzer()
analyzer.load('spectrum.csv')
stats = analyzer.stats()
peaks = analyzer.detect_peaks(min_height=50)
fft = analyzer.compute_fft()

print(f"Mean: {stats['mean']:.2f}")
print(f"Peaks found: {len(peaks['indices'])}")
```

### Run Examples
```bash
python examples.py
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/app/page.jsx` | Upload page |
| `apps/web/src/app/spectral/[fileId]/page.tsx` | **Analysis page** |
| `apps/web/src/app/api/spectral-analysis/route.js` | Analysis API |
| `apps/web/src/app/api/utils/spectral-analysis.js` | **Algorithms** |
| `apps/web/src/components/spectral-visualizer.tsx` | **Chart components** |
| `tools/python/parsers/analyze_spectra.py` | **Python analyzer** |
| `apps/web/public/sample-spectrum.csv` | Sample data |

---

## 🧪 Run Tests

```bash
cd apps/web

# Run all tests
npm exec vitest -- --run

# Watch mode (auto-rerun on changes)
npm test

# Single test file
npm exec vitest -- --run test/parsers.test.ts
```

---

## 🔧 Troubleshooting

### Port Already in Use
Server auto-tries: 4000 → 4001 → 4002 → 4003

Check: What's running on port 4001?
```powershell
netstat -ano | findstr "4001"
```

### Module Not Found: papaparse
```bash
npm install papaparse --legacy-peer-deps
```

### Python Dependencies Missing
```bash
cd tools/python/parsers
pip install -r requirements.txt
```

### Tests Failing
```bash
# Clear cache and reinstall
rm -r node_modules
npm install --legacy-peer-deps
npm exec vitest -- --run
```

---

## 📊 Supported Formats

### Web Upload
- ✅ CSV files (`.csv`)
- ✅ TSV files (`.tsv`)
- ✅ JCAMP files (`.jdx`, `.dx`)

### Python Tools (6 formats)
- ✅ CSV/TSV (pandas)
- ✅ JCAMP-DX (jcamp)
- ✅ HDF5 (h5py)
- ✅ NetCDF (netCDF4)
- ✅ Excel (openpyxl)

---

## 🎯 Features

### Spectral Analysis
- **FFT** - Frequency domain analysis
- **Peak Detection** - Automatic peak identification
- **Baseline Correction** - Polynomial baseline subtraction
- **Smoothing** - Noise reduction
- **Normalization** - Intensity scaling
- **Statistics** - Mean, std dev, min, max, range

### Visualization
- Interactive charts (Recharts)
- Line, bar, and composed chart types
- Peak overlay on spectrum
- Statistical summary cards
- Zoom, pan, tooltip support

### Data Processing
- Auto-format detection
- Header row identification
- Column selection
- Metadata preservation
- Error handling & user feedback

---

## 📚 Documentation

- **IMPLEMENTATION_COMPLETE.md** - Full technical documentation
- **SPECTROSCOPY_ANALYSIS_README.md** - Feature detailed reference
- **tools/python/parsers/README.md** - Python tool documentation
- **apps/web/src/app/docs/** - Domain knowledge and references

---

## 💡 Common Tasks

### Task: Analyze with Different Columns
1. Go to `/spectral/[fileId]`
2. Change "Y Column Name" field
3. Click "Re-analyze"
4. Results update immediately

### Task: Export Analysis Results
1. Open browser DevTools (F12)
2. Go to Network tab
3. Re-run analysis
4. Click on POST to `/api/spectral-analysis`
5. Copy response JSON
6. Save to file

### Task: Batch Process Spectra (Python)
```python
import glob
from analyze_spectra import SpectrumAnalyzer

for file in glob.glob('spectra/*.csv'):
    analyzer = SpectrumAnalyzer()
    analyzer.load(file)
    results = analyzer.analyze(all=True)
    print(f"{file}: {len(results['peaks']['indices'])} peaks")
```

---

## 🚀 Next Steps

1. **Explore the UI** - Upload sample data, interact with controls
2. **Run Python Examples** - `python examples.py`
3. **Read Full Docs** - See IMPLEMENTATION_COMPLETE.md
4. **Customize Analysis** - Modify parameters, add algorithms
5. **Deploy** - Configure for production use

---

## 📞 Support

All code is documented with inline comments and examples:
- See `apps/web/test/` for algorithm usage examples
- See `tools/python/parsers/examples.py` for Python patterns
- Check API endpoints for request/response formats

**Everything is tested and ready to use!**
