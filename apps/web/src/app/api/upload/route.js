// Database not configured for dev - will implement later
// import sql from "@/app/api/utils/sql";

// Configure Next.js to allow large file uploads for App Router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds timeout

// IMPORTANT: Configure body parser for large files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
    responseLimit: false,
  },
};

import { parseTextFile } from '@/app/api/utils/parsers';

// Smart file parser that handles different formats and extracts metadata
async function parseFileContent(content, filename) {
  // Delegate to parsers utility (uses papaparse and jcamp where possible)
  try {
    const result = await parseTextFile(content, filename);
    // Keep compatibility with previous structure by ensuring keys exist
    return {
      detectedFormat: result.detectedFormat || 'unknown',
      hasHeaders: result.hasHeaders || false,
      delimiter: result.delimiter || null,
      columnNames: result.columnNames || [],
      rows: result.rows || [],
      notes: result.notes || [],
      metadataRows: result.metadataRows || [],
      spectralMetadata: result.spectralMetadata || {},
      xColumn: result.xColumn || null,
      yColumns: result.yColumns || [],
      xRange: result.xRange || null,
      yRange: result.yRange || null,
      dataStartRow: result.dataStartRow || 0,
    };
  } catch (err) {
    console.error('Parser utility failed, falling back to legacy parser:', err);
    // Fallback: minimal legacy behavior (very small subset)
    const notes = [`Fallback legacy parser used due to: ${err.message}`];
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      return {
        detectedFormat: 'empty',
        hasHeaders: false,
        delimiter: null,
        columnNames: [],
        rows: [],
        notes,
        metadataRows: [],
        spectralMetadata: {},
        xColumn: null,
        yColumns: [],
        xRange: null,
        yRange: null,
        dataStartRow: 0,
      };
    }

    const delim = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : ',';
    const cols = lines[0].split(delim).map((c) => c.trim());
    const rows = lines.slice(1).map((l) => {
      const vals = l.split(delim).map((v) => v.trim());
      const obj = {};
      cols.forEach((c, i) => {
        const num = parseFloat(vals[i]);
        obj[c] = !isNaN(num) ? num : vals[i] || '';
      });
      return obj;
    });

    return {
      detectedFormat: delim === '\t' ? 'tsv' : 'csv',
      hasHeaders: true,
      delimiter: delim,
      columnNames: cols,
      rows,
      notes,
      metadataRows: [],
      spectralMetadata: {},
      xColumn: null,
      yColumns: [],
      xRange: null,
      yRange: null,
      dataStartRow: 1,
    };
  }
}

