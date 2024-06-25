/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

type Method = "get" | "put" | "patch"| "post" | "delete" | "GET" | "PUT" | "PATCH" | "POST" | "DELETE";

export default {
    json: async function(url: string, method: Method, data?: string | {}): Promise<any> {

        if (data && typeof data !== "string") {
            data = JSON.stringify(data);
        }

        const params: any = {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            method: method,
            credentials: "same-origin",
            body: data
        };

        return fetch(url, params).then(result => {
            if (!result.ok) {
                const message = `fetch.json (${method} at '${url}'), error: ${result.status} - ${result.statusText}`;
                console.warn(message);
                throw new Error(message);
            }

            return result.json();

        }).catch(error => {
            console.warn(`fetch.json (${method} at '${url}'), error: ${error.message}`);
            throw error;
        });
    },

    text: async function(url: string, method: Method, data?: string): Promise<string> {

        const params: any = {
            headers: {
                "Accept": "text/plain",
                "Content-Type": "text/plain",
            },
            method: method,
            credentials: "same-origin",
            body: data
        };

        return fetch(url, params).then(result => {
            if (!result.ok) {
                throw new Error(`status: ${result.status}`);
            }

            return result.text();

        }).catch(error => {
            console.warn(`fetch.text (${method} at '${url}'), error: ${error.message}`);
            throw error;
        });
    },

    file: async function(url: string, method: Method, file: File, detectType: boolean = true): Promise<any> {

        const params: any = {
            method,
            credentials: "include",
            body: file
        };

        if (!detectType) {
            params.headers = {
                "Content-Type": "application/octet-stream"
            };
        }

        return fetch(url, params).then(result => {
            if (!result.ok) {
                throw new Error(`status: ${result.status}`);
            }

            return result;

        }).catch(error => {
            console.warn(`fetch.file (${method} at '${url}'), error: ${error.message}`);
            throw error;
        });
    },

    buffer: async function(url: string, method: Method, buffer?: ArrayBuffer): Promise<ArrayBuffer> {

        const params: any = {
            headers: {
                "Accept": "application/octet-stream",
                "Content-Type": "application/octet-stream"
            },
            method,
            credentials: "include",
            body: buffer
        };

        return fetch(url, params).then(result => {
            if (!result.ok) {
                throw new Error(`status: ${result.status}`);
            }

            return result.arrayBuffer();

        }).catch(error => {
            console.warn(`fetch.buffer (${method} at '${url}'), error: ${error.message}`);
            throw error;
        });
    }
};