'use strict';
import axios, { AxiosRequestConfig } from 'axios';

export default class GlotManager {

    constructor() {
        axios.defaults.baseURL = 'https://run.glot.io/languages';
    }

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