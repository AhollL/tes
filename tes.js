import {
    connect
} from "cloudflare:sockets";

// Variables
let cachedProxyList = [];
let proxyIP = "";
let apiCheck = 'https://ipcf.rmtq.fun/json/?ip=';

const DEFAULT_PROXY_BANK_URL = "https://raw.githubusercontent.com/jaka2m/botak/refs/heads/main/cek/proxyList.txt";
const TELEGRAM_BOT_TOKEN = '7741720729:AAGjGrvsj4iQhHa3GHH60clFL71nhhndNdc';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const APICF = 'https://ipcf.rmtq.fun/json/';
const FAKE_HOSTNAME = 'botes.fairymad55.workers.dev';
const serverku = 'free.mediafairy.Web.Id';
const ownerId = 5802239249; // Ganti dengan chat_id pemilik bot (angka tanpa tanda kutip)


// Fungsi untuk menangani `/active`
async function handleActive(request) {
    const host = request.headers.get('Host');
    const webhookUrl = `https://${host}/webhook`;

    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: webhookUrl
        }),
    });

    if (response.ok) {
        return new Response('Webhook set successfully', {
            status: 200
        });
    }
    return new Response('Failed to set webhook', {
        status: 500
    });
}

// Fungsi untuk menangani `/delete` (menghapus webhook)
async function handleDelete(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    if (response.ok) {
        return new Response('Webhook deleted successfully', {
            status: 200
        });
    }
    return new Response('Failed to delete webhook', {
        status: 500
    });
}

// Fungsi untuk menangani `/info` (mendapatkan info webhook)
async function handleInfo(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);

    if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200
        });
    }
    return new Response('Failed to retrieve webhook info', {
        status: 500
    });
}

// Fungsi untuk menangani `/webhook`
async function handleWebhook(request) {
    const update = await request.json();

    if (update.callback_query) {
        return await handleCallbackQuery(update.callback_query);
    } else if (update.message) {
        return await handleMessage(update.message);
    }

    return new Response('OK', {
        status: 200
    });
}

// Fungsi untuk menangani `/sendMessage`
async function handleSendMessage(request) {
    const {
        chat_id,
        text
    } = await request.json();
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id, text
        }),
    });

    if (response.ok) {
        return new Response('Message sent successfully', {
            status: 200
        });
    }
    return new Response('Failed to send message', {
        status: 500
    });
}

// Fungsi untuk menangani `/getUpdates`
async function handleGetUpdates(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);

    if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200
        });
    }
    return new Response('Failed to get updates', {
        status: 500
    });
}

// Fungsi untuk menangani `/deletePending` - menarik pembaruan yang tertunda
async function handleDeletePending(request) {
    // Hapus webhook untuk menghindari pembaruan tertunda
    const deleteResponse = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    if (deleteResponse.ok) {
        // Setelah menghapus webhook, atur webhook kembali
        const host = request.headers.get('Host');
        const webhookUrl = `https://${host}/webhook`;

        const setResponse = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: webhookUrl
            }),
        });

        if (setResponse.ok) {
            return new Response('Pending updates deleted by resetting webhook', {
                status: 200
            });
        }
        return new Response('Failed to set webhook after deletion', {
            status: 500
        });
    }

    return new Response('Failed to delete webhook', {
        status: 500
    });
}

