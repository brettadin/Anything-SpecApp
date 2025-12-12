"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  SpectrumVisualizer,
  PeakDisplay,
  SpectralStats,
} from "@/components/spectral-visualizer";

interface AnalysisData {
  fileId: string;
  yColumn: number[];
  xColumn?: number[];
  analyses: {
    stats?: {
      mean: number;
      stdDev: number;
      min: number;
      max: number;
      range: number;
      count: number;
    };
    fft?: {
      magnitude: number[];
      phase: number[];
    };
    peaks?: {
      indices: number[];
      intensities: number[];
    };
    baseline?: number[];
    normalized?: number[];
    smoothed?: number[];
  };
}

export default function SpectralAnalysisPage() {
  const params = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yColumnName, setYColumnName] = useState("intensity");
  const [analysisType, setAnalysisType] = useState("all");

  useEffect(() => {
    if (!params.fileId) {
      setError("No file ID provided");
      setLoading(false);
      return;
    }

    // Fetch the analysis data
    runAnalysis();
  }, [params.fileId]);

  const runAnalysis = async () => {
    if (!params.fileId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/spectral-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: params.fileId,
          yColumnName,
          analysisType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Analysis failed with status ${response.status}`
        );
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing spectrum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-600">No analysis data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for visualization
  const chartData = data.xColumn
    ? data.xColumn.map((x, i) => ({
        x,
        y: data.yColumn[i],
        ...(data.analyses.normalized && { normalized: data.analyses.normalized[i] }),
        ...(data.analyses.smoothed && { smoothed: data.analyses.smoothed[i] }),
        ...(data.analyses.baseline && { baseline: data.analyses.baseline[i] }),
      }))
    : data.yColumn.map((y, i) => ({
        x: i,
        y,
        ...(data.analyses.normalized && { normalized: data.analyses.normalized[i] }),
        ...(data.analyses.smoothed && { smoothed: data.analyses.smoothed[i] }),
        ...(data.analyses.baseline && { baseline: data.analyses.baseline[i] }),
      }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Spectral Analysis
          </h1>
          <p className="text-gray-600">File ID: {data.fileId}</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y Column Name
              </label>
              <input
                type="text"
                value={yColumnName}
                onChange={(e) => setYColumnName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., intensity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Type
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Analyses</option>
                <option value="stats">Statistics Only</option>
                <option value="fft">FFT Only</option>
                <option value="peaks">Peak Detection</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition font-medium"
              >
                {loading ? "Analyzing..." : "Re-analyze"}
              </button>
            </div>
          </div>
        </div>

        {/* Main visualization */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Spectrum Visualization
          </h2>
          <SpectrumVisualizer
            data={chartData}
            xKey="x"
            yKey="y"
            chartType="line"
          />
        </div>

        {/* Statistics */}
        {data.analyses.stats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Statistical Summary
            </h2>
            <SpectralStats stats={data.analyses.stats} />
          </div>
        )}

        {/* Peak Detection */}
        {data.analyses.peaks && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Detected Peaks ({data.analyses.peaks.indices.length})
            </h2>
            <PeakDisplay
              peaks={{
                indices: data.analyses.peaks.indices,
                intensities: data.analyses.peaks.intensities,
              }}
              xValues={data.xColumn || Array.from({ length: data.yColumn.length }, (_, i) => i)}
            />
          </div>
        )}

        {/* FFT Results */}
        {data.analyses.fft && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Frequency Domain Analysis (FFT)
            </h2>
            <SpectrumVisualizer
              data={data.analyses.fft.magnitude.map((mag, i) => ({
                frequency: i,
                magnitude: mag,
                phase: data.analyses.fft?.phase[i] || 0,
              }))}
              xKey="frequency"
              yKey="magnitude"
              chartType="bar"
            />
          </div>
        )}

        {/* Processed spectra */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.analyses.normalized && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Normalized Spectrum
              </h3>
              <SpectrumVisualizer
                data={chartData.map((d) => ({
                  x: d.x,
                  y: d.normalized || 0,
                }))}
                xKey="x"
                yKey="y"
                chartType="line"
              />
            </div>
          )}
          {data.analyses.smoothed && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Smoothed Spectrum
              </h3>
              <SpectrumVisualizer
                data={chartData.map((d) => ({
                  x: d.x,
                  y: d.smoothed || 0,
                }))}
                xKey="x"
                yKey="y"
                chartType="line"
              />
            </div>
          )}
        </div>

        {/* Back button */}
        <div className="mt-8">
          <button
            onClick={() => navigate("/")}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
}
