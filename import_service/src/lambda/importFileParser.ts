import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import type { S3Event, S3EventRecord } from "aws-lambda";
import csv from "csv-parser";
import { Readable } from "stream";
import { importS3 } from "../s3/importS3Client";
import { importSqs } from "../sqs/importSqsClient";
import {
  isUnderUploadedPrefix,
  uploadedKeyToParsedKey,
} from "../utils/importFileParserKeys";

function catalogItemsQueueUrl(): string {
  const url = process.env.CATALOG_ITEMS_QUEUE_URL;
  if (!url) {
    throw new Error("CATALOG_ITEMS_QUEUE_URL is not configured");
  }
  return url;
}

export async function enqueueCatalogItem(
  row: Record<string, string>,
): Promise<void> {
  await importSqs.send(
    new SendMessageCommand({
      QueueUrl: catalogItemsQueueUrl(),
      MessageBody: JSON.stringify(row),
    }),
  );
}

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
    const rows: Record<string, string>[] = [];

    stream
      .pipe(csv())
      .on("data", (row: Record<string, string>) => {
        rows.push(row);
      })
      .on("end", () => {
        void (async () => {
          try {
            for (const row of rows) {
              await enqueueCatalogItem(row);
            }
            console.log("Finished parsing:", {
              bucket,
              key,
              records: rows.length,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        })();
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
