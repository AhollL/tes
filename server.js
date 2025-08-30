const express = require('express');
const app = express();
const {
    getAllConfig,
    getProxyList,
    handleActive,
    handleDelete,
    handleInfo,
    handleWebhook,
    handleSendMessage,
    handleGetUpdates,
    handleDeletePending,
    handleDropPending,
    checkIPAndPort,
} = require('./tes2');

app.use(express.json());

// Route handler
async function routeRequest(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/active') return await handleActive(req);
    if (url.pathname === '/delete') return await handleDelete(req);
    if (url.pathname === '/info') return await handleInfo(req);
    if (url.pathname === '/webhook' && req.method === 'POST') return await handleWebhook(req);
    if (url.pathname === '/sendMessage') return await handleSendMessage(req);
    if (url.pathname === '/getUpdates') return await handleGetUpdates(req);
    if (url.pathname === '/deletePending') return await handleDeletePending(req);
    if (url.pathname === '/dropPending') return await handleDropPending(req);

    return null;
}

app.all('*', async (req, res) => {
    try {
        const routeResponse = await routeRequest(req);
        if (routeResponse) {
            res.status(routeResponse.status).set(routeResponse.headers).send(routeResponse.body);
            return;
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        // WebSocket handling not supported in Vercel Node.js environment
        if (req.headers['upgrade'] === 'websocket') {
            res.status(501).send('WebSocket handling not implemented');
            return;
        }

        if (url.pathname.startsWith('/')) {
            const pathParts = url.pathname.slice(1).split(':');
            if (pathParts.length === 2) {
                const [ip, port] = pathParts;
                const response = await checkIPAndPort(ip, port);
                res.status(response.status).set(response.headers).send(response.body);
                return;
            }
        }

        const hostname = req.headers.host;
        const result = getAllConfig(hostname, await getProxyList({}, true));
        res.status(200).set({ 'Content-Type': 'text/html;charset=utf-8' }).send(result);
    } catch (err) {
        console.error('Error in fetch:', err);
        res.status(500).send(`An error occurred: ${err.message}`);
    }
});

module.exports = app;
