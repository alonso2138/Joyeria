const https = require('https');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
require('dotenv').config();

// ... existing schema ...
const jewelrySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: false },
    overlayAssetUrl: { type: String, required: false },
    imageFileId: { type: String, required: false },
    hashtags: { type: [String], required: true },
    sku: { type: String, required: false, unique: true, sparse: true },
    isFeatured: { type: Boolean, required: true, default: false },
    catalogId: { type: String, required: true, default: 'main' },
    aiModel: { type: String, required: true, default: 'gemini-2.5-flash-image' },
}, { timestamps: true });

const Jewelry = mongoose.model('Jewelry', jewelrySchema);

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/joyeria';

async function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractData(html, url) {
    // Title: usually in <h1> or <h1 class="product-title">
    let title = '';
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) title = titleMatch[1].replace(/<[^>]*>/g, '').trim();

    // Price: look for class="price" or similar
    let price = 0;
    const priceMatch = html.match(/(\d+[,.]?\d*)\s*€/i);
    if (priceMatch) price = parseFloat(priceMatch[1].replace(',', '.'));

    // Description: look for product description area
    let description = '';
    // This is more complex, let's try to find meta description if all else fails
    const descMatch = html.match(/<meta name="description" content="([^"]*)"/i);
    if (descMatch) description = descMatch[1];

    // Image: look for the main product image
    let imageUrl = '';
    const imgMatch = html.match(/<img[^>]*class="[^"]*img-fluid[^"]*"[^>]*src="([^"]*)"/i) ||
        html.match(/<img[^>]*id="[^"]*main-image[^"]*"[^>]*src="([^"]*)"/i);
    if (imgMatch) {
        imageUrl = imgMatch[1];
        if (!imageUrl.startsWith('http')) {
            const domainMatch = url.match(/^(https?:\/\/[^\/]+)/);
            if (domainMatch) imageUrl = domainMatch[1] + imageUrl;
        }
    }

    return { title, price, description, imageUrl };
}

async function downloadAndUploadImage(imageUrl, bucket) {
    return new Promise((resolve, reject) => {
        https.get(imageUrl, (res) => {
            const fileName = path.basename(imageUrl).split('?')[0];
            const uploadStream = bucket.openUploadStream(fileName, {
                contentType: res.headers['content-type']
            });
            res.pipe(uploadStream);
            uploadStream.on('error', reject);
            uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
        }).on('error', reject);
    });
}

const urls = [
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/alianzas-de-plata-silver-four-gold-yellow-5-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-stock/anillos-de-titanio-y-carbono-elara-deros-7-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/anillos-titanio-negro-black-dust-eleven-6-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/alianzas-de-carbono-gris-con-diamante-all-deros-3-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/anillos-oro-amarillo-smartline-eight-5-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/alianzas-oro-avellana-nut-twentythree-en-3,5-mm-y-4-mm',
    'https://tienda.joyeriaprieto.com/es/anillos-compromiso/anillo-de-compromiso-de-0,15-cts-cuddle-design',
    'https://tienda.joyeriaprieto.com/es/anillos-compromiso/anillo-de-compromiso-de-0,05-cts.-four-classic',
    'https://tienda.joyeriaprieto.com/es/anillos-compromiso/anillo-de-compromiso-de-0,15-cts-success-memorie-white-half',
    'https://tienda.joyeriaprieto.com/es/anillos-compromiso/anillo-de-compromiso-de-0,58-cts-forever-combined',
    'https://tienda.joyeriaprieto.com/es/alianzas-stock/alianzas-de-carbono-sline-deros-6-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/anillos-de-acero-narima-3-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/alianzas-acero-y-flash-de-oro-amarillo-neisha-5-mm',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/anillos-acero-y-ceramica-negra-wide-black-one',
    'https://tienda.joyeriaprieto.com/es/alianzas-boda/alianzas-acero-y-carbono-black-line-one'
];

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Cleanup: remove documents with sku null if they are causing issues
        await Jewelry.updateMany({ sku: null }, { $unset: { sku: "" } });

        // Drop problematic index if it exists
        try {
            await db.collection('jewelries').dropIndex('sku_1');
            console.log('Dropped unique SKU index to avoid conflicts');
        } catch (err) {
            console.log('Index sku_1 not found or already dropped');
        }

        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'jewelry_images' });

        for (const url of urls) {
            console.log(`Processing ${url}...`);
            const html = await fetchHtml(url);
            const data = extractData(html, url);

            if (!data.title) {
                console.log(`Could not extract title for ${url}, skipping.`);
                continue;
            }

            console.log(`Extracted: ${data.title} - ${data.price}€`);

            const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            // Check if already exists
            const existing = await Jewelry.findOne({ slug });
            if (existing) {
                console.log(`Already exists: ${data.title}, updating...`);
                // Optional: update logic here
                continue;
            }

            let imageFileId = null;
            if (data.imageUrl) {
                try {
                    imageFileId = await downloadAndUploadImage(data.imageUrl, bucket);
                    console.log(`Image uploaded: ${imageFileId}`);
                } catch (err) {
                    console.error(`Error uploading image for ${url}:`, err.message);
                }
            }

            const jewelryData = {
                slug,
                name: data.title,
                description: data.description || 'Sin descripción',
                price: data.price || 0,
                currency: 'EUR',
                category: 'Anillo',
                imageUrl: data.imageUrl,
                imageFileId,
                hashtags: ['joyeriaprieto', 'demo-test'],
                catalogId: 'main',
                isFeatured: true
            };

            // Only add SKU if it looks like one (usually they have a specific format)
            const skuMatch = html.match(/SKU:\s*([A-Z0-9-]+)/i) || html.match(/Ref\.:\s*([A-Z0-9-]+)/i);
            if (skuMatch) {
                jewelryData.sku = skuMatch[1].trim();
                // Check if SKU already exists to avoid collisions
                const existingSku = await Jewelry.findOne({ sku: jewelryData.sku });
                if (existingSku) {
                    console.log(`SKU ${jewelryData.sku} already exists, skipping SKU.`);
                    delete jewelryData.sku;
                }
            }

            const jewelry = new Jewelry(jewelryData);

            await jewelry.save();
            console.log(`Saved: ${data.title}`);
        }

        console.log('All done!');
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
}

run();
