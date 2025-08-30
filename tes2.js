import {
    connect
} from "cloudflare:sockets";

// Variables
let cachedProxyList = [];
let proxyIP = "";
let apiCheck = 'https://apix.sonzaix.web.id/?ip=';

const DEFAULT_PROXY_BANK_URL = "https://raw.githubusercontent.com/Mayumiwandi/Emilia/refs/heads/main/Data/alive.txt";
const TELEGRAM_BOT_TOKEN = '7636104278:AAERYk78bwov8zMSKMiIWk-cupVgSWK-_ds';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const APICF = 'https://apix.sonzaix.web.id/';
const FAKE_HOSTNAME = 'bot-mediafairy.aholterbaik.workers.dev/';
const serverku = 'free.fairyvpn.dpdns.org';
const ownerId = 5802239249; // Ganti dengan chat_id pemilik bot (angka tanpa tanda petik)

// Global country flags definition
const countryFlags = {
    'AD': '🇦🇩', 'AE': '🇦🇪', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AT': '🇦🇹',
    'AU': '🇦🇺', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BG': '🇧🇬', 'BH': '🇧🇭',
    'BR': '🇧🇷', 'BY': '🇧🇾', 'CA': '🇨🇦', 'CH': '� Switzerland', 'CL': '🇨🇱',
    'CN': '🇨🇳', 'CO': '🇨🇴', 'CY': '🇨🇾', 'CZ': '🇨🇿', 'DE': '🇩🇪',
    'DK': '🇩🇰', 'DO': '🇩🇴', 'EE': '🇪🇪', 'ES': '🇪🇸', 'FI': '🇫🇮',
    'FR': '🇫🇷', 'GB': '🇬🇧', 'GE': '🇬🇪', 'GI': '🇬🇮', 'GR': '🇬🇷',
    'HK': '🇭🇰', 'HR': '🇭🇷', 'HU': '🇭🇺', 'ID': '🇮🇩', 'IE': '🇮🇪',
    'IL': '🇮🇱', 'IN': '🇮🇳', 'IR': '🇮🇷', 'IS': '🇮🇸', 'IT': '🇮🇹',
    'JP': '🇯🇵', 'KE': '🇰🇪', 'KG': '🇰🇬', 'KR': '🇰🇷', 'KW': '🇰🇼',
    'KZ': '🇰🇿', 'LT': '🇱🇹', 'LU': '🇱🇺', 'LV': '🇱🇻', 'LX': '🏳️',
    'MD': '🇲🇩', 'ME': '🇲🇪', 'MK': '🇲🇰', 'MO': '🇲🇴', 'MU': '🇲🇺',
    'MX': '🇲🇽', 'MY': '🇲🇾', 'NG': '🇳🇬', 'NL': '🇳🇱', 'NO': '🇳🇴',
    'PH': '🇵🇭', 'PL': '🇵🇱', 'PT': '🇵🇹', 'RO': '🇷🇴', 'RS': '🇷🇸',
    'RU': '🇷🇺', 'SA': '🇸🇦', 'SE': '🇸🇪', 'SG': '🇸🇬', 'SI': '🇸🇮',
    'SK': '🇸🇰', 'TH': '🇹🇭', 'TR': '🇹🇷', 'TW': '🇹🇼', 'UA': '🇺🇦',
    'US': '🇺🇸', 'UZ': '🇺🇿', 'VN': '🇻🇳', 'XK': '🏳️', 'ZA': '🇿🇦'
};

// In-memory storage for page navigation
const pageState = new Map();

async function websockerHandler(request) {
    return new Response('WebSocket handling not implemented', {
        status: 501
    });
}

function getAllConfig(hostname, proxyList) {
    return `Configuration for ${hostname} with proxy list: ${proxyList.length} proxies`;
}

