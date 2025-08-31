import { S3Client } from '@aws-sdk/client-s3';


console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);

// Check if environment variables are set
if (!process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
    throw new Error("AWS_REGION or S3_BUCKET_NAME Environment Variables are not set!");
}

export const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    // When developing locally, the SDK will use the credentials below.
    // When deploying to AWS services (e.g. EC2, ECS), the best practice is to use IAM roles.
    // At that point, remove the credentials section, and the SDK will automatically get permissions from the environment.
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME;

console.log(`S3 client created for bucket ${BUCKET_NAME}`);



console.log("FRONTEND_URL:", process.env.FRONTEND_URL);