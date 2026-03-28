import { S3Client, PutObjectCommand  } from '@aws-sdk/client-s3';

const region = import.meta.env.VITE_SUPERBASE_S3_REGION;
const endpoint = import.meta.env.VITE_SUPERBASE_S3_BUCKET_ENDPOINT;
const accessKeyId = import.meta.env.VITE_SUPERBASE_S3_ACCESS_ID;
const secretAccessKey = import.meta.env.VITE_SUPERBASE_S3_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  forcePathStyle: true,
  region: region,
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  }
})

const uploadCommand = new PutObjectCommand({
  Bucket: 'bucket-name',
  Key: 'path/to/file',
  Body: file,
  ContentType: 'image/jpeg',
})
await s3Client.send(uploadCommand)