async function getProxyList(env, forceRefresh = false) {
    if (cachedProxyList.length === 0 || forceRefresh) {
        try {
            const response = await fetch(DEFAULT_PROXY_BANK_URL);
            if (!response.ok) throw new Error(`Failed to fetch proxy list: ${response.statusText}`);
            const data = await response.text();
            cachedProxyList = data.split('\n').filter(line => line.trim() !== '');
        } catch (error) {
            console.error('Error fetching proxy list:', error);
            return [];
        }
    }
    return cachedProxyList;
}

async function handleActive(request) {
    const host = request.headers.get('Host');
    const webhookUrl = `https://${host}/webhook`;

    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
    });

    if (response.ok) {
        return new Response('Webhook set successfully', { status: 200 });
    }
    return new Response('Failed to set webhook', { status: 500 });
}

async function handleDelete(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
        return new Response('Webhook deleted successfully', { status: 200 });
    }
    return new Response('Failed to delete webhook', { status: 500 });
}

async function handleInfo(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);

    if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    }
    return new Response('Failed to retrieve webhook info', { status: 500 });
}

async function handleWebhook(request) {
    try {
        const update = await request.json();
        if (update.callback_query) {
            return await handleCallbackQuery(update.callback_query);
        } else if (update.message) {
            return await handleMessage(update.message);
        }
        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Failed to process webhook', { status: 500 });
    }
}

async function handleSendMessage(request) {
    try {
        const { chat_id, text } = await request.json();
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text }),
        });

        if (response.ok) {
            return new Response('Message sent successfully', { status: 200 });
        }
        return new Response('Failed to send message', { status: 500 });
    } catch (error) {
        console.error('Error sending message:', error);
        return new Response('Failed to send message', { status: 500 });
    }
}

async function handleGetUpdates(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);

    if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    }
    return new Response('Failed to get updates', { status: 500 });
}

async function handleDeletePending(request) {
    const deleteResponse = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (deleteResponse.ok) {
        const host = request.headers.get('Host');
        const webhookUrl = `https://${host}/webhook`;
        const setResponse = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
            method: '.POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: webhookUrl }),
        });

        if (setResponse.ok) {
            return new Response('Pending updates deleted by resetting webhook', { status: 200 });
        }
        return new Response('Failed to set webhook after deletion', { status: 500 });
    }

    return new Response('Failed to delete webhook', { status: 500 });
}

async function handleDropPending(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);

    if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.length > 0) {
            return new Response('Dropped pending updates successfully', { status: 200 });
        }
        return new Response('No pending updates found', { status: 200 });
    }

    return new Response('Failed to get pending updates', { status: 500 });
}

async function routeRequest(request) {
    const url = new URL(request.url);

    if (url.pathname === '/active') return await handleActive(request);
    if (url.pathname === '/delete') return await handleDelete(request);
    if (url.pathname === '/info') return await handleInfo(request);
    if (url.pathname === '/webhook' && request.method === 'POST') return await handleWebhook(request);
    if (url.pathname === '/sendMessage') return await handleSendMessage(request);
    if (url.pathname === '/getUpdates') return await handleGetUpdates(request);
    if (url.pathname === '/deletePending') return await handleDeletePending(request);
    if (url.pathname === '/dropPending') return await handleDropPending(request);

    return null;
}

async function checkIPAndPort(ip, port) {
    const apiUrl = `${apiCheck}${ip}:${port}`;
    try {
        const apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) throw new Error(`API Error: ${apiResponse.statusText}`);
        const apiData = await apiResponse.json();
        if (!apiData || typeof apiData !== 'object') throw new Error('Invalid API response: Expected JSON object');
        const result = { ip, port, status: apiData.status || apiData.STATUS || 'Unknown' };
        return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json;charset=utf-8" }
        });
    } catch (err) {
        console.error('Error fetching API:', err);
        return new Response(`An error occurred while fetching API: ${err.message}`, { status: 500 });
    }
}

