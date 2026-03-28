import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = import.meta.env.VITE_SUPERBASE_S3_BUCKET as string;
const ENDPOINT = import.meta.env.VITE_SUPERBASE_S3_BUCKET_ENDPOINT as string;

const client = new S3Client({
  region: import.meta.env.VITE_SUPERBASE_S3_REGION as string,
  endpoint: import.meta.env.VITE_SUPERBASE_S3_BUCKET_ENDPOINT as string,
  credentials: {
    accessKeyId: import.meta.env.VITE_SUPERBASE_S3_ACCESS_ID as string,
    secretAccessKey: import.meta.env.VITE_SUPERBASE_S3_SECRET_ACCESS_KEY as string,
  },
  forcePathStyle: true,
});

/**
 * Upload a file to S3 and return its public URL.
 * Key format: livestock/{livestockId}/{filename}
 */
export async function uploadLivestockImage(
  livestockId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const key = `livestock/${livestockId}/photo.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const body = new Uint8Array(arrayBuffer);

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: file.type,
    })
  );

  // Construct the public URL from the Supabase storage endpoint
  // Format: {supabaseUrl}/object/public/{bucket}/{key}
  const baseUrl = ENDPOINT.replace('/storage/v1/s3', '');
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${key}`;
}

/**
 * Delete a livestock image from S3 given the full public URL.
 */
export async function deleteLivestockImage(imageUrl: string): Promise<void> {
  // Extract the key from the URL
  const marker = `/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return;
  const key = imageUrl.slice(idx + marker.length);

  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
