"use client";

import { useState, useEffect } from "react";
import { FileText, Menu, X, Trash2, Clock, Database } from "lucide-react";
import useUser from "@/utils/useUser";

export default function HistoryPage() {
  const { data: user, loading: userLoading } = useUser();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!userLoading && user) {
      fetchFiles();
    }
  }, [user, userLoading]);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setDeletingId(fileId);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (userLoading) {
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
            Please sign in to view your files
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
                className="text-sm font-medium text-[#101828] hover:text-[#357AFF] transition-colors"
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
                  className="text-sm font-medium text-[#101828] hover:text-[#357AFF] transition-colors"
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
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-[#101828] mb-2">
            Your Files
          </h2>
          <p className="text-[#667085]">
            View and manage all your uploaded spectral data files
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-[#667085]">Loading files...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-600">
            {error}
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#EAECF0] p-12 text-center">
            <Database size={48} className="text-[#D0D5DD] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#101828] mb-2">
              No files yet
            </h3>
            <p className="text-[#667085] mb-6">
              Upload your first file to get started
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-[#357AFF] text-white text-sm font-medium rounded-lg hover:bg-[#2E69DE] transition-colors"
            >
              Upload File
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EAECF0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#EAECF0]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Format
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Rows
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Size
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0]">
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <a
                          href={`/file/${file.id}`}
                          className="font-medium text-[#101828] hover:text-[#357AFF] transition-colors"
                        >
                          {file.filename}
                        </a>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-[#667085]">
                        {file.detected_format || "Unknown"}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-[#667085]">
                        {file.row_count?.toLocaleString() || "-"}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-[#667085]">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-[#667085]">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {formatDate(file.uploaded_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteFile(file.id)}
                          disabled={deletingId === file.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 p-2"
                          title="Delete file"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
