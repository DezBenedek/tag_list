import fs from 'node:fs';
import path from 'node:path';

import { mmLol } from './mmLol.js';

let tags = [];
const tagsFilePath = path.join(import.meta.dirname, '..', 'tags.json');

async function updateTags() {
    try {
        console.log('Frissítés kezdése...');
        
        const tagList = await fetch('https://nelly.tools/api/tags/list', {
            headers: {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                'referer': 'https://nelly.tools/tags',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
            }
        });

        const tagBytes = await tagList.text();
        const decodedTags = mmLol(tagBytes);

        if (decodedTags.charAt(0) !== '{') {
            console.log('Sikertelen dekódolás...');
            console.log('Eredeti válasz:', tagBytes);
            return;
        }

        const parsedTags = JSON.parse(decodedTags);
        tags = parsedTags.data;

        fs.writeFileSync(tagsFilePath, JSON.stringify(tags, null, 4));
        console.log(`${tags.length.toLocaleString()} tag betöltve (${new Date().toLocaleString()})`);
        
    } catch (error) {
        console.error('Hiba a tagek frissítése során:', error);
    }
}

try {
    if (fs.existsSync(tagsFilePath)) {
        const existingTags = fs.readFileSync(tagsFilePath, 'utf8');
        tags = JSON.parse(existingTags);
        console.log(`${tags.length.toLocaleString()} tag betöltve a fájlból`);
    }
} catch (error) {
    console.log('Nem sikerült betölteni a meglévő tageket, frissítés...');
}

await updateTags();

setInterval(updateTags, 10 * 60 * 1000);

const server = Bun.serve({
    port: 8000,
    fetch(req) {
        const url = new URL(req.url);
        
        if (url.pathname === '/getlist') {
            return new Response(JSON.stringify(tags), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }
        
        if (url.pathname === '/') {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Tags API</title>
                    <meta charset="utf-8">
                </head>
                <body>
                    <h1>Tags API</h1>
                    <p>Összesen ${tags.length.toLocaleString()} tag elérhető</p>
                    <p>Utolsó frissítés: ${new Date().toLocaleString()}</p>
                    <ul>
                        <li><a href="/getlist">/getlist</a> - JSON formátumban az összes tag</li>
                    </ul>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }
        
        return new Response('404 - Nem található', { status: 404 });
    }
});

console.log(`Webszerver elindítva a http://localhost:${server.port} címen`);
console.log(`Tags API elérhető: http://localhost:${server.port}/getlist`);