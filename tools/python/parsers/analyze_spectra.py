"""Python spectral analysis tools supporting multiple formats.

Supports:
  - JCAMP-DX (jcamp package)
  - HDF5 (h5py)
  - NetCDF (netCDF4)
  - CSV/TSV (pandas)
  - Excel (openpyxl)

Usage:
  python analyze_spectra.py --file spectrum.jdx --output analysis.json
  python analyze_spectra.py --file data.csv --peaks --fft
"""

import json
import sys
from pathlib import Path
from typing import Optional, Dict, List, Any
import argparse

import numpy as np
import pandas as pd
from scipy import signal, fft as scipy_fft
from scipy.ndimage import gaussian_filter1d

try:
    import jcamp
    HAS_JCAMP = True
except ImportError:
    HAS_JCAMP = False

try:
    import h5py
    HAS_HDF5 = True
except ImportError:
    HAS_HDF5 = False

try:
    from netCDF4 import Dataset
    HAS_NETCDF = True
except ImportError:
    HAS_NETCDF = False


class SpectrumAnalyzer:
    """Multi-format spectrum analyzer."""

    def __init__(self, filepath: str):
        self.filepath = Path(filepath)
        self.data: Optional[np.ndarray] = None
        self.x_values: Optional[np.ndarray] = None
        self.y_values: Optional[np.ndarray] = None
        self.metadata: Dict[str, Any] = {}

    def load(self) -> bool:
        """Load spectrum from file (auto-detect format)."""
        suffix = self.filepath.suffix.lower()

        if suffix in ['.jdx', '.jcamp'] and HAS_JCAMP:
            return self._load_jcamp()
        elif suffix == '.h5' and HAS_HDF5:
            return self._load_hdf5()
        elif suffix == '.nc' and HAS_NETCDF:
            return self._load_netcdf()
        elif suffix in ['.csv', '.tsv', '.txt']:
            return self._load_csv()
        elif suffix in ['.xlsx', '.xls']:
            return self._load_excel()
        else:
            print(f"Unsupported format: {suffix}")
            return False

    def _load_jcamp(self) -> bool:
        """Load JCAMP-DX format."""
        try:
            with open(self.filepath) as f:
                parsed = jcamp.load(f)
            
            # Extract XY data
            if hasattr(parsed, 'x') and hasattr(parsed, 'y'):
                self.x_values = np.array(parsed.x)
                self.y_values = np.array(parsed.y)
                self.metadata = vars(parsed) if hasattr(parsed, '__dict__') else {}
                return True
        except Exception as e:
            print(f"JCAMP load error: {e}")
        return False

    def _load_hdf5(self) -> bool:
        """Load HDF5 format."""
        try:
            with h5py.File(self.filepath, 'r') as f:
                # Look for standard dataset names
                if 'x' in f and 'y' in f:
                    self.x_values = np.array(f['x'])
                    self.y_values = np.array(f['y'])
                    return True
                elif 'data' in f:
                    self.y_values = np.array(f['data'])
                    self.x_values = np.arange(len(self.y_values))
                    return True
        except Exception as e:
            print(f"HDF5 load error: {e}")
        return False

    def _load_netcdf(self) -> bool:
        """Load NetCDF format."""
        try:
            ds = Dataset(self.filepath)
            # Look for coordinate variables
            vars_list = list(ds.variables.keys())
            if 'x' in vars_list and 'y' in vars_list:
                self.x_values = np.array(ds['x'][:])
                self.y_values = np.array(ds['y'][:])
                self.metadata = {k: ds.getncattr(k) for k in ds.ncattrs()}
                ds.close()
                return True
            ds.close()
        except Exception as e:
            print(f"NetCDF load error: {e}")
        return False

    def _load_csv(self) -> bool:
        """Load CSV/TSV format."""
        try:
            sep = '\t' if self.filepath.suffix.lower() == '.tsv' else ','
            df = pd.read_csv(self.filepath, sep=sep)
            
            cols = df.columns.tolist()
            if len(cols) >= 2:
                self.x_values = df[cols[0]].to_numpy(dtype=float)
                self.y_values = df[cols[1]].to_numpy(dtype=float)
                return True
            elif len(cols) == 1:
                self.y_values = df[cols[0]].to_numpy(dtype=float)
                self.x_values = np.arange(len(self.y_values))
                return True
        except Exception as e:
            print(f"CSV load error: {e}")
        return False

    def _load_excel(self) -> bool:
        """Load Excel format."""
        try:
            df = pd.read_excel(self.filepath, sheet_name=0)
            cols = df.columns.tolist()
            if len(cols) >= 2:
                self.x_values = df[cols[0]].to_numpy(dtype=float)
                self.y_values = df[cols[1]].to_numpy(dtype=float)
                return True
        except Exception as e:
            print(f"Excel load error: {e}")
        return False

    def compute_fft(self) -> Optional[Dict[str, Any]]:
        """Compute FFT of spectrum."""
        if self.y_values is None:
            return None

        fft_vals = scipy_fft.fft(self.y_values)
        freqs = scipy_fft.fftfreq(len(self.y_values))
        magnitude = np.abs(fft_vals)

        return {
            'magnitude': magnitude.tolist(),
            'phase': np.angle(fft_vals).tolist(),
            'frequencies': freqs.tolist(),
        }

    def detect_peaks(self, height: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """Detect peaks in spectrum."""
        if self.y_values is None:
            return None

        if height is None:
            height = np.mean(self.y_values)

        peaks, properties = signal.find_peaks(self.y_values, height=height, distance=2)

        return {
            'indices': peaks.tolist(),
            'values': self.y_values[peaks].tolist(),
            'count': len(peaks),
        }

    def baseline_correction(self, poly_order: int = 1) -> Optional[np.ndarray]:
        """Remove polynomial baseline."""
        if self.y_values is None:
            return None

        coeffs = np.polyfit(np.arange(len(self.y_values)), self.y_values, poly_order)
        baseline = np.polyval(coeffs, np.arange(len(self.y_values)))
        corrected = self.y_values - baseline

        return corrected

    def smooth(self, sigma: float = 1.0) -> Optional[np.ndarray]:
        """Smooth spectrum (Gaussian filter)."""
        if self.y_values is None:
            return None
        return gaussian_filter1d(self.y_values, sigma=sigma)

    def stats(self) -> Optional[Dict[str, float]]:
        """Compute spectral statistics."""
        if self.y_values is None:
            return None

        return {
            'mean': float(np.mean(self.y_values)),
            'std': float(np.std(self.y_values)),
            'min': float(np.min(self.y_values)),
            'max': float(np.max(self.y_values)),
            'median': float(np.median(self.y_values)),
        }

    def analyze(self, peaks: bool = False, fft: bool = False, baseline: bool = False) -> Dict[str, Any]:
        """Run complete analysis."""
        result = {
            'file': str(self.filepath),
            'data_points': len(self.y_values) if self.y_values is not None else 0,
            'stats': self.stats(),
        }

        if baseline:
            corrected = self.baseline_correction()
            result['baseline_corrected'] = corrected.tolist() if corrected is not None else None

        if fft:
            result['fft'] = self.compute_fft()

        if peaks:
            result['peaks'] = self.detect_peaks()

        return result


def main():
    """CLI for spectrum analysis."""
    parser = argparse.ArgumentParser(description='Analyze spectroscopy data')
    parser.add_argument('--file', required=True, help='Input file path')
    parser.add_argument('--peaks', action='store_true', help='Detect peaks')
    parser.add_argument('--fft', action='store_true', help='Compute FFT')
    parser.add_argument('--baseline', action='store_true', help='Baseline correction')
    parser.add_argument('--output', help='Output JSON file')
    parser.add_argument('--all', action='store_true', help='Run all analyses')

    args = parser.parse_args()

    analyzer = SpectrumAnalyzer(args.file)
    if not analyzer.load():
        print(f"Failed to load {args.file}")
        sys.exit(1)

    do_all = args.all or (not args.peaks and not args.fft and not args.baseline)
    result = analyzer.analyze(
        peaks=args.peaks or do_all,
        fft=args.fft or do_all,
        baseline=args.baseline or do_all,
    )

    output = json.dumps(result, indent=2)
    print(output)

    if args.output:
        Path(args.output).write_text(output)
        print(f"\nSaved to {args.output}")


if __name__ == '__main__':
    main()
