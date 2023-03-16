// eslint-disable-next-line prefer-destructuring
const env = process.env;

export const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '';

export const AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID || '';
export const AWS_ACCESS_SECRET = env.AWS_ACCESS_SECRET || '';
export const AWS_S3_BUCKET = env.AWS_S3_BUCKET || '';
export const AWS_S3_REGION = env.AWS_S3_REGION || '';

export const AWS_S3_URL = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com`;
