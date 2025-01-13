const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_API_URL = 'https://api.github.com/repos/pontusab/cursor.directory/contents/src/data/rules';
const CURSOR_DIRECTORY_BASE_URL = 'https://raw.githubusercontent.com/pontusab/cursor.directory/main/src/data/rules';
const LOCAL_RULES_DIR = path.join(__dirname, '..', 'src', 'rules');
const WEBVIEW_SRC_RULES_PATH = path.join(__dirname, '..', 'webview-ui', 'public', 'rules.json');

// Function to fetch content from a URL with proper GitHub API headers
function fetchUrl(url, isApi = false) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: isApi ? {
        'User-Agent': 'Cursor-Rules-Directory-Sync',
        'Accept': 'application/vnd.github.v3+json'
      } : {
        'User-Agent': 'Cursor-Rules-Directory-Sync'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Function to write file ensuring directory exists
function writeFileWithDir(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

async function syncRules() {
  try {
    // Fetch the list of files from GitHub API
    const response = await fetchUrl(GITHUB_API_URL, true);
    const files = JSON.parse(response);
    
    // Filter for .ts files
    const ruleFiles = files
      .filter(file => file.name.endsWith('.ts'))
      .map(file => file.name);

    console.log(`Found ${ruleFiles.length} rule files`);
    const rules = [];

    // Process each rule file
    for (const file of ruleFiles) {
      console.log(`Fetching ${file}...`);
      const content = await fetchUrl(`${CURSOR_DIRECTORY_BASE_URL}/${file}`);
      
      // Save to local src/rules directory
      const localPath = path.join(LOCAL_RULES_DIR, file);
      writeFileWithDir(localPath, content);
      console.log(`Saved to ${localPath}`);

      // Extract rules from the content and add to rules array
      const ruleMatch = content.match(/export const \w+Rules = (\[[\s\S]+?\]);/);
      if (ruleMatch) {
        const ruleContent = ruleMatch[1];
        try {
          // Safely evaluate the rule content
          const ruleObj = eval(`(${ruleContent})`);
          rules.push(...ruleObj);
        } catch (e) {
          console.error(`Error parsing rules from ${file}:`, e);
        }
      }
    }

    // Format rules JSON with pretty printing
    const rulesJson = JSON.stringify(rules, null, 2);

    // Write combined rules to webview-ui/src/rules.json
    writeFileWithDir(WEBVIEW_SRC_RULES_PATH, rulesJson);
    console.log(`Successfully synced ${rules.length} rules to ${WEBVIEW_SRC_RULES_PATH}`);

  } catch (error) {
    console.error('Error syncing rules:', error);
    process.exit(1);
  }
}

// Run the sync
syncRules(); 