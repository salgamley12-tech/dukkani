import { cp, mkdir } from 'node:fs/promises';

const files = ['index.html', 'app.js', 'styles.css'];

await mkdir('www', { recursive: true });

for (const file of files) {
  await cp(file, `www/${file}`);
}

console.log('Prepared Dukkani web assets in ./www');