export default {
    async fetch(request, env, ctx) {
        try {
            const routeResponse = await routeRequest(request);
            if (routeResponse) return routeResponse;

            const url = new URL(request.url);
            const upgradeHeader = request.headers.get("Upgrade");

            if (upgradeHeader === "websocket") {
                const proxyMatch = url.pathname.match(/^\/(.+[:=-]\d+)$/);
                if (proxyMatch) {
                    proxyIP = proxyMatch[1];
                    return await websockerHandler(request);
                }
            }

            if (url.pathname.startsWith("/")) {
                const pathParts = url.pathname.slice(1).split(":");
                if (pathParts.length === 2) {
                    const [ip, port] = pathParts;
                    return await checkIPAndPort(ip, port);
                }
            }

            switch (url.pathname) {
                default:
                    const hostname = request.headers.get("Host");
                    const result = getAllConfig(hostname, await getProxyList(env, true));
                    return new Response(result, {
                        status: 200,
                        headers: { "Content-Type": "text/html;charset=utf-8" },
                    });
            }
        } catch (err) {
            console.error('Error in fetch:', err);
            return new Response(`An error occurred: ${err.message}`, { status: 500 });
        }
    },
};

async function handleCallbackQuery(callbackQuery) {
    const callbackData = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const afrcloud = serverku;

    try {
        if (callbackData.startsWith('create_vless')) {
            const [_, ip, port, isp] = callbackData.split('|');
            await handleVlessCreation(chatId, ip, port, isp, afrcloud);
        } else if (callbackData.startsWith('create_trojan')) {
            const [_, ip, port, isp] = callbackData.split('|');
            await handleTrojanCreation(chatId, ip, port, isp, afrcloud);
        } else if (callbackData.startsWith('create_ss')) {
            const [_, ip, port, isp] = callbackData.split('|');
            await handleShadowSocksCreation(chatId, ip, port, isp, afrcloud);
        } else if (callbackData.startsWith('flag_config')) {
            const [_, countryCode] = callbackData.split('|');
            await handleFlagConfig(chatId, countryCode, afrcloud, messageId);
        } else if (callbackData === 'next') {
            await updateFlagPage(chatId, messageId, 1);
        } else if (callbackData === 'prev') {
            await updateFlagPage(chatId, messageId, -1);
        } else if (callbackData === 'back') {
            await handleGetFlagCommand(chatId);
        }

        await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQuery.id }),
        });
    } catch (error) {
        console.error('Error handling callback query:', error);
    }

    return new Response('OK', { status: 200 });
}

async function handleFlagConfig(chatId, countryCode, afrcloud, messageId) {
    try {
        const response = await fetch(DEFAULT_PROXY_BANK_URL);
        if (!response.ok) throw new Error(`Failed to fetch proxy list: ${response.statusText}`);
        const data = await response.text();
        const proxyList = data.split('\n').filter(line => line.trim() !== '');
        const filteredProxies = proxyList.filter(ip => {
            const [, , country] = ip.split(',');
            return country && country.toUpperCase() === countryCode.toUpperCase();
        });

        if (filteredProxies.length === 0) {
            await sendTelegramMessage(chatId, `⚠️ No proxies found for country code **${countryCode}**.`);
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredProxies.length);
        const randomProxy = filteredProxies[randomIndex];
        const [ipAddress, port, country, provider] = randomProxy.split(',');
        const formattedProvider = provider ? provider.replace(/\./g, ' ') : 'Unknown';

        await sendInlineKeyboardForFlag(chatId, ipAddress, port, formattedProvider, country, messageId);
    } catch (error) {
        console.error('Error generating config for flag:', error);
        await sendTelegramMessage(chatId, `⚠️ There was an error generating the configuration: ${error.message}`);
    }
}

let userChatIds = [];

