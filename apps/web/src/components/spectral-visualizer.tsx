'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';

interface SpectrumPoint {
  index: number;
  value: number;
  [key: string]: any;
}

interface SpectrumVisualizerProps {
  data: Array<Record<string, any>>;
  xKey?: string;
  yKey?: string;
  title?: string;
  type?: 'line' | 'bar' | 'composed';
}

/**
 * Interactive spectrum visualization component
 * Supports line, bar, and composed charts
 */
export function SpectrumVisualizer({
  data,
  xKey = 'x',
  yKey = 'y',
  title = 'Spectrum',
  type = 'line',
}: SpectrumVisualizerProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-gray-500">No data available</div>;
  }

  const chartData = data.map((item, idx) => ({
    index: idx,
    [xKey]: item[xKey] ?? idx,
    [yKey]: item[yKey] ?? 0,
    ...item,
  }));

  return (
    <div className="w-full">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#8884d8" />
          </BarChart>
        ) : type === 'composed' ? (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#8884d8" isAnimationActive={false} />
            <Bar dataKey="smoothed" fill="#82ca9d" />
          </ComposedChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke="#8884d8" isAnimationActive={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

interface PeakDisplayProps {
  peaks: { indices: number[]; values: number[] };
  xValues?: number[];
}

/**
 * Display detected peaks with their locations and intensities
 */
export function PeakDisplay({ peaks, xValues }: PeakDisplayProps) {
  if (!peaks || !peaks.indices || peaks.indices.length === 0) {
    return <div className="p-4 text-gray-500">No peaks detected</div>;
  }

  return (
    <div className="w-full">
      <h3 className="mb-3 text-lg font-semibold">Detected Peaks</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Index</th>
              <th className="border border-gray-300 px-4 py-2">Position</th>
              <th className="border border-gray-300 px-4 py-2">Intensity</th>
            </tr>
          </thead>
          <tbody>
            {peaks.indices.map((idx, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{idx}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {xValues ? xValues[idx]?.toFixed(2) : idx}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {peaks.values[i]?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SpectralStatsProps {
  stats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    range: number;
    count: number;
  };
}

/**
 * Display spectral statistics (mean, std dev, min, max, etc.)
 */
export function SpectralStats({ stats }: SpectralStatsProps) {
  if (!stats) {
    return <div className="p-4 text-gray-500">No statistics available</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">Mean</div>
        <div className="mt-1 text-xl font-bold">{stats.mean?.toFixed(3)}</div>
      </div>
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">Std Dev</div>
        <div className="mt-1 text-xl font-bold">{stats.stdDev?.toFixed(3)}</div>
      </div>
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">Min</div>
        <div className="mt-1 text-xl font-bold">{stats.min?.toFixed(3)}</div>
      </div>
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">Max</div>
        <div className="mt-1 text-xl font-bold">{stats.max?.toFixed(3)}</div>
      </div>
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">Range</div>
        <div className="mt-1 text-xl font-bold">{stats.range?.toFixed(3)}</div>
      </div>
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold text-gray-600">Count</div>
        <div className="mt-1 text-xl font-bold">{stats.count}</div>
      </div>
    </div>
  );
}

// Import BarChart for composed chart
import { BarChart } from 'recharts';

export default {
  SpectrumVisualizer,
  PeakDisplay,
  SpectralStats,
};
