// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');

function goPathFromPath(filePath: string | undefined): string | undefined {
	console.log(filePath);
	if (!filePath) {
		return undefined;
	}

	while (filePath.length > 4) {
		if (path.basename(filePath) === "src") {
			return path.dirname(filePath);
		}
		filePath = path.dirname(filePath);
	}

	return undefined;
}

function  grabbyrightFormat(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
	console.log("start to format");
	const document = textEditor.document;
	const goPath = process.env.GOPATH || goPathFromPath(document.uri.path);
	const env = {
		...process.env,
		GOPATH: goPath,
		PATH: goPath + "/bin:"+ process.env.PATH,
	};

	const outBuf = cp.spawnSync("grabbyright", [], {
		 env,
		 encoding: 'utf8',
		 input: document.getText(),
	});

	if (outBuf.error || outBuf.status !== 0 || outBuf.stderr.length > 0) {
		console.log("Err: ", outBuf.error, outBuf.status);
		console.log("Stderr: ", outBuf.stderr);
		return;
	}

	if (outBuf.stdout.length > 0) {
		const fileStart = new vscode.Position(0, 0);
		const fileEnd = document.lineAt(document.lineCount - 1).range.end;
		console.log("replacing", outBuf.stdout);
		edit.replace(new vscode.Range(fileStart, fileEnd), outBuf.stdout);
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
		// Use the console to output diagnostic information (console.log) and errors (console.error)
		// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "grabbyright" is now active!');
		const disposable = vscode.commands.registerTextEditorCommand(
			"extension.grabbyright",
			grabbyrightFormat,
		);

		context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}