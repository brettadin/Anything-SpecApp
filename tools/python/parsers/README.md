# Python Spectral Analysis Tools

CLI and library tools for analyzing spectroscopy data across multiple formats.

## Formats Supported

- **JCAMP-DX** (.jdx, .jcamp) - IR, NMR, UV-Vis, ESR/EPR spectra
- **HDF5** (.h5, .hdf5) - Modern binary format
- **NetCDF** (.nc) - Meteorology/oceanography standard
- **CSV/TSV** (.csv, .tsv, .txt) - Delimited text
- **Excel** (.xlsx, .xls) - Spreadsheet

## Features

- **FFT** - Frequency domain analysis
- **Peak Detection** - Automated peak finding with scipy.signal
- **Baseline Correction** - Polynomial background removal
- **Smoothing** - Gaussian filtering
- **Statistics** - Mean, std dev, min, max, median

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Command Line

```bash
# Analyze with all features
python analyze_spectra.py --file spectrum.jdx --all

# Peaks only
python analyze_spectra.py --file data.csv --peaks

# FFT analysis with output
python analyze_spectra.py --file spectrum.h5 --fft --output result.json

# Baseline correction + peaks
python analyze_spectra.py --file ir_spectrum.csv --baseline --peaks
```

### As a Library

```python
from analyze_spectra import SpectrumAnalyzer

analyzer = SpectrumAnalyzer('spectrum.jdx')
analyzer.load()

# Run all analyses
result = analyzer.analyze(peaks=True, fft=True, baseline=True)
print(result)

# Individual functions
stats = analyzer.stats()
peaks = analyzer.detect_peaks(height=10)
fft_result = analyzer.compute_fft()
```

## Example Output

```json
{
  "file": "spectrum.jdx",
  "data_points": 512,
  "stats": {
    "mean": 45.2,
    "std": 12.3,
    "min": 5.1,
    "max": 98.7,
    "median": 42.0
  },
  "peaks": {
    "indices": [145, 234, 401],
    "values": [85.2, 72.1, 68.9],
    "count": 3
  },
  "fft": {
    "magnitude": [...],
    "phase": [...],
    "frequencies": [...]
  }
}
```
