import { auth } from '@/auth';
import sql from '@/app/api/utils/sql';
import {
  computeFFT,
  detectPeaks,
  correctBaseline,
  smoothSpectrum,
  normalizeSpectrum,
  computeStats,
} from '@/app/api/utils/spectral-analysis';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileId, yColumnName, xColumnName, analysisType } = body;

    if (!fileId || !yColumnName) {
      return Response.json(
        { error: 'Missing fileId or yColumnName' },
        { status: 400 }
      );
    }

    // Fetch parsed data from database
    const fileResult = await sql`
      SELECT pd.full_data, pd.column_names, pd.x_column, pd.y_columns
      FROM parsed_data pd
      JOIN uploaded_files uf ON pd.file_id = uf.id
      WHERE pd.file_id = ${fileId} AND uf.user_id = ${session.user.id}
      LIMIT 1
    `;

    if (fileResult.length === 0) {
      return Response.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    const data = fileResult[0];
    const fullData = typeof data.full_data === 'string' ? JSON.parse(data.full_data) : data.full_data;
    const yCol = yColumnName;
    const xCol = xColumnName || data.x_column || 'index';

    // Extract Y values
    const yValues = fullData.map((row) => row[yCol] || 0).filter((v) => typeof v === 'number');

    if (yValues.length === 0) {
      return Response.json(
        { error: 'No valid numeric data in specified column' },
        { status: 400 }
      );
    }

    const results = {
      fileId,
      yColumn: yCol,
      xColumn: xCol,
      analyses: {},
    };

    // Run requested analyses
    if (!analysisType || analysisType === 'all' || analysisType.includes('stats')) {
      results.analyses.stats = computeStats(yValues);
    }

    if (!analysisType || analysisType === 'all' || analysisType.includes('normalize')) {
      results.analyses.normalized = normalizeSpectrum(yValues);
    }

    if (!analysisType || analysisType === 'all' || analysisType.includes('smooth')) {
      results.analyses.smoothed = smoothSpectrum(yValues, 5);
    }

    if (!analysisType || analysisType === 'all' || analysisType.includes('fft')) {
      results.analyses.fft = computeFFT(yValues);
    }

    if (!analysisType || analysisType === 'all' || analysisType.includes('peaks')) {
      const baselineCorrected = correctBaseline(yValues, 1).correctedSpectrum;
      results.analyses.peaks = detectPeaks(baselineCorrected, {
        minHeight: results.analyses.stats?.mean || 0,
        minDistance: 2,
      });
    }

    if (!analysisType || analysisType === 'all' || analysisType.includes('baseline')) {
      results.analyses.baseline = correctBaseline(yValues, 1);
    }

    return Response.json(results);
  } catch (error) {
    console.error('Spectral analysis error:', error);
    return Response.json(
      { error: `Analysis failed: ${error.message}` },
      { status: 500 }
    );
  }
}
