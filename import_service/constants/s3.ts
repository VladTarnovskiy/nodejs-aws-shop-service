export const UPLOADED_PREFIX = "uploaded/";
export const PARSED_PREFIX = "parsed/";

/** Base name; CDK appends `-<aws-account-id>` for a globally unique bucket. */
export const IMPORT_BUCKET_BASE_NAME = "aws-rs-front-import-bucket-tsk";

export function importBucketNameForAccount(accountId: string): string {
  return `${IMPORT_BUCKET_BASE_NAME}-${accountId}`;
}
