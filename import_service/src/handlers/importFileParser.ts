import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type { S3Event, S3EventRecord } from "aws-lambda";
import csv from "csv-parser";
import { Readable } from "stream";
import { importS3 } from "../s3/importS3Client";
import {
  isUnderUploadedPrefix,
  uploadedKeyToParsedKey,
} from "./importFileParserKeys";

async function moveToParsedFolder(bucket: string, uploadedKey: string): Promise<void> {
  const parsedKey = uploadedKeyToParsedKey(uploadedKey);

  await importS3.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${uploadedKey}`,
      Key: parsedKey,
    }),
  );

  await importS3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: uploadedKey,
    }),
  );

  console.log("Moved file to parsed folder:", {
    bucket,
    from: uploadedKey,
    to: parsedKey,
  });
}

async function parseObject(record: S3EventRecord): Promise<void> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  if (!isUnderUploadedPrefix(key)) {
    console.log("Skipping object outside uploaded prefix:", { bucket, key });
    return;
  }

  console.log("Parsing CSV from S3:", { bucket, key });

  const response = await importS3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  const body = response.Body;
  if (!body) {
    throw new Error(`Empty S3 object body: s3://${bucket}/${key}`);
  }

  const stream =
    body instanceof Readable ? body : Readable.from(body as AsyncIterable<Uint8Array>);

  await new Promise<void>((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (row: Record<string, string>) => {
        console.log("CSV record:", row);
      })
      .on("end", () => {
        console.log("Finished parsing:", { bucket, key });
        resolve();
      })
      .on("error", reject);
  });

  await moveToParsedFolder(bucket, key);
}

export async function handler(event: S3Event): Promise<void> {
  for (const record of event.Records) {
    await parseObject(record);
  }
}
