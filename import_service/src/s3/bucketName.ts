/** Set by CDK on deploy (`IMPORT_BUCKET_NAME=<base>-<accountId>`). */
export function resolveImportBucketName(): string {
  return process.env.IMPORT_BUCKET_NAME?.trim() ?? "";
}
