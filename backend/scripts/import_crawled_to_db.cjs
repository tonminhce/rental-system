/* Batch importer from crawled CSVs into MySQL rental_posts and rental_images */
require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function importListings() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST_WRITE || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'rentalk',
    password: process.env.DB_PASSWORD || 'rentalk_local_only',
    database: process.env.DB_NAME || 'rentalk_local',
  });

  console.log('[*] Connected to database for listing import.');

  const csvPaths = [
    path.resolve(__dirname, '../../nhatot-crawler/data/nhatot_100k_combined.csv'),
    path.resolve(__dirname, '../../nhatot-crawler/data/data_HCM_p200.csv'),
    path.resolve(__dirname, '../../mogi-crawler/mogi_after_parsing.csv'),
  ];

  let totalImported = 0;
  let totalSkipped = 0;

  for (const csvPath of csvPaths) {
    if (!fs.existsSync(csvPath)) continue;
    console.log(`[*] Processing file: ${path.basename(csvPath)}...`);

    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers = null;
    let colMap = {};

    for await (const line of rl) {
      if (!line.trim()) continue;

      if (!headers) {
        // Quick simple CSV parse for header
        headers = line.split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
        headers.forEach((h, i) => {
          colMap[h] = i;
        });
        continue;
      }

      // Fast CSV field extraction
      const cols = [];
      let inQuotes = false;
      let cur = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === ',' && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else cur += c;
      }
      cols.push(cur.trim());

      const getVal = (name) => {
        const idx = colMap[name];
        if (idx === undefined || idx >= cols.length) return '';
        return cols[idx].replace(/^["']|["']$/g, '').trim();
      };

      const listId = getVal('list_id') || getVal('ad_id') || getVal('post_url');
      if (!listId) continue;

      const sourceUrl = getVal('source_url') || (getVal('post_url') ? getVal('post_url') : `https://www.nhatot.com/${listId}.htm`);
      const name = getVal('subject') || getVal('title') || 'Cho thuê nhà trọ';
      let rawPrice = parseFloat(getVal('price')) || 0;
      // If price > 1000, it is likely in VND, convert to millions
      const priceInMillion = rawPrice > 1000 ? (rawPrice / 1000000).toFixed(2) : rawPrice.toFixed(2);
      if (priceInMillion <= 0 || priceInMillion > 500) continue;

      const area = parseFloat(getVal('size')) || parseFloat(getVal('area')) || 30;
      const bedrooms = parseInt(getVal('rooms')) || parseInt(getVal('bedrooms')) || 1;
      const bathrooms = parseInt(getVal('toilets')) || parseInt(getVal('bathrooms')) || 1;

      let lat = parseFloat(getVal('latitude')) || parseFloat(getVal('location_latitude'));
      let lng = parseFloat(getVal('longitude')) || parseFloat(getVal('location_longitude'));
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        lat = 10.776 + (Math.random() - 0.5) * 0.05;
        lng = 106.70 + (Math.random() - 0.5) * 0.05;
      }

      const province = getVal('region_name') || getVal('province') || 'Ho Chi Minh City';
      const district = getVal('area_name') || getVal('district') || 'Quận 1';
      const ward = getVal('ward_name') || getVal('ward') || '';
      const displayedAddress = ward ? `${ward}, ${district}, ${province}` : `${district}, ${province}`;
      const description = getVal('body') || getVal('description') || name;

      let pType = 'room';
      const cat = getVal('category');
      if (cat === '1010' || name.toLowerCase().includes('căn hộ') || name.toLowerCase().includes('chung cư')) pType = 'apartment';
      else if (cat === '1030' || name.toLowerCase().includes('nhà phố') || name.toLowerCase().includes('biệt thự') || name.toLowerCase().includes('villa')) pType = 'house';

      const [existing] = await db.execute('SELECT id FROM rental_posts WHERE source_url = ?', [sourceUrl]);
      if (existing.length) {
        totalSkipped++;
        continue;
      }

      const [insertRes] = await db.execute(
        `INSERT INTO rental_posts 
        (name, description, price, area, property_type, transaction_type, province, district, ward, latitude, longitude, displayed_address, status, bedrooms, bathrooms, source_url, contact_name, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, 'rent', ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, NOW(), NOW())`,
        [
          name.slice(0, 100),
          description.slice(0, 2000),
          priceInMillion,
          area,
          pType,
          province,
          district,
          ward,
          lat,
          lng,
          displayedAddress.slice(0, 255),
          bedrooms,
          bathrooms,
          sourceUrl.slice(0, 255),
          (getVal('account_name') || getVal('owner_name') || 'Liên hệ người đăng').slice(0, 100),
        ],
      );

      const postId = insertRes.insertId;
      const mainImg = getVal('image') || getVal('thumbnail');
      if (mainImg) {
        await db.execute('INSERT INTO rental_images (rental_id, url, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [postId, mainImg]);
      }

      totalImported++;
      if (totalImported % 50 === 0) {
        console.log(`  -> Imported: ${totalImported} listings into MySQL rental_posts`);
      }

      // Stop once we import a reasonable batch of real listings for local app performance
      if (totalImported >= 500) break;
    }
  }

  console.log(`\n[✓] Import finished! Added ${totalImported} new active listings into database. Skipped ${totalSkipped} existing.`);
  await db.end();
}

importListings().catch(console.error);
