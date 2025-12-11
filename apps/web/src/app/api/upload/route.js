import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import upload from "@/app/api/utils/upload";

// Smart file parser that handles different formats
function parseFileContent(content, filename) {
  const notes = [];
  let detectedFormat = "unknown";
  let hasHeaders = false;
  let delimiter = ",";
  let rows = [];
  let columnNames = [];

  try {
    // Detect file type from extension
    const ext = filename.toLowerCase().split(".").pop();
    notes.push(`File extension: ${ext}`);

    // Check for unsupported binary formats
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
      };
    }

    // Special handling for FITS files
    if (ext === "fits" || ext === "fit") {
      notes.push(
        "FITS files require special binary parsing (not yet implemented)",
      );
      notes.push("FITS is a binary astronomical data format");
      notes.push("Consider converting to CSV or text format first");
      return {
        detectedFormat: "fits-binary",
        hasHeaders: false,
        delimiter: null,
        columnNames: [],
        rows: [],
        notes,
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
        };
      } catch (err) {
        notes.push(
          `JSON parse failed: ${err.message}, trying as delimited text`,
        );
      }
    }

    // Split into lines (handle different line endings)
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
      };
    }

    // Detect delimiter by testing each one
    const delimiters = [",", "\t", ";", "|", " "];
    let maxColumns = 0;
    let bestDelimiter = ",";

    for (const testDelim of delimiters) {
      const testLine = nonEmptyLines[0];
      const testCols = testLine.split(testDelim).length;
      if (testCols > maxColumns) {
        maxColumns = testCols;
        bestDelimiter = testDelim;
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

    notes.push(
      `Detected delimiter: "${delimiter === "\t" ? "\\t" : delimiter === " " ? "space" : delimiter}"`,
    );
    notes.push(`Max columns detected: ${maxColumns}`);

    // Find where actual data starts (skip metadata/comments)
    let dataStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        continue;
      }

      // Skip common comment markers
      if (
        line.startsWith("#") ||
        line.startsWith("//") ||
        line.startsWith("%") ||
        line.startsWith("!")
      ) {
        notes.push(
          `Skipped comment line ${i + 1}: ${line.substring(0, 50)}${line.length > 50 ? "..." : ""}`,
        );
        continue;
      }

      // Check if this line has the delimiter
      const cols = line.split(delimiter);
      if (cols.length >= 2) {
        dataStartIndex = i;
        notes.push(`Data starts at line ${i + 1}`);
        break;
      }
    }

    if (dataStartIndex >= lines.length) {
      notes.push("No valid data rows found after metadata");
      return {
        detectedFormat,
        hasHeaders: false,
        delimiter,
        columnNames: [],
        rows: [],
        notes,
      };
    }

    // Try to detect if first data row is a header
    const firstDataLine = lines[dataStartIndex].trim();
    const firstCols = firstDataLine.split(delimiter).map((c) => c.trim());

    hasHeaders = false;
    if (dataStartIndex + 1 < lines.length) {
      const secondLine = lines[dataStartIndex + 1].trim();
      if (secondLine) {
        const secondCols = secondLine.split(delimiter).map((c) => c.trim());

        // Count how many cells in each row look like numbers
        const firstNumCount = firstCols.filter(
          (c) => !isNaN(parseFloat(c)) && c !== "",
        ).length;
        const secondNumCount = secondCols.filter(
          (c) => !isNaN(parseFloat(c)) && c !== "",
        ).length;

        // If first row has fewer numbers than second, it's probably a header
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

    // If we still don't think there's a header, check if first row looks like labels
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
    const startRow = hasHeaders ? dataStartIndex + 1 : dataStartIndex;
    columnNames = hasHeaders
      ? firstCols
      : firstCols.map((_, i) => `Column_${i + 1}`);

    notes.push(`Column names: ${columnNames.join(", ")}`);

    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(delimiter).map((v) => v.trim());
      const row = {};

      columnNames.forEach((colName, idx) => {
        const val = values[idx] || "";
        // Try to parse as number if possible
        const numVal = parseFloat(val);
        row[colName] = !isNaN(numVal) && val !== "" ? numVal : val;
      });

      rows.push(row);
    }

    notes.push(`Successfully parsed ${rows.length} data rows`);
  } catch (err) {
    notes.push(`Parsing error: ${err.message}`);
    console.error("Parse error:", err);
  }

  return { detectedFormat, hasHeaders, delimiter, columnNames, rows, notes };
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

    // Parse FormData instead of JSON
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      console.log("Upload failed: No file in request");
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name;
    const fileSize = file.size;
    const mimeType = file.type || "text/plain";

    console.log(`Filename: ${filename}, Size: ${fileSize}, MIME: ${mimeType}`);

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`File buffer created: ${buffer.length} bytes`);

    // Try to decode as UTF-8 text for parsing
    let textContent = "";
    try {
      textContent = buffer.toString("utf-8");
      console.log(`Decoded to text: ${textContent.length} characters`);
    } catch (err) {
      console.log(`Failed to decode as UTF-8: ${err.message}`);
      return Response.json(
        {
          error: `File appears to be binary and cannot be decoded as text. Error: ${err.message}`,
        },
        { status: 400 },
      );
    }

    // Upload file buffer to storage
    let fileUrl;
    try {
      const uploadResult = await upload({ buffer });
      fileUrl = uploadResult.url;
      console.log(`File uploaded to storage: ${fileUrl}`);
    } catch (err) {
      console.error("Upload to storage failed:", err);
      return Response.json(
        { error: `Failed to store file: ${err.message}` },
        { status: 500 },
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
        VALUES (${session.user.id}, ${filename}, ${fileUrl}, ${fileSize || null}, ${mimeType}, ${JSON.stringify({})})
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

    // Store parsed data (limit full_data to 5000 rows to avoid size issues)
    const previewData = parsed.rows.slice(0, 100);
    const fullDataToStore = parsed.rows.slice(0, 5000); // Limit to prevent JSONB size issues

    if (parsed.rows.length > 5000) {
      parsed.notes.push(
        `Note: Only storing first 5000 rows in database due to size limits. Full file has ${parsed.rows.length} rows.`,
      );
    }

    console.log(
      `Preparing to store parsed data: ${fullDataToStore.length} rows, ${parsed.columnNames.length} columns`,
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
          column_names, row_count, preview_data, full_data, parsing_notes
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
          ${parsed.notes}
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
