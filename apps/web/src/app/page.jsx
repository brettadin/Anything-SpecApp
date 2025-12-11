"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Menu, X } from "lucide-react";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";

export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [upload, { loading: uploadLoading }] = useUpload();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setError(null);

    try {
      // Upload file directly to storage (supports large files)
      const { url, mimeType, error: uploadError } = await upload({ file });

      if (uploadError) {
        throw new Error(uploadError);
      }

      if (!url) {
        throw new Error("No URL returned from upload");
      }

      console.log(`File uploaded to storage: ${url}`);

      // Send file URL and metadata to backend for parsing
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: url,
          filename: file.name,
          fileSize: file.size,
          mimeType: mimeType || file.type || "text/plain",
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Upload failed with status ${response.status}`;

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseErr) {
            console.error("Failed to parse error response:", parseErr);
          }
        } else {
          try {
            const textError = await response.text();
            if (textError && textError.length < 500) {
              errorMessage = textError;
            }
          } catch (textErr) {
            console.error("Failed to read error text:", textErr);
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Redirect to file viewer
      window.location.href = `/file/${result.fileId}`;
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

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
                className="text-sm font-medium text-[#101828] hover:text-[#357AFF] transition-colors"
              >
                Upload
              </a>
              <a
                href="/history"
                className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
              >
                History
              </a>
              <a
                href="/docs"
                className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
              >
                Docs
              </a>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#667085]">{user.email}</span>
                  <a
                    href="/account/logout"
                    className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                  >
                    Sign Out
                  </a>
                </div>
              ) : (
                <a
                  href="/account/signin"
                  className="px-4 py-2 bg-[#357AFF] text-white text-sm font-medium rounded-lg hover:bg-[#2E69DE] transition-colors"
                >
                  Sign In
                </a>
              )}
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
                  className="text-sm font-medium text-[#101828] hover:text-[#357AFF] transition-colors"
                >
                  Upload
                </a>
                <a
                  href="/history"
                  className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                >
                  History
                </a>
                <a
                  href="/docs"
                  className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                >
                  Docs
                </a>
                {user ? (
                  <>
                    <span className="text-sm text-[#667085]">{user.email}</span>
                    <a
                      href="/account/logout"
                      className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
                    >
                      Sign Out
                    </a>
                  </>
                ) : (
                  <a
                    href="/account/signin"
                    className="text-sm font-medium text-[#357AFF] hover:text-[#2E69DE] transition-colors"
                  >
                    Sign In
                  </a>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-[#101828] mb-2">
            Upload Your Spectral Data
          </h2>
          <p className="text-[#667085]">
            Drop any file - CSV, TXT, TSV, or custom formats. We'll figure it
            out.
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
            isDragging
              ? "border-[#357AFF] bg-blue-50"
              : "border-[#D0D5DD] bg-white hover:border-[#357AFF] hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".csv,.txt,.tsv,.dat,.json,.xlsx,.xls"
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`p-4 rounded-full ${isDragging ? "bg-blue-100" : "bg-gray-100"}`}
            >
              <Upload
                size={32}
                className={isDragging ? "text-[#357AFF]" : "text-[#667085]"}
                strokeWidth={2}
              />
            </div>

            {uploading ? (
              <div className="text-center">
                <p className="text-lg font-medium text-[#101828]">
                  Uploading...
                </p>
                <p className="text-sm text-[#667085] mt-1">Please wait</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium text-[#101828]">
                  Drop your file here, or click to browse
                </p>
                <p className="text-sm text-[#667085] mt-1">
                  Supports CSV, TXT, TSV, JSON, Excel, and more
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg border border-[#EAECF0]">
            <h3 className="font-semibold text-[#101828] mb-2">
              Smart Detection
            </h3>
            <p className="text-sm text-[#667085]">
              Automatically detects delimiters, headers, and data structure
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-[#EAECF0]">
            <h3 className="font-semibold text-[#101828] mb-2">Any Format</h3>
            <p className="text-sm text-[#667085]">
              Works with messy files, metadata, and custom formats
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-[#EAECF0]">
            <h3 className="font-semibold text-[#101828] mb-2">Your Data</h3>
            <p className="text-sm text-[#667085]">
              All files saved to your account for easy access
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
