import * as fs from 'fs';
import arg from 'arg';

async function generateCsv() {
  const args = arg({
    '--output': String,
    '--rows': Number,
  });

  const FILE_PATH = args['--output'];
  const ROWS = args['--rows'];

  if (!FILE_PATH) {
    console.error('Errore: Il parametro --output è obbligatorio.');
    process.exit(1);
  }

  if (!ROWS) {
    console.error('Errore: Il parametro --rows è obbligatorio.');
    process.exit(1);
  }

  const stream = fs.createWriteStream(FILE_PATH);
  stream.write('id,timestamp,ip_address,endpoint,user_agent\n');
  
  for (let i = 1; i <= ROWS; i++) {
    const row = `${i},${new Date().toISOString()},192.168.1.${i % 255},/api/resource/${i % 100},Mozilla/5.0\n`;
    if (!stream.write(row)) {
      await new Promise(resolve => stream.once('drain', resolve));
    }
  }
  
  stream.end();
  console.log(`File ${FILE_PATH} generato con ${ROWS} righe.`);
}

generateCsv();
