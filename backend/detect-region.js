const { S3Client, GetBucketLocationCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function findRegion() {
  const bucketName = process.env.AWS_BUCKET_NAME ? process.env.AWS_BUCKET_NAME.trim() : null;
  if (!bucketName) {
    console.error('ERROR: AWS_BUCKET_NAME not found in .env');
    return;
  }
  const client = new S3Client({
    region: 'us-east-1', // Try a global call
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    const command = new GetBucketLocationCommand({ Bucket: process.env.AWS_BUCKET_NAME.trim() });
    const response = await client.send(command);
    console.log('BUCKET_REGION:', response.LocationConstraint || 'us-east-1');
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

findRegion();
