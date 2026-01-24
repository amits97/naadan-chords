import {
  S3Client,
  ListBucketsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

const client = new S3Client({ region: "ap-south-1" });

// Map action names to command classes
const commandMap = {
  listBuckets: ListBucketsCommand,
  getObject: GetObjectCommand,
  putObject: PutObjectCommand,
  deleteObject: DeleteObjectCommand,
  copyObject: CopyObjectCommand,
};

export async function call(action, params) {
  const CommandClass = commandMap[action];
  if (!CommandClass) {
    throw new Error(`Unknown S3 action: ${action}`);
  }
  const command = new CommandClass(params);
  return await client.send(command);
}