async function handleDropPending(request) {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`);

    if (response.ok) {
        const data = await response.json();

        if (data.result && data.result.length > 0) {
            // Hanya mengambil pembaruan dan tidak memprosesnya
            return new Response('Dropped pending updates successfully', {
                status: 200
            });
        }
        return new Response('No pending updates found', {
            status: 200
        });
    }

    return new Response('Failed to get pending updates', {
        status: 500
    });
}


// Routing utama sebelum mencapai handler default
async function routeRequest(request) {
    const url = new URL(request.url);

    if (url.pathname === '/active') {
        return await handleActive(request);
    }

    if (url.pathname === '/delete') {
        return await handleDelete(request);
    }

    if (url.pathname === '/info') {
        return await handleInfo(request);
    }

    if (url.pathname === '/webhook' && request.method === 'POST') {
        return await handleWebhook(request);
    }

    if (url.pathname === '/sendMessage') {
        return await handleSendMessage(request);
    }

    if (url.pathname === '/getUpdates') {
        return await handleGetUpdates(request);
    }

    if (url.pathname === '/deletePending') {
        return await handleDeletePending(request);
    }

    if (url.pathname === '/dropPending') {
        return await handleDropPending(request);
    }

    return null;
}


async function checkIPAndPort(ip, port) {
    const apiUrl = `${apiCheck}${ip}:${port}`;
    try {
        const apiResponse = await fetch(apiUrl);
        const apiData = await apiResponse.json();
        const result = {
            ip: ip,
            port: port,
            status: apiData.STATUS || null
        };
        return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            }
        });
    } catch (err) {
        return new Response(`An error occurred while fetching API: ${err.toString()}`, {
            status: 500,
        });
    }
}

export default {
    async fetch(request, env, ctx) {
        try {
            // Periksa rute khusus sebelum melanjutkan ke handler utama
            const routeResponse = await routeRequest(request);
            if (routeResponse) {
                return routeResponse;
            }

            // Handler utama tetap tidak terganggu
            const url = new URL(request.url);
            const upgradeHeader = request.headers.get("Upgrade");

            if (upgradeHeader === "websocket") {
                const proxyMatch = url.pathname.match(/^\/(.+[:=-]\d+)$/);

                if (proxyMatch) {
                    proxyIP = proxyMatch[1];
                    return await websockerHandler(request);
                }
            }

            // Memeriksa URL path untuk IP dan Port
            if (url.pathname.startsWith("/")) {
                const pathParts = url.pathname.slice(1).split(":");
                if (pathParts.length === 2) {
                    const [ip,
                        port] = pathParts;
                    return await checkIPAndPort(ip, port);
                }
            }

            switch (url.pathname) {
                default:
                    const hostname = request.headers.get("Host");
                    const result = getAllConfig(hostname, await getProxyList(env, true));
                    return new Response(result, {
                        status: 200,
                        headers: {
                            "Content-Type": "text/html;charset=utf-8"
                        },
                    });
                }
            } catch (err) {
                return new Response(`An error occurred: ${err.toString()}`, {
                    status: 500,
                });
            }
        },
    };

    async function handleCallbackQuery(callbackQuery) {
        const callbackData = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;

        const afrcloud = serverku; // Ganti dengan host default yang benar

        try {
            if (callbackData.startsWith('create_vless')) {
                const [_,
                    ip,
                    port,
                    isp] = callbackData.split('|');
                await handleVlessCreation(chatId, ip, port, isp, afrcloud);
            } else if (callbackData.startsWith('create_trojan')) {
                const [_,
                    ip,
                    port,
                    isp] = callbackData.split('|');
                await handleTrojanCreation(chatId, ip, port, isp, afrcloud);
            } else if (callbackData.startsWith('create_ss')) {
                const [_,
                    ip,
                    port,
                    isp] = callbackData.split('|');
                await handleShadowSocksCreation(chatId, ip, port, isp, afrcloud);
            }

            // Konfirmasi callback query ke Telegram
            await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    callback_query_id: callbackQuery.id,
                }),
            });
        } catch (error) {
            console.error('Error handling callback query:', error);
        }

        return new Response('OK', {
            status: 200
        });
    }


    let userChatIds = [];

    // Function to handle incoming messages
    async function handleMessage(message) {
        const text = message.text;
        const chatId = message.chat.id;

        // Menangani perintah /start
        if (text === '/start') {
            await handleStartCommand(chatId);

            // Menambahkan pengguna ke daftar jika belum ada
            if (!userChatIds.includes(chatId)) {
                userChatIds.push(chatId);
            }

            // Menangani perintah /info
        } else if (text === '/info') {
            await handleGetInfo(chatId);

            // Menangani perintah /getrandomip
        } else if (text === '/listwildcard') {
            await handleListWildcard(chatId);

            // Menangani perintah /getrandomip
        } else if (text === '/getrandomip') {
            await handleGetRandomIPCommand(chatId);

            // Menangani perintah /getrandom <CountryCode>
        } else if (text.startsWith('/getrandom')) {
            const countryId = text.split(' ')[1]; // Mengambil kode negara setelah "/getrandom"
            if (countryId) {
                await handleGetRandomCountryCommand(chatId, countryId);
            } else {
                await sendTelegramMessage(chatId, '⚠️ Harap tentukan kode negara setelah `/getrandom` (contoh: `/getrandom ID`, `/getrandom US`).');
            }

            // Menangani perintah /broadcast
        } else if (text.startsWith('/broadcast')) {
            await handleBroadcastCommand(message);

            // Menangani format IP:Port
        } else if (isValidIPPortFormat(text)) {
            await handleIPPortCheck(text, chatId);

            // Pesan tidak dikenali atau format salah
        } else {
            await sendTelegramMessage(chatId, '⚠️ Format tidak valid. Gunakan format IP:Port yang benar (contoh: 192.168.1.1:80).');
        }

        return new Response('OK', {
            status: 200
        });
    }

    // Fungsi untuk menangani perintah /broadcast
    async function handleBroadcastCommand(message) {
        const chatId = message.chat.id;
        const text = message.text;

        // Memeriksa apakah pengirim adalah pemilik bot
        if (chatId !== ownerId) {
            await sendTelegramMessage(chatId, '⚠️ Anda bukan pemilik bot ini.');
            return;
        }

        // Mengambil pesan setelah perintah /broadcast
        const broadcastMessage = text.replace('/broadcast', '').trim();
        if (!broadcastMessage) {
            await sendTelegramMessage(chatId, '⚠️ Harap masukkan pesan setelah perintah /broadcast.');
            return;
        }

        // Mengirim pesan ke semua pengguna yang terdaftar
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

    // Fungsi untuk mengirim pesan ke pengguna melalui Telegram API
    async function sendTelegramMessage(chatId, message) {
        const url = `${TELEGRAM_API_URL}/sendMessage`;

        const payload = {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            // Untuk memformat teks
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!result.ok) {
                console.error('Gagal mengirim pesan:', result);
            }
        } catch (error) {
            console.error('Error saat mengirim pesan:', error);
        }
    }

// Function to handle the /start command
async function handleStartCommand(chatId) {
const welcomeMessage = `
🌟 Selamat datang di FairyBot! 🌟

💡 Cara Penggunaan:
1️⃣ Kirimkan Proxy IP:Port dalam format yang benar.
    Contoh: \`1.1.1.1:443\`
2️⃣ Bot akan mengecek status Proxy untuk Anda.

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

/getrandomip
/getrandom <Country>
/listwildcard


`;
await sendTelegramMessage(chatId, InfoMessage);
    }