async function handleMessage(message) {
    const text = message.text;
    const chatId = message.chat.id;

    if (text === '/start') {
        await handleStartCommand(chatId);
        if (!userChatIds.includes(chatId)) userChatIds.push(chatId);
    } else if (text === '/info') {
        await handleGetInfo(chatId);
    } else if (text === '/listwildcard') {
        await handleListWildcard(chatId);
    } else if (text === '/getflag') {
        await handleGetFlagCommand(chatId);
    } else if (text.startsWith('/broadcast')) {
        await handleBroadcastCommand(message);
    } else if (isValidIPPortFormat(text)) {
        await handleIPPortCheck(text, chatId);
    } else {
        await sendTelegramMessage(chatId, '⚠️ Format tidak valid. Gunakan format IP:Port yang benar (contoh: 192.168.1.1:80).');
    }

    return new Response('OK', { status: 200 });
}

async function handleBroadcastCommand(message) {
    const chatId = message.chat.id;
    const text = message.text;

    if (chatId !== ownerId) {
        await sendTelegramMessage(chatId, '⚠️ Anda bukan pemilik bot ini.');
        return;
    }

    const broadcastMessage = text.replace('/broadcast', '').trim();
    if (!broadcastMessage) {
        await sendTelegramMessage(chatId, '⚠️ Harap masukkan pesan setelah perintah /broadcast.');
        return;
    }

    if (userChatIds.length === 0) {
        await sendTelegramMessage(chatId, '⚠️ Tidak ada pengguna untuk menerima pesan broadcast.');
        return;
    }

    for (const userChatId of userChatIds) {
        try {
            await sendTelegramMessage(userChatId, broadcastMessage);
        } catch (error) {
            console.error(`Error mengirim pesan ke ${userChatId}:`, error);
        }
    }

    await sendTelegramMessage(chatId, `✅ Pesan telah disebarkan ke ${userChatIds.length} pengguna.`);
}

async function sendTelegramMessage(chatId, message) {
    const url = `${TELEGRAM_API_URL}/sendMessage`;
    const payload = { chat_id: chatId, text: message, parse_mode: 'Markdown' };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!result.ok) console.error('Gagal mengirim pesan:', result);
    } catch (error) {
        console.error('Error saat mengirim pesan:', error);
    }
}

async function handleStartCommand(chatId) {
    const welcomeMessage = `
🌟 Selamat datang di FairyBot! 🌟

💡 Cara Penggunaan:
1️⃣ Klik /getflag menampilkan daftar config
   berdasarkan negara
2️⃣ Kirimkan Proxy IP:Port dalam format yang benar
     Contoh: 1.1.1.1:443
             192.168.1.1:443
   Bot akan mengecek status Proxy untuk Anda.

✨ Anda bisa memilih opsi untuk membuat VPN Tunnel CloudFlare Gratis Menggunakan ProxyIP yang sudah di Cek dengan format:
  - 🌐 VLESS
  - 🔐 TROJAN
  - 🛡️ Shadowsocks

🚀 Mulai sekarang dengan mengirimkan Proxy IP:Port Anda!

📌 Daftar Commands : /info
    `;
    await sendTelegramMessage(chatId, welcomeMessage);
}

async function handleGetInfo(chatId) {
    const InfoMessage = `
  Commands di FairyBot‼️

  /listwildcard
  /getflag
  `;
    await sendTelegramMessage(chatId, InfoMessage);
}

async function handleListWildcard(chatId) {
    const ahol = `telegwkenalimit.dpdns.org`;
    const infoMessage = `
  🌟 List Wildcard VPN Tunnel FairyBot! 🌟

  • \`quiz.int.vidio.com.${ahol}\`
  • \`ava.game.naver.com.${ahol}\`
  • \`support.zoom.us.${ahol}\`
  • \`api.midtrans.com.${ahol}\`
  • \`chat.sociomile.com.${ahol}\`

  Req WC? PM @abcdef4y
  `;
    await sendTelegramMessage(chatId, infoMessage);
}

