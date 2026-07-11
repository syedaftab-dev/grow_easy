import { Router } from 'express';
import multer, { MulterError } from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { handleImport } from '../controllers/import.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB hard limit
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const isCSV =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (isCSV) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted.'));
    }
  },
});

// Multer error handler middleware
function multerErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, error: 'File too large. Maximum size is 10 MB.' });
      return;
    }
    res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    return;
  }
  if (err instanceof Error) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  next(err);
}

router.post('/import', upload.single('file'), multerErrorHandler, handleImport);

export { router as importRouter };
