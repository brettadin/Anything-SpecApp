"use client";

import { useState, useEffect } from "react";
import { FileText, Menu, X, Download, Info, ArrowLeft } from "lucide-react";
import useUser from "@/utils/useUser";

export default function FileViewerPage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFullData, setShowFullData] = useState(false);

  useEffect(() => {
    if (!userLoading && user && params.id) {
      fetchFile();
    }
  }, [user, userLoading, params.id]);

  const fetchFile = async () => {
    try {
      const response = await fetch(`/api/files/${params.id}`);
      if (!response.ok) {
        throw new Error("File not found");
      }
      const data = await response.json();
      setFile(data.file);
    } catch (err) {
      console.error(err);
      setError("Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!file || !file.full_data) return;

    const data = file.full_data;
    const columns = file.column_names || [];

    // Create CSV content
    let csv = columns.join(",") + "\n";
    data.forEach((row) => {
      const values = columns.map((col) => {
        const val = row[col];
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      });
      csv += values.join(",") + "\n";
    });

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename.replace(/\.[^.]+$/, "") + "_processed.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter flex items-center justify-center">
        <div className="text-[#667085]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#667085] mb-4">
            Please sign in to view this file
          </p>
          <a
            href="/account/signin"
            className="px-4 py-2 bg-[#357AFF] text-white text-sm font-medium rounded-lg hover:bg-[#2E69DE] transition-colors inline-block"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "File not found"}</p>
          <a
            href="/history"
            className="px-4 py-2 bg-[#357AFF] text-white text-sm font-medium rounded-lg hover:bg-[#2E69DE] transition-colors inline-block"
          >
            Back to History
          </a>
        </div>
      </div>
    );
  }

  const dataToShow = showFullData ? file.full_data : file.preview_data;
  const isPreview = !showFullData && file.row_count > 100;

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-[#EAECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FileText size={28} className="text-[#357AFF]" strokeWidth={2} />
              <h1 className="text-xl font-semibold text-[#101828]">
                Spectral Analyzer
              </h1>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="/"
                className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
              >
                Upload
              </a>
              <a
                href="/history"
                className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
              >
                History
              </a>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#667085]">{user.email}</span>
                <a
                  href="/account/logout"
                  className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                >
                  Sign Out
                </a>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-[#667085] hover:text-[#101828]"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden py-4 border-t border-[#EAECF0]">
              <nav className="flex flex-col gap-4">
                <a
                  href="/"
                  className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                >
                  Upload
                </a>
                <a
                  href="/history"
                  className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                >
                  History
                </a>
                <span className="text-sm text-[#667085]">{user.email}</span>
                <a
                  href="/account/logout"
                  className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                >
                  Sign Out
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <a
          href="/history"
          className="inline-flex items-center gap-2 text-sm text-[#667085] hover:text-[#101828] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to History
        </a>

        {/* File Info */}
        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#101828] mb-2">
                {file.filename}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-[#667085]">
                <span>
                  Format:{" "}
                  <span className="font-medium">{file.detected_format}</span>
                </span>
                <span>
                  Rows:{" "}
                  <span className="font-medium">
                    {file.row_count?.toLocaleString()}
                  </span>
                </span>
                <span>
                  Columns:{" "}
                  <span className="font-medium">
                    {file.column_names?.length || 0}
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#357AFF] text-white text-sm font-medium rounded-lg hover:bg-[#2E69DE] transition-colors"
            >
              <Download size={16} />
              Download CSV
            </button>
          </div>

          {/* Parsing Notes */}
          {file.parsing_notes && file.parsing_notes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#EAECF0]">
              <div className="flex items-start gap-2">
                <Info
                  size={16}
                  className="text-[#357AFF] mt-0.5 flex-shrink-0"
                />
                <div className="text-sm">
                  <div className="font-medium text-[#101828] mb-1">
                    Parsing Notes:
                  </div>
                  <ul className="text-[#667085] space-y-1">
                    {file.parsing_notes.map((note, idx) => (
                      <li key={idx}>• {note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-[#EAECF0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EAECF0] flex items-center justify-between">
            <h3 className="font-semibold text-[#101828]">
              Data{" "}
              {isPreview && (
                <span className="text-[#667085] font-normal">
                  (showing first 100 rows)
                </span>
              )}
            </h3>
            {isPreview && (
              <button
                onClick={() => setShowFullData(true)}
                className="text-sm text-[#357AFF] hover:text-[#2E69DE] font-medium"
              >
                Show all {file.row_count} rows
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider sticky left-0 bg-gray-50">
                    #
                  </th>
                  {file.column_names?.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {dataToShow?.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 text-sm text-[#667085] sticky left-0 bg-white">
                      {rowIdx + 1}
                    </td>
                    {file.column_names?.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-6 py-3 text-sm text-[#101828] whitespace-nowrap"
                      >
                        {row[col] !== null && row[col] !== undefined
                          ? String(row[col])
                          : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
