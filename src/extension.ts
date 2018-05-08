'use strict';
import * as vscode from 'vscode';
import GlotManager from './glotManager';

let currentToken: string | undefined = undefined;
const settings = vscode.workspace.getConfiguration('glotAssistant');
const channel: vscode.OutputChannel = vscode.window.createOutputChannel("Glot.io");
const manager = new GlotManager();

export function activate(context: vscode.ExtensionContext) {
    channel.show();
    console.log('Congratulations, your extension "glot-assistant" is now active!');

    currentToken = settings.get('token');

    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('token')) {
            currentToken = settings.get('token');
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

    context.subscriptions.push(runCurrentCode);
    context.subscriptions.push(runWholeCode);
    context.subscriptions.push(setToken);
}

function executeCode(token: string | undefined, manager: GlotManager, executeOnlySelectedCode: boolean = false) {
    if (!token) {
        vscode.window.showErrorMessage("Cannot execute this code for there is no user token set yet!");
        return;
    }

    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("You need to have an oppened editor to do this!");
        return;
    }

    let selection = editor.selection;
    let text = executeOnlySelectedCode && !selection.isEmpty
        ? editor.document.getText(selection)
        : editor.document.getText();

    let language = manager.getLanguage(editor.document.languageId);

    if (!language) {
        vscode.window.showErrorMessage("Glot doesn't support this language. Abort!");
        return;
    }

    vscode.window.showInformationMessage("Executing code...");
    manager.executeCode(token, language, editor.document.fileName, text).then(response => {
        if (!response) {
            return;
        }

        const stdout = response[0];
        const stderr = response[1];

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

export function deactivate() {
    channel.dispose();
}