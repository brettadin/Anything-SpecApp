import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import upload from "@/app/api/utils/upload";

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

// Smart file parser that handles different formats and extracts metadata
function parseFileContent(content, filename) {
  const notes = [];
  let detectedFormat = "unknown";
  let hasHeaders = false;
  let delimiter = ",";
  let rows = [];
  let columnNames = [];
  let metadataRows = []; // Store metadata lines
  let spectralMetadata = {}; // Parsed key-value metadata
  let xColumn = null;
  let yColumns = [];
  let xRange = null;
  let yRange = null;
  let dataStartRow = 0;

  try {
    const ext = filename.toLowerCase().split(".").pop();
    notes.push(`File extension: ${ext}`);

    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "img"];
    if (imageExts.includes(ext)) {
      notes.push(`Image files (${ext}) are not supported for data parsing`);
      return {
        detectedFormat: "unsupported-image",
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

    if (ext === "fits" || ext === "fit") {
      notes.push(
        "FITS files require special binary parsing (not yet implemented)",
      );
      return {
        detectedFormat: "fits-binary",
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

    if (ext === "json") {
      try {
        const jsonData = JSON.parse(content);
        detectedFormat = "json";
        if (Array.isArray(jsonData)) {
          rows = jsonData;
          if (rows.length > 0 && typeof rows[0] === "object") {
            columnNames = Object.keys(rows[0]);
            hasHeaders = true;
          }
        } else if (typeof jsonData === "object") {
          columnNames = Object.keys(jsonData);
          rows = [jsonData];
          hasHeaders = true;
        }
        notes.push("Successfully parsed as JSON");
        return {
          detectedFormat,
          hasHeaders,
          delimiter: null,
          columnNames,
          rows,
          notes,
          metadataRows: [],
          spectralMetadata: {},
          xColumn: null,
          yColumns: [],
          xRange: null,
          yRange: null,
          dataStartRow: 0,
        };
      } catch (err) {
        notes.push(
          `JSON parse failed: ${err.message}, trying as delimited text`,
        );
      }
    }

    const lines = content.split(/\r?\n/);
    notes.push(`Total lines in file: ${lines.length}`);

    const nonEmptyLines = lines.filter((line) => line.trim());
    notes.push(`Non-empty lines: ${nonEmptyLines.length}`);

    if (nonEmptyLines.length === 0) {
      notes.push("File appears to be empty");
      return {
        detectedFormat: "empty",
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

    // NEW: Smarter delimiter detection - test against NUMERIC lines, not metadata
    const delimiters = [",", "\t", ";", "|", " "];
    let bestDelimiter = ",";
    let maxColumns = 0;

    // Find lines that look like numeric data (not metadata text)
    const numericLineIndices = [];
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip obvious comment lines
      if (
        line.startsWith("#") ||
        line.startsWith("//") ||
        line.startsWith("%") ||
        line.startsWith("!")
      ) {
        continue;
      }

      // Check if line has numbers - simple heuristic: contains digits and spaces/delimiters
      const hasNumbers = /\d/.test(line);
      const parts = line.split(/[\s,\t;|]+/);
      const numericParts = parts.filter(
        (p) => !isNaN(parseFloat(p)) && p.trim() !== "",
      ).length;

      // If most parts are numeric, this is likely a data line
      if (hasNumbers && numericParts >= 2) {
        numericLineIndices.push(i);
      }
    }

    notes.push(
      `Found ${numericLineIndices.length} potential data lines in first 50 lines`,
    );

    // Test delimiters on numeric lines
    if (numericLineIndices.length > 0) {
      const delimiterScores = {};

      for (const testDelim of delimiters) {
        const columnCounts = numericLineIndices.slice(0, 10).map((idx) => {
          const line = lines[idx].trim();
          // For space delimiter, split on multiple spaces to avoid splitting numbers
          if (testDelim === " ") {
            return line.split(/\s+/).filter((p) => p).length;
          }
          return line.split(testDelim).filter((p) => p.trim()).length;
        });

        // Calculate consistency - how often do we get the same column count?
        const mode = columnCounts
          .sort(
            (a, b) =>
              columnCounts.filter((v) => v === a).length -
              columnCounts.filter((v) => v === b).length,
          )
          .pop();

        const consistency =
          columnCounts.filter((c) => c === mode).length / columnCounts.length;
        const avgCols = mode;

        delimiterScores[testDelim] = { avgCols, consistency };
      }

      // Pick delimiter with best combination of column count and consistency
      let bestScore = 0;
      for (const [delim, score] of Object.entries(delimiterScores)) {
        const totalScore = score.avgCols * score.consistency;
        if (totalScore > bestScore && score.avgCols >= 2) {
          bestScore = totalScore;
          bestDelimiter = delim;
          maxColumns = score.avgCols;
        }
      }

      notes.push(
        `Best delimiter: "${bestDelimiter === "\t" ? "\\t" : bestDelimiter === " " ? "space" : bestDelimiter}" with ${maxColumns} columns (consistency: ${(delimiterScores[bestDelimiter].consistency * 100).toFixed(0)}%)`,
      );
    } else {
      // Fallback to old method
      for (const testDelim of delimiters) {
        const testLine = nonEmptyLines[0];
        const testCols = testLine.split(testDelim).length;
        if (testCols > maxColumns) {
          maxColumns = testCols;
          bestDelimiter = testDelim;
        }
      }
    }

    delimiter = bestDelimiter;

    detectedFormat =
      delimiter === "\t"
        ? "tsv"
        : delimiter === ";"
          ? "semicolon-separated"
          : delimiter === "|"
            ? "pipe-separated"
            : delimiter === " "
              ? "space-separated"
              : "csv";

    // Find where actual data starts (skip metadata/comments)
    dataStartRow = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        continue;
      }

      // Check for spectral data markers
      if (
        line.includes(">>>>>") ||
        line.includes("<<<<<") ||
        line.toLowerCase().includes("begin")
      ) {
        notes.push(`Found data marker at line ${i + 1}`);
        metadataRows.push({ line: i + 1, content: line, type: "marker" });
        continue;
      }

      // Skip common comment markers
      if (
        line.startsWith("#") ||
        line.startsWith("//") ||
        line.startsWith("%") ||
        line.startsWith("!")
      ) {
        notes.push(`Comment line ${i + 1}`);
        metadataRows.push({ line: i + 1, content: line, type: "comment" });
        continue;
      }

      // Parse potential key-value metadata
      const colonMatch = line.match(/^([^:]+):(.+)$/);
      if (colonMatch) {
        const key = colonMatch[1].trim();
        const value = colonMatch[2].trim();
        spectralMetadata[key] = value;
        metadataRows.push({
          line: i + 1,
          content: line,
          type: "key-value",
          key,
          value,
        });
        notes.push(`Metadata: ${key} = ${value}`);
        continue;
      }

      // NEW: Check if this line is metadata text (mostly words, not numbers)
      const parts =
        delimiter === " " ? line.split(/\s+/) : line.split(delimiter);
      const cleanParts = parts.map((p) => p.trim()).filter((p) => p);

      if (cleanParts.length >= 2) {
        const numericParts = cleanParts.filter(
          (p) => !isNaN(parseFloat(p)) && p !== "",
        ).length;
        const numericRatio = numericParts / cleanParts.length;

        // If less than 50% numeric and contains text words, treat as metadata
        if (
          numericRatio < 0.5 &&
          cleanParts.some((p) => /[a-zA-Z]{2,}/.test(p))
        ) {
          // This looks like metadata text, not data
          notes.push(
            `Metadata text at line ${i + 1}: ${line.substring(0, 60)}${line.length > 60 ? "..." : ""}`,
          );
          metadataRows.push({ line: i + 1, content: line, type: "text" });

          // Try to extract key-value if possible
          if (cleanParts.length === 2) {
            spectralMetadata[cleanParts[0]] = cleanParts[1];
          }
          continue;
        }

        // This line has enough columns and numeric data - likely start of data
        if (cleanParts.length >= 2 && numericRatio >= 0.5) {
          dataStartRow = i;
          notes.push(`Data starts at line ${i + 1}`);
          break;
        }
      }

      // Single value or weird format - treat as metadata
      metadataRows.push({ line: i + 1, content: line, type: "other" });
    }

    if (dataStartRow >= lines.length) {
      notes.push("No valid data rows found after metadata");
      return {
        detectedFormat,
        hasHeaders: false,
        delimiter,
        columnNames: [],
        rows: [],
        notes,
        metadataRows,
        spectralMetadata,
        xColumn: null,
        yColumns: [],
        xRange: null,
        yRange: null,
        dataStartRow,
      };
    }

    // Try to detect if first data row is a header
    const firstDataLine = lines[dataStartRow].trim();
    const firstCols = (
      delimiter === " "
        ? firstDataLine.split(/\s+/)
        : firstDataLine.split(delimiter)
    )
      .map((c) => c.trim())
      .filter((c) => c);

    hasHeaders = false;
    if (dataStartRow + 1 < lines.length) {
      const secondLine = lines[dataStartRow + 1].trim();
      if (secondLine) {
        const secondCols = (
          delimiter === " "
            ? secondLine.split(/\s+/)
            : secondLine.split(delimiter)
        )
          .map((c) => c.trim())
          .filter((c) => c);

        const firstNumCount = firstCols.filter(
          (c) => !isNaN(parseFloat(c)) && c !== "",
        ).length;
        const secondNumCount = secondCols.filter(
          (c) => !isNaN(parseFloat(c)) && c !== "",
        ).length;

        if (
          firstNumCount < secondNumCount &&
          secondNumCount >= firstCols.length / 2
        ) {
          hasHeaders = true;
          notes.push(
            "Detected header row (first row has text, second has numbers)",
          );
        }
      }
    }

    if (!hasHeaders) {
      const hasNoNumbers = firstCols.every(
        (c) => isNaN(parseFloat(c)) || c === "",
      );
      if (hasNoNumbers && firstCols.length > 1) {
        hasHeaders = true;
        notes.push("Detected header row (all text labels)");
      }
    }

    // Parse data rows
    const startRow = hasHeaders ? dataStartRow + 1 : dataStartRow;
    columnNames = hasHeaders
      ? firstCols
      : firstCols.map((_, i) => `Column_${i + 1}`);

    notes.push(`Column names: ${columnNames.join(", ")}`);

    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = (
        delimiter === " " ? line.split(/\s+/) : line.split(delimiter)
      )
        .map((v) => v.trim())
        .filter((v) => v);
      const row = {};

      columnNames.forEach((colName, idx) => {
        const val = values[idx] || "";
        const numVal = parseFloat(val);
        row[colName] = !isNaN(numVal) && val !== "" ? numVal : val;
      });

      rows.push(row);
    }

    notes.push(`Successfully parsed ${rows.length} data rows`);

    // Detect X and Y columns (spectral data detection)
    if (rows.length > 0 && columnNames.length >= 2) {
      const xIndicators = [
        "wavelength",
        "wave",
        "wl",
        "lambda",
        "nm",
        "wavenumber",
        "cm-1",
        "frequency",
        "freq",
        "hz",
      ];
      const yIndicators = [
        "intensity",
        "flux",
        "transmission",
        "absorbance",
        "counts",
        "%t",
        "reflectance",
      ];

      for (let i = 0; i < columnNames.length; i++) {
        const colName = columnNames[i].toLowerCase();
        if (xIndicators.some((ind) => colName.includes(ind))) {
          xColumn = columnNames[i];
          notes.push(`Detected X column (wavelength/frequency): ${xColumn}`);
          break;
        }
      }

      if (!xColumn && rows.length > 2) {
        const firstColValues = rows.slice(0, 10).map((r) => r[columnNames[0]]);
        const isNumeric = firstColValues.every((v) => typeof v === "number");
        if (isNumeric) {
          const isIncreasing = firstColValues.every(
            (v, i) => i === 0 || v > firstColValues[i - 1],
          );
          const isDecreasing = firstColValues.every(
            (v, i) => i === 0 || v < firstColValues[i - 1],
          );
          if (isIncreasing || isDecreasing) {
            xColumn = columnNames[0];
            notes.push(
              `Assuming first column is X (wavelength/frequency): ${xColumn} (monotonic ${isIncreasing ? "increasing" : "decreasing"})`,
            );
          }
        }
      }

      yColumns = columnNames.filter((col, idx) => {
        if (col === xColumn) return false;
        const sampleValues = rows.slice(0, 10).map((r) => r[col]);
        const isNumeric = sampleValues.every((v) => typeof v === "number");
        return isNumeric;
      });

      if (yColumns.length > 0) {
        notes.push(`Detected Y columns (intensity): ${yColumns.join(", ")}`);
      }

      if (xColumn) {
        const xValues = rows
          .map((r) => r[xColumn])
          .filter((v) => typeof v === "number");
        if (xValues.length > 0) {
          xRange = {
            min: Math.min(...xValues),
            max: Math.max(...xValues),
            count: xValues.length,
          };
          notes.push(
            `X range: ${xRange.min} to ${xRange.max} (${xRange.count} points)`,
          );
        }
      }

      if (yColumns.length > 0) {
        const allYValues = [];
        yColumns.forEach((yCol) => {
          const yValues = rows
            .map((r) => r[yCol])
            .filter((v) => typeof v === "number");
          allYValues.push(...yValues);
        });
        if (allYValues.length > 0) {
          yRange = {
            min: Math.min(...allYValues),
            max: Math.max(...allYValues),
            count: allYValues.length,
          };
          notes.push(
            `Y range: ${yRange.min} to ${yRange.max} (${yRange.count} points)`,
          );
        }
      }
    }
  } catch (err) {
    notes.push(`Parsing error: ${err.message}`);
    console.error("Parse error:", err);
  }

  return {
    detectedFormat,
    hasHeaders,
    delimiter,
    columnNames,
    rows,
    notes,
    metadataRows,
    spectralMetadata,
    xColumn,
    yColumns,
    xRange,
    yRange,
    dataStartRow,
  };
}

export async function POST(request) {
  const startTime = Date.now();
  console.log("=== UPLOAD REQUEST STARTED ===");

  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.log("Upload failed: User not authenticated");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`Upload by user: ${session.user.id}`);

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
    const parsed = parseFileContent(textContent, filename);
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

    // Store in database
    let fileId;
    try {
      const fileResult = await sql`
        INSERT INTO uploaded_files (user_id, filename, file_url, file_size, mime_type, metadata)
        VALUES (${session.user.id}, ${filename}, ${fileUrl}, ${fileSize || null}, ${mimeType || "text/plain"}, ${JSON.stringify({})})
        RETURNING id
      `;
      fileId = fileResult[0].id;
      console.log(`File record created: ID ${fileId}`);
    } catch (err) {
      console.error("Database insert failed:", err);
      return Response.json(
        { error: `Database error: ${err.message}` },
        { status: 500 },
      );
    }

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
    console.log(
      `Preview data size: ${JSON.stringify(previewData).length} bytes`,
    );
    console.log(
      `Full data size: ${JSON.stringify(fullDataToStore).length} bytes`,
    );

    try {
      const insertResult = await sql`
        INSERT INTO parsed_data (
          file_id, detected_format, has_headers, delimiter, 
          column_names, row_count, preview_data, full_data, parsing_notes,
          metadata_rows, spectral_metadata, x_column, y_columns,
          x_range, y_range, data_start_row
        )
        VALUES (
          ${fileId}, 
          ${parsed.detectedFormat}, 
          ${parsed.hasHeaders}, 
          ${parsed.delimiter || null},
          ${parsed.columnNames}, 
          ${parsed.rows.length}, 
          ${JSON.stringify(previewData)}, 
          ${JSON.stringify(fullDataToStore)}, 
          ${parsed.notes},
          ${JSON.stringify(parsed.metadataRows)},
          ${JSON.stringify(parsed.spectralMetadata)},
          ${parsed.xColumn || null},
          ${parsed.yColumns || []},
          ${parsed.xRange ? JSON.stringify(parsed.xRange) : null},
          ${parsed.yRange ? JSON.stringify(parsed.yRange) : null},
          ${parsed.dataStartRow || 0}
        )
        RETURNING id
      `;
      console.log(
        `Parsed data stored successfully with ID ${insertResult[0].id}`,
      );
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
