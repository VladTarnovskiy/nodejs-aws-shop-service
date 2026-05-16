import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { IMPORT_BUCKET_NAME, UPLOADED_PREFIX } from "../../constants/s3";

const PRESIGN_EXPIRES_SECONDS = 3600;

/** Safe single-segment filenames for `uploaded/${name}`. */
const CSV_NAME_PATTERN = /^[a-zA-Z0-9._-]+\.csv$/;

const s3 = new S3Client({});

function textResponse(statusCode: number, body: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain; charset=utf-8",
    },
    body,
  };
}

export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const bucketName = IMPORT_BUCKET_NAME;
  if (!bucketName) {
    return textResponse(500, "Server configuration error");
  }

  const name = event.queryStringParameters?.name?.trim();
  if (!name) {
    return textResponse(400, "Missing required query parameter: name");
  }
  if (!CSV_NAME_PATTERN.test(name)) {
    return textResponse(
      400,
      "Invalid name: use a single .csv file name (letters, digits, ._- only)",
    );
  }

  const key = `${UPLOADED_PREFIX}${name}`;
  // Do not set ContentType here: it becomes part of the signature and the
  // browser PUT must send the exact same header or S3 returns 403 (often shown as CORS).
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });

  return textResponse(200, signedUrl);
}
