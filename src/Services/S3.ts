import type {ReadStream} from 'node:fs';
import {buffer as streamToBuffer} from 'node:stream/consumers';
import {createHash} from 'node:crypto';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import {
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_SECRET,
  AWS_S3_BUCKET,
  AWS_S3_REGION,
} from '../Utils/Constants';

export const client = new S3Client({
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_ACCESS_SECRET,
  },
});

export const Upload = async (
  key: string,
  body: ReadStream | Buffer,
  mime: string,
): Promise<
  | {
      ok: true;
      response: PutObjectCommandOutput;
    }
  | {
      ok: false;
      error: Error;
    }
> => {
  const fileBuffer = body instanceof Buffer ? body : await streamToBuffer(body);

  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mime,
    ContentMD5: createHash('md5').update(fileBuffer).digest('base64'),
    ACL: 'public-read',
  });

  try {
    const response = await client.send(command);

    return {ok: true, response};
  } catch (err) {
    return {ok: false, error: err as Error};
  }
};

export const GetHead = async (
  key: string,
): Promise<
  | {
      ok: true;
      response: HeadObjectCommandOutput;
    }
  | {
      ok: false;
      error: Error;
    }
> => {
  const command = new HeadObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
  });

  try {
    const response = await client.send(command);

    return {ok: true, response};
  } catch (err) {
    return {ok: false, error: err as Error};
  }
};

export const Exists = async (key: string): Promise<boolean> => {
  const response = await GetHead(key);

  return !!(response.ok && response.response.$metadata.httpStatusCode);
};

export const GetByKey = async (
  key: string,
): Promise<
  | {
      ok: true;
      response: GetObjectCommandOutput;
    }
  | {
      ok: false;
      error: Error;
    }
> => {
  if (await Exists(key)) {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    });

    try {
      const response = await client.send(command);

      return {ok: true, response};
    } catch (err) {
      return {ok: false, error: err as Error};
    }
  }

  return {ok: false, error: new Error('NotFound')};
};
