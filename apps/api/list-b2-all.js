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

async function listAll(prefix = '') {
  let token;
  const all = [];
  do {
    const r = await c.send(new ListObjectsV2Command({
      Bucket: process.env.B2_MEDIA_BUCKET,
      Prefix: prefix,
      ContinuationToken: token,
    }));
    all.push(...(r.Contents ?? []).map(x => ({ key: x.Key, size: x.Size })));
    token = r.NextContinuationToken;
  } while (token);
  return all;
}

(async () => {
  try {
    const files = await listAll('');
    console.log(`Total de objetos: ${files.length}`);
    console.log('Primeiros 50:');
    files.slice(0, 50).forEach(f => console.log(`  ${f.key} (${(f.size/1024/1024).toFixed(2)} MB)`));
    console.log('...');
    console.log('Últimos 10:');
    files.slice(-10).forEach(f => console.log(`  ${f.key}`));
  } catch (e) {
    console.error('Erro:', e.name, e.$metadata?.httpStatusCode, e.message);
  }
})();
