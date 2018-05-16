'use strict';
import * as vscode from 'vscode';
import GlotManager from './glotManager';

const DEFAULT_SERVER = "run.glot.io";

let currentToken: string | undefined = undefined;
const settings = vscode.workspace.getConfiguration('glotAssistant');
const channel: vscode.OutputChannel = vscode.window.createOutputChannel("Glot.io");
let manager: GlotManager;

export function activate(context: vscode.ExtensionContext) {
    manager = getGlotInstance(settings.get('server'));

    channel.show();
    console.log('Congratulations, your extension "glot-assistant" is now active!');

    currentToken = settings.get('token');

    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('token')) {
            currentToken = settings.get('token');
        }
        if (event.affectsConfiguration('server')) {
            manager = getGlotInstance(settings.get('server'));
        }
    });

    let runCurrentCode = vscode.commands.registerCommand('glotAssistant.runSelection', () => {
        executeCode(currentToken, manager, true);
    });

    let runWholeCode = vscode.commands.registerCommand('glotAssistant.runCode', () => {
        executeCode(currentToken, manager, false);
    });

    let setToken = vscode.commands.registerCommand('glotAssistant.setToken', () => {
        getToken();
    });

    let setServerAddress = vscode.commands.registerCommand('glotAssistant.setServer', () => {
        getServer();
    });

    context.subscriptions.push(runCurrentCode);
    context.subscriptions.push(runWholeCode);
    context.subscriptions.push(setToken);
    context.subscriptions.push(setServerAddress);
}

function getGlotInstance(server: string | undefined): GlotManager {
    //If server in invalid, use default run.glot.io
    if (!server) {
        vscode.window.showWarningMessage("Couldn't read the server address, using default instance ('run.glot.io')!");
        return new GlotManager(DEFAULT_SERVER);
    }

    return new GlotManager(server);
}

/**
 * Execute a block of code withing Glot.io
 * @param token access token for the API
 * @param manager instance of GlotManager
 * @param executeOnlySelectedCode execute only the selected code
 */
function executeCode(token: string | undefined, manager: GlotManager, executeOnlySelectedCode: boolean = false) {
    if (!token) {
        vscode.window.showErrorMessage("This code cannot be executed without a user token!");
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("You need to have an oppened editor to do this!");
        return;
    }

    let selection = editor.selection;
    //If the user chose the selection but there is none, choose the whole document
    const text = executeOnlySelectedCode && !selection.isEmpty
        ? editor.document.getText(selection)
        : editor.document.getText();

    //Convert the vscode language id into the Glot.io's one
    const language = manager.getLanguage(editor.document.languageId);

    if (!language) {
        vscode.window.showErrorMessage("Glot doesn't support this language. Abort!");
        return;
    }

    vscode.window.setStatusBarMessage("Executing code...");
    manager.executeCode(token, language, editor.document.fileName, text).then(response => {
        if (!response) {
            return;
        }

        const stdout = response[0];
        const stderr = response[1];

        vscode.window.setStatusBarMessage("Executed !");

        const time = new Date();
        channel.appendLine(
            "[" +
            ("0" + time.getHours()).slice(-2) + ":" +
            ("0" + time.getMinutes()).slice(-2) + ":" +
            ("0" + time.getSeconds()).slice(-2) + "]\n");

        channel.appendLine("Output : \n" + stdout);
        channel.appendLine("Errors : \n" + stderr + "\n");
    }).catch(error => {
        vscode.window.showErrorMessage("Something went wront with the API (see logs for more details)!");
        console.error(error);
    });
}

/**
 * Query the user to provide a token for the API
 */
function getToken() {
    let options: vscode.InputBoxOptions = {
        prompt: "Please fill-in your personnal token to carry on:",
        placeHolder: "Personnal Token...",
        validateInput: value => {
            if (!value) {
                return 'Your entry was empty!';
            }

            return value.match(/^.{8}-.{4}-.{4}-.{4}-.{12}/) ? "" : "Your Token doesn't look valid!";
        }
    };

    vscode.window.showInputBox(options).then(value => {
        if (!value) {
            vscode.window.showWarningMessage("I didn't get your token, please try again. If you don't have one yet, please go get one the website: http://glot.io");
            return;
        }

        settings.update('token', value, true).then(() => {
            currentToken = value;
        });
    });
}

/**
 * Query the user to provide a server address
 */
function getServer() {
    let options: vscode.InputBoxOptions = {
        prompt: "Please fill-in your server address to carry on:",
        placeHolder: "Server address...",
    };

    vscode.window.showInputBox(options).then(value => {
        if (!value) {
            vscode.window.showWarningMessage("I didn't get your server address, please try again!");
            return;
        }

        settings.update('server', value, true).then(() => {
            currentToken = value;
        });

        vscode.window.showInformationMessage("Your server address has correctly been updated!");
    });
}

export function deactivate() {
    channel.dispose();
}