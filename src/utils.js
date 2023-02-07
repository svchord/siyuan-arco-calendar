export async function request(url, options = { method: 'POST' }) {
    try {
        if (!options.headers) {
            options.headers = {
                'Content-Type': 'application/json',
                Authorization: 'Token ',
            };
        }
        url = 'http://127.0.0.1:6806' + url;
        const response = await fetch(url, options);
        if (!response.ok || response.status !== 200) {
            throw new Error(response.statusText);
        }
        const responseJson = await response.json();
        return responseJson.data;
    } catch (error) {
        console.error(error);
    }
}