async function handleListWildcard(chatId) {
const ahol = `free.mediafairy.Web.Id`;
const infoMessage = `
🌟 List Wildcard VPN Tunnel FairyBot! 🌟

• \`quiz.int.vidio.com.${ahol}\`
• \`ava.game.naver.com.${ahol}\`
• \`support.zoom.us.${ahol}\`
• \`care.pmang.game.naver.com.${ahol}\`
• \`df.game.naver.com.${ahol}\`
• \`gamebulletin.nexon.game.naver.com.${ahol}\`
• \`plus-store.naver.com.${ahol}\`
• \`api.midtrans.com.${ahol}\`
• \`cache.netflix.com.${ahol}\`
• \`zaintest.vuclip.com.${ahol}\`
• \`chat.sociomile.com.${ahol}\`
• \`creativeservices.netflix.com.${ahol}\`
• \`bakrie.ac.id.${ahol}\`
• \`siakad.esaunggul.ac.id.${ahol}\`

Req WC? PM @abcdef4y


`;
await sendTelegramMessage(chatId, infoMessage);
    }


// Function to handle the /getrandomip command
    async function handleGetRandomIPCommand(chatId) {
        try {
// Fetching the Proxy IP list from the GitHub raw URL
const response = await fetch('https://raw.githubusercontent.com/jaka2m/botak/refs/heads/main/cek/proxyList.txt');
const data = await response.text();

// Split the data into an array of Proxy IPs
const proxyList = data.split('\n').filter(line => line.trim() !== '');

// Randomly select 10 Proxy IPs
const randomIPs = [];
    for (let i = 0; i < 10 && proxyList.length > 0; i++) {
const randomIndex = Math.floor(Math.random() * proxyList.length);
    randomIPs.push(proxyList[randomIndex]);
    proxyList.splice(randomIndex, 1); // Remove the selected item from the list
            }

// Format the random IPs into a message
const message = `🔑 **Here are 10 random Proxy IPs:**\n\n` +
    randomIPs.map(ip => {
const [ipAddress, port, country, provider] = ip.split(',');
// Replace dots with spaces in the provider name
const formattedProvider = provider.replace(/\./g, ' ');
    return `🌐 **\`${ipAddress}:${port}\`**\n🌎 **Country:** ${country}\n📡 **Provider:** ${formattedProvider}\n`;
            }).join('\n');

await sendTelegramMessage(chatId, message);
        } catch (error) {
    console.error('Error fetching proxy list:', error);
await sendTelegramMessage(chatId, '⚠️ There was an error fetching the Proxy list. Please try again later.');
        }
    }

