const https = require('https');

const url = 'https://tienda.joyeriaprieto.com/es/alianzas-boda/alianzas-de-plata-silver-four-gold-yellow-5-mm';

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        if (res.statusCode === 200) {
            // Find where the main content starts. Usually in <body> and <main>
            // Let's print from line 500 to 1500 or just search for some keywords
            console.log(data);
        } else {
            console.log('Error Status:', res.statusCode);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
