import * as vscode from 'vscode';
import { getNonce } from '../utilities/getNonce';
import { getUri } from '../utilities/getUri';
import * as fs from 'fs';
import * as path from 'path';

export class RulesViewProvider {
  public static readonly viewType = 'cursor-rules.rulesView';
  private _panel?: vscode.WebviewPanel;
  private static _instance: RulesViewProvider;

  private constructor(private readonly _extensionUri: vscode.Uri) {
    console.log('RulesViewProvider constructor called');
  }

  public static getInstance(extensionUri: vscode.Uri): RulesViewProvider {
    console.log('Getting RulesViewProvider instance');
    if (!RulesViewProvider._instance) {
      RulesViewProvider._instance = new RulesViewProvider(extensionUri);
    }
    return RulesViewProvider._instance;
  }

  public show() {
    console.log('RulesViewProvider show method called');
    if (this._panel) {
      console.log('Existing panel found, revealing it');
      this._panel.reveal();
      return;
    }

    console.log('Creating new webview panel');
    this._panel = vscode.window.createWebviewPanel(
      RulesViewProvider.viewType,
      'Cursor Rules',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this._extensionUri],
        retainContextWhenHidden: true,
      }
    );

    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(async (data) => {
      console.log('Received message from webview:', data);
      switch (data.type) {
        case 'getRules':
          console.log('Handling getRules message');
          await this._sendRules();
          break;
        case 'setRule':
          console.log('Handling setRule message:', data.rule);
          await this._setRule(data.rule);
          break;
      }
    });

    this._panel.onDidDispose(() => {
      console.log('Webview panel disposed');
      this._panel = undefined;
    });

    // Initial load of rules
    console.log('Initiating initial rules load');
    this._sendRules();
  }

  private async _sendRules() {
    console.log('_sendRules called');
    if (!this._panel) {
      console.log('No panel available to send rules to');
      return;
    }

    const rulesDir = path.join(this._extensionUri.fsPath, 'src', 'rules');
    console.log('Loading rules from directory:', rulesDir);
    const rules = await this._loadRules(rulesDir);
    console.log(`Loaded ${rules.length} rules`);
    
    console.log('Sending rules to webview');
    this._panel.webview.postMessage({
      type: 'setRules',
      rules
    });
  }

  private async _loadRules(rulesDir: string): Promise<any[]> {
    const rules: any[] = [];
    if (fs.existsSync(rulesDir)) {
      console.log('Rules directory exists');
      const files = fs.readdirSync(rulesDir);
      console.log('Found rule files:', files);
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const filePath = path.join(rulesDir, file);
          console.log('Processing rule file:', filePath);
          const content = fs.readFileSync(filePath, 'utf8');
          try {
            // Extract the rules array from the file content
            const match = content.match(/export const \w+Rules = (\[[\s\S]*?\]);/);
            if (match) {
              const rulesContent = match[1];
              // Safe eval of the rules content
              const fileRules = eval('(' + rulesContent + ')');
              console.log(`Parsed ${fileRules.length} rules from ${file}`);
              rules.push(...fileRules);
            } else {
              console.log(`No rules found in ${file}`);
            }
          } catch (error) {
            console.error(`Error parsing rules from ${file}:`, error);
          }
        }
      }
    } else {
      console.log('Rules directory does not exist:', rulesDir);
    }
    return rules;
  }

  private async _setRule(rule: any) {
    console.log('Setting rule:', rule);
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      console.log('No workspace folder available');
      vscode.window.showErrorMessage('No workspace folder available');
      return;
    }

    const cursorRulesPath = path.join(workspaceFolder.uri.fsPath, '.cursorrules');
    
    // Check if file exists
    if (fs.existsSync(cursorRulesPath)) {
      const choice = await vscode.window.showWarningMessage(
        'A .cursorrules file already exists. Do you want to overwrite it?',
        'Yes',
        'No'
      );
      
      if (choice !== 'Yes') {
        return;
      }
    }

    try {
      fs.writeFileSync(cursorRulesPath, rule.content);
      vscode.window.showInformationMessage(`Successfully applied rule: ${rule.title}`);
    } catch (error) {
      console.error('Error writing rule file:', error);
      vscode.window.showErrorMessage('Failed to apply rule. Please check console for details.');
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    console.log('Getting HTML for webview');
    const stylesUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    const scriptUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    console.log('Resource URIs:', {
      stylesUri: stylesUri.toString(),
      scriptUri: scriptUri.toString()
    });

    const nonce = getNonce();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; connect-src ${webview.cspSource} vscode-webview:;">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Cursor Rules Viewer</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
} 