async function handleGetFlagCommand(chatId) {
    try {
        const chunkSize = 24; // Number of countries per page
        const flagsPerRow = 4; // Number of flags per row
        const countryCodes = Object.keys(countryFlags);
        const totalPages = Math.ceil(countryCodes.length / chunkSize);
        const initialPage = 1;

        pageState.set(chatId, { currentPage: initialPage, totalPages });

        const inlineKeyboard = [];
        const startIndex = (initialPage - 1) * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize, countryCodes.length);

        for (let j = startIndex; j < endIndex; j += flagsPerRow) {
            const row = [];
            for (let k = 0; k < flagsPerRow && j + k < endIndex; k++) {
                const countryCode = countryCodes[j + k];
                row.push({
                    text: `${countryFlags[countryCode]} ${countryCode}`,
                    callback_data: `flag_config|${countryCode}`
                });
            }
            inlineKeyboard.push(row);
        }

        const navigationButtons = [
            [{ text: 'Prev', callback_data: 'prev' }, { text: `Page ${initialPage} of ${totalPages}`, callback_data: 'none' }, { text: 'Next', callback_data: 'next' }],
            [{ text: 'Back', callback_data: 'back' }]
        ];
        inlineKeyboard.push(...navigationButtons);

        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: `🌍 **Select a country to generate a proxy configuration (Page ${initialPage} of ${totalPages}):**`,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: inlineKeyboard }
            })
        });

        if (response.ok) {
            const data = await response.json();
            pageState.set(chatId, { ...pageState.get(chatId), messageId: data.result.message_id });
        } else {
            throw new Error(`Failed to send initial flag page: ${await response.text()}`);
        }
    } catch (error) {
        console.error('Error generating flags:', error);
        await sendTelegramMessage(chatId, `⚠️ There was an error generating the flags: ${error.message}`);
    }
}

async function handleIPPortCheck(ipPortText, chatId) {
    const [ip, port] = ipPortText.split(':');
    await checkIPPort(ip, port, chatId);
}

function isValidIPPortFormat(input) {
    const regex = /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/;
    return regex.test(input);
}

async function checkIPPort(ip, port, chatId) {
    try {
        await sendTelegramMessage(chatId, `🔍 *Checking ProxyIP ${ip}:${port}...*`);
        const response = await fetch(`${APICF}?ip=${ip}:${port}`);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();

        if (!data || typeof data !== 'object') throw new Error('Invalid API response: Expected JSON object');

        const filterISP = (isp) => !isp ? 'Unknown' : String(isp).replace(/[^a-zA-Z0-9\s()]/g, "").split(" ").length <= 3 ? isp : `${isp.split(" ").slice(0, 2).join(" ")} ${isp.split(" ")[isp.split(" ").length - 1]}`;
        const filteredISP = filterISP(data.isp || data.ISP || data.provider || 'Unknown');
        const status = (data.status || data.STATUS || 'Unknown') === "✔ AKTIF ✔" ? "✅ Aktif" : "❌ Tidak Aktif";
        const ipAddress = data.ip || data.IP || ip;
        const portNumber = data.port || data.PORT || port;
        const asn = data.asn || data.ASN || 'Unknown';
        const kota = data.city || data.KOTA || 'Unknown';
        const flag = data.flag || data.FLAG || '🏳️';
        const country = data.country || data.COUNTRY || 'Unknown';

        const fairy = `═════════RESULT═════════`;
        const resultMessage = `
\`\`\`
${fairy}
═════════════════════════
📡 ISP     : ${filteredISP}
🌐 IP      : ${ipAddress}
🕹️ Port    : ${portNumber}
🛰 ASN     : ${asn}
🏢 Region  : ${kota}
🌏 Country : ${country} ${flag}
⚡ Status  : ${status}
═════════════════════════
\`\`\`
`;

        await sendTelegramMessage(chatId, resultMessage);
        await sendInlineKeyboard(chatId, ipAddress, portNumber, filteredISP);
    } catch (error) {
        console.error('Error in checkIPPort:', error);
        await sendTelegramMessage(chatId, `⚠️ Terjadi kesalahan saat memeriksa IP dan port: ${error.message}`);
    }
}

