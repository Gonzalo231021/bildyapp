const MAX_STACK_LINES = 3;

export const notifySlack = async (err, req) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const stackLines = (err.stack || '').split('\n').slice(0, MAX_STACK_LINES).join('\n');

    const payload = {
        text: `*Error 500 en BildyApp*`,
        attachments: [
            {
                color: '#e74c3c',
                fields: [
                    { title: 'Timestamp', value: new Date().toISOString(), short: true },
                    { title: 'Ruta', value: `${req.method} ${req.originalUrl}`, short: true },
                    { title: 'Mensaje', value: err.message || 'Sin mensaje', short: false },
                    { title: 'Stack', value: `\`\`\`${stackLines}\`\`\``, short: false },
                ],
            },
        ],
    };

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
};
