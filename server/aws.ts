import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Create S3 Client (Credentials and Region automatically resolved via IAM/Environment)
export const s3Client = new S3Client({});

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "my-app-bucket";