async function handleShadowSocksCreation(chatId, ip, port, isp, afrcloud) {
    const uuid = `eeeeeee3-eeee-4eee-aeee-eeeeeeeeeee5`;
    const ssTls = `ss://${btoa(`none:${uuid}`)}@${afrcloud}:443?encryption=none&type=ws&host=${afrcloud}&path=%2F${ip}%3D${port}&security=tls&sni=${afrcloud}#${isp}`;
    const ssNTls = `ss://${btoa(`none:${uuid}`)}@${afrcloud}:80?encryption=none&type=ws&host=${afrcloud}&path=%2F${ip}%3D${port}&security=none&sni=${afrcloud}#${isp}`;

    const proxies = `
  - name: ${isp} - TLS
    server: ${afrcloud}
    port: 443
    type: ss
    cipher: none
    password: ${uuid}
    plugin: v2ray-plugin
    client-fingerprint: chrome
    udp: true
    plugin-opts:
      mode: websocket
      host: ${afrcloud}
      path: /${ip}=${port}
      tls: true
      mux: false
      skip-cert-verify: true
    headers:
      custom: value
      ip-version: dual
      v2ray-http-upgrade: false
      v2ray-http-upgrade-fast-open: false
  `;

    const message = `
  Success Create ShadowSocks \`${isp}\` \n🌟 \`${ip}:${port}\` 🌟

\`\`\`SS-TLS
${ssTls}\`\`\`
\`\`\`SS-nTLS
${ssNTls}\`\`\`
  \`\`\`yaml
${proxies}
  \`\`\`

  klik /listwildcard untuk mengetahui bug yang sudah di pointing
    `;

    await sendTelegramMessage(chatId, message);
}

async function handleVlessCreation(chatId, ip, port, isp, afrcloud) {
    const uuid = `eeeeeee3-eeee-4eee-aeee-eeeeeeeeeee5`;
    const path = `/${ip}=${port}`;
    const vlessTLS = `vless://${uuid}@${afrcloud}:443?path=${encodeURIComponent(path)}&security=tls&host=${afrcloud}&type=ws&sni=${afrcloud}#${isp}`;
    const vlessNTLS = `vless://${uuid}@${afrcloud}:80?path=${encodeURIComponent(path)}&security=none&host=${afrcloud}&type=ws&sni=${afrcloud}#${isp}`;

    const message = `
  Success Create VLESS \`${isp}\` \n🌟 \`${ip}:${port}\` 🌟

\`\`\`VLESS-TLS
${vlessTLS}\`\`\`
\`\`\`VLESS-nTLS
${vlessNTLS}\`\`\`
  \`\`\`yaml
  - name: ${isp} - TLS
    type: vless
    server: ${afrcloud}
    port: 443
    uuid: ${uuid}
    cipher: auto
    tls: true
    skip-cert-verify: true
    servername: ${afrcloud}
    network: ws
    udp: true
    ws-opts:
      path: ${path}
      headers:
        Host: ${afrcloud}
  \`\`\`

  klik /listwildcard untuk mengetahui bug yang sudah di pointing
    `;

    await sendTelegramMessage(chatId, message);
}

async function handleTrojanCreation(chatId, ip, port, isp, afrcloud) {
    const uuid = `eeeeeee3-eeee-4eee-aeee-eeeeeeeeeee5`;
    const path = `/${ip}=${port}`;
    const trojanTLS = `trojan://${uuid}@${afrcloud}:443?path=${encodeURIComponent(path)}&security=tls&host=${afrcloud}&type=ws&sni=${afrcloud}#${isp}`;
    const trojanNTLS = `trojan://${uuid}@${afrcloud}:80?path=${encodeURIComponent(path)}&security=none&host=${afrcloud}&type=ws&sni=${afrcloud}#${isp}`;

    const message = `
  Success Create TROJAN \`${isp}\` \n🌟 \`${ip}:${port}\` 🌟

\`\`\`TROJAN-TLS
${trojanTLS}\`\`\`
\`\`\`TROJAN-nTLS
${trojanNTLS}\`\`\`
  \`\`\`yaml
  - name: ${isp} - TLS
    type: trojan
    server: ${afrcloud}
    port: 443
    password: ${uuid}
    tls: true
    skip-cert-verify: true
    sni: ${afrcloud}
    network: ws
    udp: true
    ws-opts:
      path: ${path}
      headers:
        Host: ${afrcloud}
  \`\`\`

  klik /listwildcard untuk mengetahui bug yang sudah di pointing
  `;

    await sendTelegramMessage(chatId, message);
}

