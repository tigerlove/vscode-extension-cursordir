import * as vscode from 'vscode';
import { getNonce } from '../utilities/getNonce';
import { getUri } from '../utilities/getUri';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

interface RuleAuthor {
  name: string;
  url: string;
  avatar: string | null;
}

interface Rule {
  title: string;
  slug: string;
  tags: string[];
  libs: string[];
  content: string;
  author: RuleAuthor;
}

export class RulesViewProvider {
  public static readonly viewType = 'cursor-rules.rulesView';
  private _panel?: vscode.WebviewPanel;
  private static _instance: RulesViewProvider;
  private static readonly RULES_URL = 'https://raw.githubusercontent.com/tigertiger/vscode-extension-cursordir/main/rules.json';
  private static readonly LAST_SYNC_KEY = 'lastRulesSync';
  private static readonly RULES_CACHE_KEY = 'cursorRules.cachedRules';
  private static readonly DEFAULT_RULES_DIR = path.join(__dirname, '..', 'rules');

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
        case 'syncRules':
          console.log('Handling syncRules message');
          await this._syncRules();
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

    const { rules, needsSync, isOffline } = await this._loadRules();
    const lastSync = await this._getLastSync();
    
    console.log('Sending rules to webview');
    this._panel.webview.postMessage({
      type: 'setRules',
      rules,
      lastSync,
      needsSync,
      isOffline
    });
  }

  private async _loadRules(): Promise<{ rules: Rule[]; needsSync: boolean; isOffline: boolean }> {
    try {
      const lastSync = await this._getLastSync();
      const needsSync = !lastSync || Date.now() - lastSync > 24 * 60 * 60 * 1000; // 24 hours

      // Try to load cached rules first
      const cachedRulesStr = await vscode.workspace.getConfiguration().get(RulesViewProvider.RULES_CACHE_KEY);
      const cachedRules = cachedRulesStr ? JSON.parse(cachedRulesStr) as Rule[] : null;

      // If we need to sync and we're online, try to sync
      if (needsSync) {
        try {
          const syncedRules = await this._syncRules();
          return { rules: syncedRules, needsSync: false, isOffline: false };
        } catch (error) {
          console.error('Failed to sync rules:', error);
          // If we have cached rules, use them
          if (cachedRules) {
            return { rules: cachedRules, needsSync: true, isOffline: true };
          }
        }
      } else if (cachedRules) {
        return { rules: cachedRules, needsSync: false, isOffline: false };
      }

      // If we reach here, we need to load local rules
      const localRules = await this._loadLocalRules();
      return { rules: localRules, needsSync: true, isOffline: true };
    } catch (error) {
      console.error('Error loading rules:', error);
      vscode.window.showErrorMessage('Failed to load rules. Loading local rules as fallback.');
      const localRules = await this._loadLocalRules();
      return { rules: localRules, needsSync: true, isOffline: true };
    }
  }

  private async _loadLocalRules(): Promise<Rule[]> {
    try {
      // Import all rule files from the rules directory
      const ruleFiles = fs.readdirSync(RulesViewProvider.DEFAULT_RULES_DIR);
      const rules: Rule[] = [];

      for (const file of ruleFiles) {
        if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
          const filePath = path.join(RulesViewProvider.DEFAULT_RULES_DIR, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Extract the rules array from the file content using regex
          const rulesMatch = content.match(/export const \w+Rules = (\[[\s\S]*?\]);/);
          if (rulesMatch && rulesMatch[1]) {
            try {
              // Parse the rules array
              const fileRules = eval(rulesMatch[1]) as Rule[];
              rules.push(...fileRules);
            } catch (error) {
              console.error(`Error parsing rules from ${file}:`, error);
            }
          }
        }
      }

      return rules;
    } catch (error) {
      console.error('Error loading local rules:', error);
      return [];
    }
  }

  private async _syncRules(): Promise<Rule[]> {
    try {
      const response = await fetch(RulesViewProvider.RULES_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.statusText}`);
      }
      
      const rules = await response.json() as Rule[];
      
      // Save the rules and update last sync time
      await vscode.workspace.getConfiguration().update(RulesViewProvider.RULES_CACHE_KEY, JSON.stringify(rules), true);
      await this._setLastSync(Date.now());
      
      if (this._panel) {
        this._panel.webview.postMessage({
          type: 'syncComplete',
          lastSync: Date.now()
        });
      }

      vscode.window.showInformationMessage('Rules synced successfully!');
      return rules;
    } catch (error) {
      console.error('Error syncing rules:', error);
      throw error; // Re-throw to handle in _loadRules
    }
  }

  private async _getLastSync(): Promise<number | null> {
    const value = await vscode.workspace.getConfiguration().get(RulesViewProvider.LAST_SYNC_KEY);
    return typeof value === 'number' ? value : null;
  }

  private async _setLastSync(timestamp: number) {
    await vscode.workspace.getConfiguration().update(RulesViewProvider.LAST_SYNC_KEY, timestamp, true);
  }

  private async _setRule(rule: Rule) {
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

    const resourceUris = {
      stylesUri: stylesUri.toString(),
      scriptUri: scriptUri.toString()
    };
    console.log('Resource URIs:', resourceUris);

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