import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event, S3EventRecord } from "aws-lambda";
import csv from "csv-parser";
import { Readable } from "stream";
import { UPLOADED_PREFIX } from "../../constants/s3";

const s3 = new S3Client({});

function isUnderUploadedPrefix(key: string): boolean {
  return key.startsWith(UPLOADED_PREFIX) && key.length > UPLOADED_PREFIX.length;
}

async function parseObject(record: S3EventRecord): Promise<void> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  if (!isUnderUploadedPrefix(key)) {
    console.log("Skipping object outside uploaded prefix:", { bucket, key });
    return;
  }

  console.log("Parsing CSV from S3:", { bucket, key });

  const response = await s3.send(
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
}

export async function handler(event: S3Event): Promise<void> {
  for (const record of event.Records) {
    await parseObject(record);
  }
}
