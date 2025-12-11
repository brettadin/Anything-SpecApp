import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const files = await sql`
      SELECT 
        f.id,
        f.filename,
        f.file_size,
        f.mime_type,
        f.uploaded_at,
        p.detected_format,
        p.row_count,
        p.column_names
      FROM uploaded_files f
      LEFT JOIN parsed_data p ON f.id = p.file_id
      WHERE f.user_id = ${session.user.id}
      ORDER BY f.uploaded_at DESC
    `;

    return Response.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return Response.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}
