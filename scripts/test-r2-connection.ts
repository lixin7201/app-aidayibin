import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const required = [
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_R2_PUBLIC_BASE_URL",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key}`);
  }
}

async function main() {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });

  const objectKey = `healthcheck/codex-r2-${Date.now()}.txt`;
  const body = `aidayibin r2 ok ${new Date().toISOString()}\n`;

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: "text/plain; charset=utf-8",
    }),
  );

  const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${objectKey}`;
  const response = await fetch(publicUrl, { cache: "no-store" });
  const text = await response.text().catch(() => "");

  console.log(
    JSON.stringify(
      {
        uploaded: true,
        publicUrl,
        publicStatus: response.status,
        publicReadable: response.ok && text === body,
      },
      null,
      2,
    ),
  );

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      Key: objectKey,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
