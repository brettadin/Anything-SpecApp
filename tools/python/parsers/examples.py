#!/usr/bin/env python3
"""
Example usage of the SpectrumAnalyzer for various spectroscopy data formats.
Demonstrates both CLI and library usage patterns.
"""

import json
import numpy as np
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from analyze_spectra import SpectrumAnalyzer


def example_1_basic_csv_analysis():
    """Example 1: Load a CSV file and perform basic analysis"""
    print("\n" + "="*60)
    print("Example 1: Basic CSV Analysis")
    print("="*60)
    
    # Create a sample CSV file
    csv_data = """wavelength,intensity,absorbance
400,100,0.5
410,120,0.48
420,150,0.45
430,200,0.40
440,250,0.35
450,280,0.32
460,300,0.30
470,280,0.32
480,250,0.35
490,200,0.40
500,150,0.45"""
    
    sample_file = Path(__file__).parent / "sample_spectrum.csv"
    sample_file.write_text(csv_data)
    
    # Load and analyze
    analyzer = SpectrumAnalyzer()
    analyzer.load(str(sample_file))
    
    # Get statistics
    stats = analyzer.stats()
    print("\nStatistics:")
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")
    
    # Detect peaks
    peaks = analyzer.detect_peaks(min_height=150)
    print(f"\nPeaks detected: {len(peaks['indices'])} peak(s)")
    for idx, intensity in zip(peaks['indices'], peaks['intensities']):
        print(f"  Index {idx}: intensity {intensity:.1f}")
    
    # Clean up
    sample_file.unlink()
    

def example_2_full_pipeline():
    """Example 2: Complete analysis pipeline with all processing steps"""
    print("\n" + "="*60)
    print("Example 2: Full Analysis Pipeline")
    print("="*60)
    
    # Create sample data with noise
    np.random.seed(42)
    x = np.linspace(400, 800, 100)
    # Gaussian peaks
    y = (50 * np.exp(-((x-500)**2) / 5000) + 
         30 * np.exp(-((x-650)**2) / 8000) +
         np.random.normal(0, 5, 100))
    
    # Save as CSV
    csv_data = "wavelength,intensity\n"
    for xi, yi in zip(x, y):
        csv_data += f"{xi:.1f},{max(0, yi):.2f}\n"
    
    sample_file = Path(__file__).parent / "gaussian_spectrum.csv"
    sample_file.write_text(csv_data)
    
    # Run full analysis
    analyzer = SpectrumAnalyzer()
    analyzer.load(str(sample_file))
    
    results = analyzer.analyze(
        stats=True,
        fft=True,
        baseline=True,
        smooth=True,
        peaks=True,
        normalize=True
    )
    
    print("\nAnalysis Results:")
    print(f"  Statistics: {len(results.get('stats', {}))} values computed")
    print(f"  FFT: {len(results.get('fft', {}).get('magnitude', []))} frequency components")
    print(f"  Smoothed: {len(results.get('smoothed', []))} points")
    print(f"  Normalized: {len(results.get('normalized', []))} points")
    print(f"  Baseline: {len(results.get('baseline', []))} points")
    print(f"  Peaks: {len(results.get('peaks', {}).get('indices', []))} detected")
    
    # Save results
    results_file = Path(__file__).parent / "analysis_results.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {results_file}")
    
    # Clean up
    sample_file.unlink()


def example_3_multi_format_support():
    """Example 3: Demonstrate multi-format support capability"""
    print("\n" + "="*60)
    print("Example 3: Multi-Format Support")
    print("="*60)
    
    supported_formats = {
        '.csv': 'Comma-separated values (via pandas)',
        '.tsv': 'Tab-separated values (via pandas)',
        '.xlsx': 'Microsoft Excel (via openpyxl)',
        '.jdx/.dx': 'JCAMP-DX format (via jcamp)',
        '.h5/.hdf5': 'HDF5 format (via h5py)',
        '.nc': 'NetCDF format (via netCDF4)',
    }
    
    print("\nSupported Formats:")
    for fmt, desc in supported_formats.items():
        print(f"  {fmt}: {desc}")
    
    print("\nUsage:")
    print("  analyzer = SpectrumAnalyzer()")
    print("  analyzer.load('spectrum.jdx')  # Auto-detects format")
    print("  results = analyzer.analyze()")


def example_4_advanced_peak_detection():
    """Example 4: Advanced peak detection with parameters"""
    print("\n" + "="*60)
    print("Example 4: Advanced Peak Detection")
    print("="*60)
    
    # Create sample with multiple peaks
    np.random.seed(42)
    x = np.linspace(0, 100, 200)
    y = (100 * np.exp(-((x-20)**2)/50) +
         80 * np.exp(-((x-50)**2)/60) +
         60 * np.exp(-((x-80)**2)/40) +
         np.random.normal(0, 3, 200))
    
    csv_data = "index,intensity\n"
    for xi, yi in zip(x, y):
        csv_data += f"{xi:.1f},{max(0, yi):.2f}\n"
    
    sample_file = Path(__file__).parent / "multi_peak.csv"
    sample_file.write_text(csv_data)
    
    analyzer = SpectrumAnalyzer()
    analyzer.load(str(sample_file))
    
    # Different sensitivity levels
    for min_height in [30, 50, 70]:
        peaks = analyzer.detect_peaks(
            min_height=min_height,
            min_distance=10
        )
        print(f"\nPeaks with min_height={min_height}:")
        print(f"  Found {len(peaks['indices'])} peak(s)")
        for idx, intensity in zip(peaks['indices'], peaks['intensities']):
            print(f"    Index {idx:.0f}: {intensity:.1f}")
    
    # Clean up
    sample_file.unlink()


def example_5_cli_usage():
    """Example 5: Show CLI usage commands"""
    print("\n" + "="*60)
    print("Example 5: Command-Line Interface Usage")
    print("="*60)
    
    commands = [
        ("Full analysis", "python analyze_spectra.py --file spectrum.csv --all"),
        ("Peak detection only", "python analyze_spectra.py --file spectrum.csv --peaks"),
        ("FFT analysis", "python analyze_spectra.py --file spectrum.csv --fft"),
        ("Baseline correction", "python analyze_spectra.py --file spectrum.csv --baseline"),
        ("Save results to file", "python analyze_spectra.py --file spectrum.csv --all --output results.json"),
    ]
    
    print("\nExample CLI Commands:")
    for desc, cmd in commands:
        print(f"\n  {desc}:")
        print(f"    {cmd}")


if __name__ == "__main__":
    print("\nSpectroscopy Data Analysis - Examples")
    print("=====================================")
    
    try:
        example_1_basic_csv_analysis()
    except Exception as e:
        print(f"Example 1 error: {e}")
    
    try:
        example_2_full_pipeline()
    except Exception as e:
        print(f"Example 2 error: {e}")
    
    example_3_multi_format_support()
    
    try:
        example_4_advanced_peak_detection()
    except Exception as e:
        print(f"Example 4 error: {e}")
    
    example_5_cli_usage()
    
    print("\n" + "="*60)
    print("Examples complete!")
    print("="*60 + "\n")
