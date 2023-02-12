export const genUUID = () =>
    ([1e7].toString() + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
            parseInt(c, 10) ^
            (window.crypto.getRandomValues(new Uint32Array(1))[0] & (15 >> (parseInt(c, 10) / 4)))
        ).toString(16)
    );

//https://github.com/siyuan-note/siyuan/blob/master/app/src/layout/Model.ts

export class Socket {
    constructor(options = {}) {
        this.onopen = options.onopen;
        this.handlers = {};
        this.connect();
    }
    connect() {
        const url = 'ws://127.0.0.1:6806/ws';
        const ws = new WebSocket(
            `${url}?app=${Math.random().toString(36).substring(8)}&id=${genUUID()}`
        );
        ws.onopen = () => {
            if (this.onopen) {
                this.onopen;
            }
        };
        ws.onmessage = (event) => {
            const _data = JSON.parse(event.data);
            let { cmd, data } = _data;
            this.emit(cmd, data);
            // this.emit('all', data);
        };
        ws.onclose = (ev) => {
            if (0 <= ev.reason.indexOf('unauthenticated')) {
                return;
            }

            if (0 > ev.reason.indexOf('close websocket')) {
                console.warn('WebSocket is closed. Reconnect will be attempted in 3 second.', ev);
                setTimeout(() => {
                    this.connect();
                }, 3000);
            }
        };
        ws.onerror = (err) => {
            if (err.target.url.endsWith('&type=main') && err.target.readyState === 3) {
                console.error(err);
            }
        };
        this.ws = ws;
    }
    emit(cmd, data) {
        if (this.handlers[cmd]) {
            this.handlers[cmd].forEach((callback) => {
                callback(JSON.parse(JSON.stringify(data)));
            });
        }
    }
    all(...callbacks) {
        this.on('all', ...callbacks);
    }
    on(cmd, ...callbacks) {
        if (!this.handlers[cmd]) {
            this.handlers[cmd] = [];
        }
        callbacks.forEach((callback) => {
            this.handlers[cmd].push(callback);
        });
    }
    off(cmd, ...callbacks) {
        if (this.handlers[cmd]) {
            this.handlers[cmd].forEach((item) => {
                callbacks.forEach((callback) => {
                    item == callback ? (item = undefined) : null;
                });
            });
        }
    }
    once(cmd, ...callbacks) {
        this.handlers[cmd].push((...args) => {
            callbacks.forEach((callback) => {
                callback(...args);
            });
            this.off(callback);
        });
    }
    send(cmd, param, process = false) {
        this.reqId = process ? 0 : new Date().getTime();
        this.ws.send(
            JSON.stringify({
                cmd,
                reqId: this.reqId,
                param,
                // pushMode
                // 0: 所有应用所有会话广播
                // 1：自我应用会话单播
                // 2：非自我会话广播
                // 4：非自我应用所有会话广播
                // 5：单个应用内所有会话广播
                // 6：非自我应用主会话广播
            })
        );
    }
}
//cmd可能的种类：
/*    "moveDoc":
     "mount":
     "createnotebook":
     "unmount":
     "removeDoc":
     "createdailynote":
     "create":
     "heading2doc":
     "li2doc":
     "renamenotebook":
     "rename":
     "progress":
*/
