'use strict';
import axios, { AxiosRequestConfig } from 'axios';

export default class GlotManager {

    constructor() {
        axios.defaults.baseURL = 'https://run.glot.io/languages';
    }

    getLanguage(languageId: string): any {
        const languages: any = {
            "shellscript": { name: "bash" },
            "c": { name: "c" },
            "clojure": { name: "clojure" },
            "coffeescript": { name: "coffescript" },
            "cpp": { name: "cpp" },
            "csharp": { name: "csharp" },
            "fsharp": { name: "fsharp" },
            "go": { name: "go" },
            "groovy": { name: "groovy" },
            "java": { name: "java" },
            "javascript": { name: "javascript" },
            "lua": { name: "lua" },
            "perl": { name: "perl" },
            "perl6": { name: "perl6" },
            "php": { name: "php" },
            "python": { name: "python" },
            "ruby": { name: "ruby" },
            "rust": { name: "rust" },
            "swift": { name: "swift" },
            "typescript": "{name: typescript"
        };

        return languages[languageId];
    }

    async executeCode(token: string, language: string, fileName: string, content: string): Promise<any | void> {
        const axiosConfig: AxiosRequestConfig = {
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true;
            }
        };

        return await axios.post(`/${language}/latest`, `{"files": [{"name": "${fileName}", "content": "${content}"}]}`, axiosConfig)
            .then((response) => {
                return Promise.resolve({ stdout: response.data.stdout, stderr: response.data.stderr });
            })
            .catch(error => {
                return Promise.reject("Couldn't contact API");
            });
    }

    async getAvailableLanguages(): Promise<Array<object> | void> {
        return await axios.get('/').then(response => {
            return Promise.resolve(response.data);
        }).catch(err => {
            return Promise.reject("Couldn't contact API");
        });
    }
}