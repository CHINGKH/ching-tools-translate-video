
import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await request.body;

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        addRandomSuffix: true,
        maximumSizeInBytes: 100 * 1024 * 1024
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('Video uploaded:', blob.pathname);
      }
    });

    return response.status(200).json(result);
  } catch (error) {
    return response.status(400).json({
      error: error.message || 'Upload failed'
    });
  }
}
