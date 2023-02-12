export async function request(url, body = {}, method = 'POST') {
    try {
        let options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Token ',
            },
            body: JSON.stringify(body),
        };
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
