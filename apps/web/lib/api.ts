import type { ImportResponse } from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

/**
 * Sends the CSV file to the backend API for AI extraction.
 * Throws an Error with a user-readable message on any failure.
 */
export async function importCsv(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/import`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the API is running and NEXT_PUBLIC_API_URL is set correctly.',
    );
  }

  let data: ImportResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error ?? `Server error: HTTP ${response.status}`);
  }

  return data;
}