async function sendInlineKeyboard(chatId, ip, port, isp) {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: 'Pilih opsi berikut untuk membuat VPN Tunnel:',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Create VLESS', callback_data: `create_vless|${ip}|${port}|${isp}` },
                            { text: 'Create Trojan', callback_data: `create_trojan|${ip}|${port}|${isp}` },
                        ],
                        [
                            { text: 'Create ShadowSocks', callback_data: `create_ss|${ip}|${port}|${isp}` }
                        ],
                    ],
                },
            }),
        });

        if (!response.ok) {
            console.error('Failed to send inline keyboard:', await response.text());
            throw new Error('Failed to send inline keyboard');
        }
    } catch (error) {
        console.error('Error sending inline keyboard:', error);
    }
}

async function sendInlineKeyboardForFlag(chatId, ip, port, isp, country, messageId) {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: `🌍 **Select a VPN type for IP: \`${ip}:${port}\` from ${country || 'Unknown'}:**`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Create VLESS', callback_data: `create_vless|${ip}|${port}|${isp}` },
                            { text: 'Create Trojan', callback_data: `create_trojan|${ip}|${port}|${isp}` },
                        ],
                        [
                            { text: 'Create ShadowSocks', callback_data: `create_ss|${ip}|${port}|${isp}` }
                        ],
                    ],
                },
            }),
        });

        if (response.ok) {
            const data = await response.json();
            pageState.set(chatId, { ...pageState.get(chatId), messageId: data.result.message_id });
        } else {
            console.error('Failed to send inline keyboard for flag:', await response.text());
            throw new Error('Failed to send inline keyboard for flag');
        }
    } catch (error) {
        console.error('Error sending inline keyboard for flag:', error);
    }
}

async function updateFlagPage(chatId, messageId, pageChange) {
    const state = pageState.get(chatId);
    if (!state) return;

    const chunkSize = 24; // Number of countries per page
    const flagsPerRow = 4; // Number of flags per row
    const countryCodes = Object.keys(countryFlags);
    const totalPages = Math.ceil(countryCodes.length / chunkSize);
    let currentPage = state.currentPage + pageChange;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const inlineKeyboard = [];
    const startIndex = (currentPage - 1) * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, countryCodes.length);

    for (let j = startIndex; j < endIndex; j += flagsPerRow) {
        const row = [];
        for (let k = 0; k < flagsPerRow && j + k < endIndex; k++) {
            const countryCode = countryCodes[j + k];
            row.push({
                text: `${countryFlags[countryCode]} ${countryCode}`,
                callback_data: `flag_config|${countryCode}`
            });
        }
        inlineKeyboard.push(row);
    }

    const navigationButtons = [
        [{ text: 'Prev', callback_data: 'prev', disabled: currentPage === 1 }, { text: `Page ${currentPage} of ${totalPages}`, callback_data: 'none' }, { text: 'Next', callback_data: 'next', disabled: currentPage === totalPages }],
        [{ text: 'Back', callback_data: 'back' }]
    ];
    inlineKeyboard.push(...navigationButtons);

    try {
        await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: `🌍 **Select a country to generate a proxy configuration (Page ${currentPage} of ${totalPages}):**`,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: inlineKeyboard }
            })
        });
        pageState.set(chatId, { ...state, currentPage, messageId });
    } catch (error) {
        console.error('Error updating flag page:', error);
        await sendTelegramMessage(chatId, `⚠️ There was an error updating the flag page: ${error.message}`);
    }
}
