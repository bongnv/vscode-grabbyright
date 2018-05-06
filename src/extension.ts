'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode = require('vscode');
import cp = require('child_process');

const goLanguageSelector = {language: 'go', scheme: 'file'}; 

function provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
    console.log("start to format");
    return new Promise((resolve, reject) => {
        const env = process.env;
        const p = cp.spawn("grabbyright", [], { env: env });
        const fileStart = new vscode.Position(0, 0);
        const fileEnd = document.lineAt(document.lineCount - 1).range.end;
        let stdout = '';
        let stderr = '';
        p.stdout.setEncoding('utf8');
        p.stdout.on('data', data => stdout += data);
        p.stderr.on('data', data => stderr += data);
        p.on('error', err => {
            console.log(err);
            reject(err);
        });
        p.on('close', code => {
            console.log(code, stdout);
            console.log(fileStart, fileEnd);
            if (stdout.length > 0) {
                const textEdits: vscode.TextEdit[] = [new vscode.TextEdit(new vscode.Range(fileStart, fileEnd), stdout)];
                resolve(textEdits);
            } else {
                resolve([]);
            }
        });
        p.stdin.end(document.getText());
    })
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "grabbyright" is now active!');
    const disposable = vscode.languages.registerDocumentFormattingEditProvider(goLanguageSelector, {
        provideDocumentFormattingEdits,
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}