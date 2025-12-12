export async function GET(request) {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API is responding'
  });
}

export async function POST(request) {
  return Response.json({
    status: 'ok',
    method: 'POST',
    timestamp: new Date().toISOString(),
  });
}
