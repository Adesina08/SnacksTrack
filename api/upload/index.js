import { IncomingForm } from 'formidable';
import { uploadToAzure, jsonResponse } from '../shared.js';

export default async function (context, req) {
  const form = new IncomingForm({ multiples: false });
  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });
    const file = files.file;
    if (!file) {
      context.res = jsonResponse(400, { message: 'No file uploaded' });
      return;
    }
    const result = await uploadToAzure(
      file.filepath,
      file.originalFilename,
      file.mimetype,
    );
    context.res = jsonResponse(200, result);
  } catch (err) {
    context.log('Upload failed:', err);
    context.res = jsonResponse(500, { message: 'Upload failed' });
  }
}
