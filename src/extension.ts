// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');

function goPathFromPath(filePath: string | undefined): string | undefined {
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

function grabbyrightFormat(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
	const doc = textEditor.document;
	if (doc.languageId !== "go") {
		return;
	}

	const config = vscode.workspace.getConfiguration('grabbyright', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
	const formatted = grabbyrightDocument(config["fmtCmds"], doc);
	if (formatted.length > 0) {
		const fileStart = new vscode.Position(0, 0);
		const fileEnd = doc.lineAt(doc.lineCount - 1).range.end;
		edit.replace(new vscode.Range(fileStart, fileEnd), formatted);
	}
}

function grabbyrightDocument(fmtCmds: string[], doc: vscode.TextDocument): string {
	const goPath = process.env.GOPATH || goPathFromPath(doc.uri.path);
	const env = {
		...process.env,
		GOPATH: goPath,
		PATH: goPath + "/bin:"+ process.env.PATH,
	};

	const outBuf = cp.spawnSync(fmtCmds[0],fmtCmds.slice(1), {
		 env,
		 encoding: 'utf8',
		 input: doc.getText(),
	});

	if (outBuf.error || outBuf.status !== 0 || outBuf.stderr.length > 0) {
		console.log("Err: ", outBuf.error, outBuf.status);
		console.log("Stderr: ", outBuf.stderr);
		return "";
	}

	return outBuf.stdout;
}

function grabyrightOnSave(fmtCmds: string[], e: vscode.TextDocumentWillSaveEvent) {
	const doc = e.document;
	if (doc.languageId !== "go") {
		return;
	}

	e.waitUntil(new Promise((resolve, reject) => {
		const formatted = grabbyrightDocument(fmtCmds, doc);
		if (formatted.length === 0 || formatted === doc.getText()) {
			resolve([]);
			return;
		}

		const fileStart = new vscode.Position(0, 0);
		const fileEnd = doc.lineAt(doc.lineCount - 1).range.end;
		resolve([vscode.TextEdit.replace(new vscode.Range(fileStart, fileEnd), formatted)]);
		return;
	}));
}

function prepareOnSave(curSub: vscode.Disposable | undefined, subscriptions: vscode.Disposable[]): vscode.Disposable | undefined {
	const config = vscode.workspace.getConfiguration('grabbyright', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
	if (!curSub && config['onSave']) {
		return vscode.workspace.onWillSaveTextDocument(
			e => grabyrightOnSave(config["fmtCmds"], e),
			null,
			subscriptions,
		);
	}

	if (curSub && !config['onSave']) {
		curSub.dispose();
		return undefined;
	}

	return curSub;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(ctx: vscode.ExtensionContext) {
		// Use the console to output diagnostic information (console.log) and errors (console.error)
		// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "grabbyright" is now active!');
		ctx.subscriptions.push(vscode.commands.registerTextEditorCommand(
			"extension.grabbyright",
			grabbyrightFormat,
		));

		let onSaveSubscription = prepareOnSave(undefined, ctx.subscriptions);
		ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
			// config updated
			onSaveSubscription = prepareOnSave(onSaveSubscription, ctx.subscriptions);
		}));
}

// this method is called when your extension is deactivated
export function deactivate() {
}