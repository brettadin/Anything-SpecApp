import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const result = await sql`
      SELECT 
        f.id,
        f.filename,
        f.file_url,
        f.file_size,
        f.mime_type,
        f.uploaded_at,
        p.detected_format,
        p.has_headers,
        p.delimiter,
        p.column_names,
        p.row_count,
        p.preview_data,
        p.full_data,
        p.parsing_notes
      FROM uploaded_files f
      LEFT JOIN parsed_data p ON f.id = p.file_id
      WHERE f.id = ${id} AND f.user_id = ${session.user.id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    return Response.json({ file: result[0] });
  } catch (error) {
    console.error("Error fetching file:", error);
    return Response.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const result = await sql`
      DELETE FROM uploaded_files
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    return Response.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
