const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const c = new S3Client({
  region: process.env.B2_MEDIA_REGION,
  endpoint: process.env.B2_MEDIA_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true,
});

(async () => {
  try {
    const r = await c.send(new ListObjectsV2Command({
      Bucket: process.env.B2_MEDIA_BUCKET,
      Prefix: 'abismodocoracao/',
    }));
    const keys = (r.Contents ?? []).map((x) => x.Key);
    console.log('Objetos no prefixo abismodocoracao/:');
    keys.forEach((k) => console.log('  ', JSON.stringify(k)));
  } catch (e) {
    console.error('Erro:', e.message);
  }
})();
