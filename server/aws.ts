import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

let region = (process.env.AWS_REGION || "us-east-1").trim();

// Correct common misconfiguration where AZ ID (e.g., use2-az1) is used instead of Region (e.g., us-east-2)
if (region.match(/^[a-z]{2,3}[0-9]-az[0-9]$/)) {
  const mapping: Record<string, string> = {
    'use1': 'us-east-1',
    'use2': 'us-east-2',
    'usw1': 'us-west-1',
    'usw2': 'us-west-2',
    'aps1': 'ap-southeast-1',
    'aps2': 'ap-southeast-2',
    'apn1': 'ap-northeast-1',
    'apn2': 'ap-northeast-2',
    'euw1': 'eu-west-1',
    'euc1': 'eu-central-1',
    'sae1': 'sa-east-1'
  };
  const prefix = region.split('-')[0];
  if (mapping[prefix]) {
    console.log(`Mapping AZ ID ${region} to Region ${mapping[prefix]}`);
    region = mapping[prefix];
  }
}

const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || "mock-key").trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || "mock-secret").trim();

// Create DynamoDB Client
const ddbClient = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const docClient = DynamoDBDocumentClient.from(ddbClient);

// Create S3 Client
export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "my-app-bucket";
