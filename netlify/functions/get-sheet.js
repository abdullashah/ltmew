// Proxies a live export of one of the governorate Google Sheets as .xlsx,
// so the dashboard always reflects the latest data without a redeploy.
const SHEETS = {
    asima:     '1ir85XijvxSXI2Ch3qzyBXBoCO8ZUD8HGUyjI9OHXUtI',
    hawalli:   '1FtC1gaqwAJsvmL1i5VZwmH716OT_xOKrvhH5z6U1ceM',
    farwaniya: '1aAtWpfFGueXJXo6TEL220skUJnvFr6pAv4ah0HwMVZQ',
    ahmadi:    '1zhrO-aGQNObTSH-lbsCyvBYCQbj67BzkaWdylUHA8D0',
    jahra:     '1Z2zj4yr0yoysT6JhE3SL-UX2zYds1c46yn4_5z6Ex-U',
    mubarak:   '15kp8wCEwQS--kmb5hK7nNBY2At7oP_ucuQ6KqEAdNZA'
};

exports.handler = async function(event) {
    const office = event.queryStringParameters && event.queryStringParameters.office;
    const sheetId = SHEETS[office];
    if (!sheetId) {
        return { statusCode: 400, body: 'Unknown office: ' + office };
    }

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    let res;
    try {
        res = await fetch(url);
    } catch (err) {
        return { statusCode: 502, body: 'Fetch failed: ' + err.message };
    }
    if (!res.ok) {
        return { statusCode: 502, body: 'Google Sheets export failed: HTTP ' + res.status };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
        },
        body: buf.toString('base64'),
        isBase64Encoded: true
    };
};