// Function to handle the /getrandom <Country> command
    async function handleGetRandomCountryCommand(chatId, countryId) {
        try {
const response = await fetch('https://raw.githubusercontent.com/jaka2m/botak/refs/heads/main/cek/proxyList.txt');
const data = await response.text();
const proxyList = data.split('\n').filter(line => line.trim() !== '');
const filteredProxies = proxyList.filter(ip => {
const [ipAddress, port, country, provider] = ip.split(',');
return country.toUpperCase() === countryId.toUpperCase(); // Country case-insensitive comparison
            });
const randomIPs = [];
    for (let i = 0; i < 10 && filteredProxies.length > 0; i++) {
const randomIndex = Math.floor(Math.random() * filteredProxies.length);
    randomIPs.push(filteredProxies[randomIndex]);
    filteredProxies.splice(randomIndex, 1); // Remove the selected item from the list
            }
    if (randomIPs.length === 0) {
await sendTelegramMessage(chatId, `⚠️ No proxies found for country code **${countryId}**.`);
                return;
            }
const message = `🔑 **Here are 10 random Proxy IPs for country ${countryId}:**\n\n` +
    randomIPs.map(ip => {
const [ipAddress, port, country, provider] = ip.split(',');
// Replace dots with spaces in the provider name
const formattedProvider = provider.replace(/\./g, ' ');
    return `🌐 **\`${ipAddress}:${port}\`**\n🌎 **Country:** ${country}\n📡 **Provider:** ${formattedProvider}\n`;
            }).join('\n');

await sendTelegramMessage(chatId, message);
        } catch (error) {
    console.error('Error fetching proxy list:', error);
await sendTelegramMessage(chatId, '⚠️ There was an error fetching the Proxy list. Please try again later.');
        }
    }
async function handleIPPortCheck(ipPortText, chatId) {
const [ip,port] = ipPortText.split(':');
const result = await checkIPPort(ip, port, chatId);
    if (result) await sendTelegramMessage(chatId, result);
    }


function isValidIPPortFormat(input) {
    const regex = /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/;
return regex.test(input);
    }

async function checkIPPort(ip, port, chatId) {
        try {
// Kirim pesan sementara bahwa IP sedang diperiksa
await sendTelegramMessage(chatId, `🔍 *Cheking ProxyIP ${ip}:${port}...*`);
const response = await fetch(`${APICF}?ip=${ip}:${port}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
const data = await response.json();
const f
