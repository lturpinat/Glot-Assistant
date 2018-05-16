'use strict';
import axios, { AxiosRequestConfig } from 'axios';

export default class GlotManager {

    constructor(server: string) {
        axios.defaults.baseURL = `https://${server}/languages`;
    }

    /**
     * Convert the vscode language id into the Glot.io language id
     * @param languageId vscode language id
     */
    getLanguage(languageId: string): string {
        const languages: { [s: string]: string; } = {
            "shellscript": "bash",
            "c": "c",
            "clojure": "clojure",
            "coffeescript": "coffescript",
            "cpp": "cpp",
            "csharp": "csharp",
            "fsharp": "fsharp",
            "go": "go",
            "groovy": "groovy",
            "java": "java",
            "javascript": "javascript",
            "lua": "lua",
            "perl": "perl",
            "perl6": "perl6",
            "php": "php",
            "python": "python",
            "ruby": "ruby",
            "rust": "rust",
            "swift": "swift",
            "typescript": "typescript"
        };

        return languages[languageId];
    }

    /**
     * Execute code within Glot.io and returns stdout & stderr
     * @param token access token to the API
     * @param language Glot.io language id
     * @param fileName name of the file
     * @param content code to execute
     * @returns tuple with [stdout:string, stderr:string] if successful
     */
    async executeCode(token: string, language: string, fileName: string, content: string): Promise<[any, any] | any> {
        const axiosConfig: AxiosRequestConfig = {
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true;
            }
        };

        const queryBody = `{ "files": [{ "name": "${fileName}", "content": ${JSON.stringify(content)} }] }`;

        return await axios.post(`/${language}/latest`, queryBody, axiosConfig)
            .then((response) => {
                if (response.status === 401 || response.status === 400) {
                    return Promise.reject(`${response.statusText} (${response.status})`);
                }

                return Promise.resolve([response.data.stdout, response.data.stderr]);
            })
            .catch(error => {
                return Promise.reject("API Error: " + error);
            });
    }

    /**
     * Return all the available languages from Glot.io
     */
    async getAvailableLanguages(): Promise<Array<object> | void> {
        return await axios.get('/').then(response => {
            if (response.status === 401 || response.status === 400) {
                return Promise.reject(`${response.statusText} (${response.status})`);
            }

            return Promise.resolve(response.data);
        }).catch(error => {
            return Promise.reject("API Error:" + error);
        });
    }
}