export async function action({ request }) {
  const startTime = Date.now();
  console.log("=== UPLOAD REQUEST STARTED ===");

  try {
    // Auth disabled for now - will implement custom auth later
    // const session = await auth();
    // if (!session || !session.user?.id) {
    //   console.log("Upload failed: User not authenticated");
    //   return Response.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // console.log(`Upload by user: ${session.user.id}`);

    // Get file URL and metadata from request
    const body = await request.json();
    const { fileUrl, filename, fileSize, mimeType } = body;

    if (!fileUrl || !filename) {
      console.log("Upload failed: Missing fileUrl or filename");
      return Response.json(
        { error: "Missing fileUrl or filename" },
        { status: 400 },
      );
    }

    console.log(`Processing: ${filename}, Size: ${fileSize}, URL: ${fileUrl}`);

    // Check file size (allow up to 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return Response.json(
        {
          error: `File too large. Maximum size is 100MB. Your file is ${(fileSize / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 },
      );
    }
    
    // Limit data URL size to prevent memory issues (10MB max)
    if (fileUrl.startsWith('data:') && fileUrl.length > 10 * 1024 * 1024) {
      return Response.json(
        {
          error: `Data URL too large. Maximum size is 10MB. Your data URL is ${(fileUrl.length / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 },
      );
    }

    // Fetch the file content from the URL
    let textContent = "";
    try {
      console.log(`Fetching file from URL: ${fileUrl}`);
      const fileResponse = await fetch(fileUrl);

      if (!fileResponse.ok) {
        throw new Error(
          `Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`,
        );
      }

      const arrayBuffer = await fileResponse.arrayBuffer();
      
      // Safety check on buffer size
      if (arrayBuffer.byteLength > 50 * 1024 * 1024) {
        throw new Error(`File too large after decoding: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB`);
      }
      
      const buffer = Buffer.from(arrayBuffer);

      console.log(`File fetched: ${buffer.length} bytes`);

      // Try to decode as UTF-8 text for parsing
      textContent = buffer.toString("utf-8");
      console.log(`Decoded to text: ${textContent.length} characters`);
    } catch (err) {
      console.log(`Failed to fetch or decode file: ${err.message}`);
      return Response.json(
        {
          error: `Failed to process file: ${err.message}`,
        },
        { status: 400 },
      );
    }

    // Parse the file
    console.log("Starting file parsing...");
    const parsed = await parseFileContent(textContent, filename);
    console.log(
      `Parsing complete: ${parsed.rows.length} rows, ${parsed.columnNames.length} columns, format: ${parsed.detectedFormat}`,
    );
    console.log(`Column names: ${parsed.columnNames.join(", ")}`);

    // Check if file format is unsupported
    if (
      parsed.detectedFormat === "unsupported-image" ||
      parsed.detectedFormat === "fits-binary"
    ) {
      console.log(`Unsupported format: ${parsed.detectedFormat}`);
      return Response.json(
        {
          error: `File format not supported: ${parsed.detectedFormat}`,
          notes: parsed.notes,
        },
        { status: 400 },
      );
    }

    // Store in database (disabled for now - no database configured)
    // For now, generate a temporary file ID
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`File record created: ID ${fileId}`);

    // Smart downsampling for large datasets
    const previewData = parsed.rows.slice(0, 100);
    let fullDataToStore = parsed.rows;

    // If we have more than 2000 rows, downsample for storage/visualization
    // Keep every Nth point to reduce to ~2000 points
    const MAX_STORAGE_POINTS = 2000;
    if (parsed.rows.length > MAX_STORAGE_POINTS) {
      const samplingRate = Math.ceil(parsed.rows.length / MAX_STORAGE_POINTS);
      fullDataToStore = parsed.rows.filter(
        (_, idx) => idx % samplingRate === 0,
      );
      parsed.notes.push(
        `Dataset downsampled from ${parsed.rows.length} to ${fullDataToStore.length} points for storage/visualization (every ${samplingRate}${samplingRate === 2 ? "nd" : samplingRate === 3 ? "rd" : "th"} point). Full data available in download.`,
      );
      console.log(
        `Downsampled from ${parsed.rows.length} to ${fullDataToStore.length} points`,
      );
    }

    console.log(
      `Preparing to store parsed data: ${fullDataToStore.length} rows (original: ${parsed.rows.length}), ${parsed.columnNames.length} columns`,
    );
    // Skip stringification of large data to avoid memory issues
    console.log(
      `Preview data size: ~${previewData.length * 50} bytes (estimated)`,
    );
    console.log(
      `Full data size: ~${fullDataToStore.length * 50} bytes (estimated)`,
    );

    try {
      // Database storage temporarily disabled - will implement later
      console.log('Skipping database insert (not configured for dev)');
      // Would insert into parsed_data table here
      const mockId = `temp-${Date.now()}`;
      console.log(`Parsed data would be stored with ID ${mockId}`);
    } catch (err) {
      console.error("Failed to store parsed data:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        code: err.code,
        detail: err.detail,
      });
      return Response.json(
        { error: `Failed to store parsed data: ${err.message}` },
        { status: 500 },
      );
    }

    const duration = Date.now() - startTime;
    console.log(`=== UPLOAD COMPLETE in ${duration}ms ===`);

    return Response.json({
      fileId,
      message: "File uploaded and parsed successfully",
      stats: {
        rows: parsed.rows.length,
        columns: parsed.columnNames.length,
        format: parsed.detectedFormat,
        xColumn: parsed.xColumn,
        yColumns: parsed.yColumns,
      },
      notes: parsed.notes,
    });
  } catch (error) {
    console.error("Upload error:", error);
    console.error("Stack trace:", error.stack);
    return Response.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function loader() {
  return Response.json({
    message: "POST a file with fileUrl, filename, fileSize, and mimeType to upload",
    example: {
      fileUrl: "https://example.com/file.csv",
      filename: "spectrum.csv",
      fileSize: 1024,
      mimeType: "text/csv"
    }
  });
}
