/**
 * functions/src/storage/imageUploader.ts
 *
 * Provides:
 *   uploadBufferToStorage({
 *     buffer: Buffer,
 *     destinationPath: "generated-images/example.png",
 *     contentType: "image/png",
 *   })
 *
 * Returns a PUBLIC URL suitable for Telegram inline results & bot messages.
 */

import { storage } from "firebase-admin";

interface UploadOptions {
  buffer: Buffer;
  destinationPath: string;
  contentType: string;
}

export async function uploadBufferToStorage({
  buffer,
  destinationPath,
  contentType,
}: UploadOptions): Promise<string> {
  const bucket = storage().bucket();

  const file = bucket.file(destinationPath);

  // Create parent folders if needed
  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000", // 1 year CDN cache
    },
    resumable: false,
  });

  // Make public
  await file.makePublic();

  // Return public URL
  return file.publicUrl(); // https://storage.googleapis.com/<bucket>/<path>
}