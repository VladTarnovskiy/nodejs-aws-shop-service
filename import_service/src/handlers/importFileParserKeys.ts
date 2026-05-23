import { PARSED_PREFIX, UPLOADED_PREFIX } from "../../constants/s3";

export function isUnderUploadedPrefix(key: string): boolean {
  return key.startsWith(UPLOADED_PREFIX) && key.length > UPLOADED_PREFIX.length;
}

export function uploadedKeyToParsedKey(uploadedKey: string): string {
  const fileName = uploadedKey.slice(UPLOADED_PREFIX.length);
  return `${PARSED_PREFIX}${fileName}`;
}
