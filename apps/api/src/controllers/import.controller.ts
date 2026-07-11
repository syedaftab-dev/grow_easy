import type { Request, Response } from 'express';
import { parseCsv } from '../services/csv.service';
import { extractBatches } from '../services/ai.service';

/**
 * POST /api/import
 *
 * Accepts a multipart CSV upload, parses it, runs AI extraction in batches,
 * and returns structured imported + skipped records with a summary.
 */
export async function handleImport(req: Request, res: Response): Promise<void> {
  try {
    // Multer attaches the file to req.file
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded. Send a CSV as multipart/form-data field "file".' });
      return;
    }

    const csvText = req.file.buffer.toString('utf-8');

    // Step 1: Parse CSV → raw records
    const rawRecords = parseCsv(csvText);

    if (rawRecords.length === 0) {
      res.status(422).json({
        success: false,
        error: 'The uploaded CSV contains no parseable data rows. Check that the file has headers and at least one data row.',
      });
      return;
    }

    console.log(`[controller] Received ${rawRecords.length} rows from "${req.file.originalname}"`);

    // Step 2: AI extraction (batched, concurrent, with retries)
    const { imported, skipped } = await extractBatches(rawRecords);

    console.log(`[controller] Done — imported: ${imported.length}, skipped: ${skipped.length}`);

    res.json({
      success: true,
      summary: {
        total_rows: rawRecords.length,
        imported:   imported.length,
        skipped:    skipped.length,
      },
      imported,
      skipped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    console.error('[controller] Unhandled error:', err);
    res.status(500).json({ success: false, error: message });
  }
}
