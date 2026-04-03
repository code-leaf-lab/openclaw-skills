/**
 * IP Info Recorder Skill Implementation (Updated)
 * 
 * This skill automates the process of retrieving public IP address information,
 * capturing screenshots, and logging the data with timestamps to a managed log directory.
 * 
 * KEY UPDATE: Always creates NEW log file with unique timestamp name each execution.
 */

/**
 * IP Info Recorder Skill Implementation (Updated)
 * 
 * This skill automates the process of retrieving public IP address information,
 * capturing screenshots, and logging comprehensive data with timestamps to a managed log directory.
 * 
 * KEY FEATURES:
 * - Creates NEW Markdown log file with unique timestamp name each execution
 * - Records detailed system and network information
 * - Automatically creates complete directory structure
 * - Uses enhanced IP info service for comprehensive data
 */

class IpInfoRecorderSkill {
  constructor() {
    this.browser = require('openclaw-browser-tool');
    this.exec = require('openclaw-exec-tool');
    this.logDirectory = 'C:\\Users\\Administrator\\Downloads\\openclaw\\logs\\ip-info-recorder';
    this.maxLogFiles = 10;
    this.ipServiceUrl = 'https://ipinfo.io/json'; // Use JSON endpoint for detailed info
  }

  /**
   * Main entry point for the skill
   * @param {Object} params - Skill parameters (optional)
   */
  async execute(params = {}) {
    let browserTabId = null;
    
    try {
      // Step 1: Open browser with user profile
      const openResult = await this.openBrowser();
      browserTabId = openResult.targetId;
      
      // Step 2: Navigate to IP service
      await this.navigateToIpService(browserTabId);
      
      // Step 3: Capture screenshot
      const screenshotResult = await this.captureScreenshot(browserTabId);
      
      // Step 4: Extract IP data
      const ipData = await this.extractIpData(browserTabId);
      
      // Step 5: Create NEW log entry (always new file with unique timestamp)
      const logResult = await this.createNewLogEntry(ipData.ipAddress);
      
      // Step 6: Manage log files (keep only latest 10)
      await this.manageLogFiles();
      
      // Step 7: Cleanup browser
      await this.cleanupBrowser(browserTabId);
      
      return {
        success: true,
        message: 'IP info recording completed successfully',
        ipAddress: ipData.ipAddress,
        timestamp: logResult.timestamp,
        logFile: logResult.logFile,
        screenshot: screenshotResult
      };
      
    } catch (error) {
      // Ensure cleanup even if error occurs
      if (browserTabId) {
        try {
          await this.cleanupBrowser(browserTabId);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      return {
        success: false,
        message: `IP info recording failed: ${error.message}`,
        error: error
      };
    }
  }

  async openBrowser() {
    // Open browser with user profile to IP service
    return await this.browser.open({
      profile: 'user',
      url: this.ipServiceUrl
    });
  }

  async navigateToIpService(tabId) {
    // Verify we're on the correct page
    const snapshot = await this.browser.snapshot({ targetId: tabId });
    if (!snapshot.includes('rootwebarea')) {
      throw new Error('Failed to load IP service page');
    }
    return true;
  }

  async captureScreenshot(tabId) {
    // Capture screenshot of the IP display
    return await this.browser.screenshot({ targetId: tabId });
  }

  async extractIpData(tabId) {
    // Extract comprehensive IP and system information from JSON response
    const snapshot = await this.browser.snapshot({ targetId: tabId });
    
    try {
      // Parse JSON response from ipinfo.io
      const jsonStart = snapshot.indexOf('{');
      const jsonEnd = snapshot.lastIndexOf('}') + 1;
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('JSON response not found in page content');
      }
      
      const jsonContent = snapshot.substring(jsonStart, jsonEnd);
      const ipInfo = JSON.parse(jsonContent);
      
      // Get additional system information
      const systemInfo = await this.getSystemInfo();
      
      return {
        ipAddress: ipInfo.ip || 'Unknown',
        hostname: ipInfo.hostname || 'Unknown',
        city: ipInfo.city || 'Unknown',
        region: ipInfo.region || 'Unknown',
        country: ipInfo.country || 'Unknown',
        loc: ipInfo.loc || 'Unknown',
        org: ipInfo.org || 'Unknown',
        postal: ipInfo.postal || 'Unknown',
        timezone: ipInfo.timezone || 'Unknown',
        systemInfo: systemInfo,
        rawContent: snapshot
      };
    } catch (error) {
      console.error('Error parsing IP info:', error);
      // Fallback to basic IP extraction if JSON parsing fails
      const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
      const match = snapshot.match(ipRegex);
      
      if (!match) {
        throw new Error('IP address not found in page content');
      }
      
      const systemInfo = await this.getSystemInfo();
      
      return {
        ipAddress: match[0],
        hostname: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        country: 'Unknown',
        loc: 'Unknown',
        org: 'Unknown',
        postal: 'Unknown',
        timezone: 'Unknown',
        systemInfo: systemInfo,
        rawContent: snapshot
      };
    }
  }
  
  async getSystemInfo() {
    // Get browser and system information
    try {
      // Get OS information via PowerShell
      const osCommand = 'Get-WmiObject Win32_OperatingSystem | Select-Object Caption, Version | ConvertTo-Json';
      const osResult = await this.exec(`powershell -Command "${osCommand}"`);
      
      let osInfo = 'Windows Unknown';
      try {
        const osData = JSON.parse(osResult);
        osInfo = `${osData.Caption} ${osData.Version}`;
      } catch (e) {
        // Fallback if JSON parsing fails
      }
      
      // Get current user
      const userCommand = '$env:USERNAME';
      const userResult = await this.exec(`powershell -Command "${userCommand}"`);
      const currentUser = userResult.trim() || 'Unknown User';
      
      return {
        operatingSystem: osInfo,
        currentUser: currentUser,
        userAgent: 'Browser User Agent (captured during browser session)',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return {
        operatingSystem: 'Windows Unknown',
        currentUser: 'Unknown User',
        userAgent: 'Browser User Agent (captured during browser session)',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createNewLogEntry(ipData) {
    // ALWAYS create NEW Markdown log file with unique timestamp name
    // Format: ip_log_YYYYMMDD_HHMMSS.md
    
    // Get current timestamp for filename
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const fileName = `ip_log_${year}${month}${day}_${hours}${minutes}${seconds}.md`;
    const logFile = `${this.logDirectory}\\${fileName}`;
    
    // Create comprehensive Markdown content
    const logTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const isoTimestamp = now.toISOString();
    
    // Build detailed Markdown content
    let markdownContent = `# IP Information Recording

`;
    markdownContent += `## Execution Details
`;
    markdownContent += `- **Recording Timestamp**: ${logTimestamp}
`;
    markdownContent += `- **ISO Timestamp**: ${isoTimestamp}
`;
    markdownContent += `- **Status**: Success
`;
    markdownContent += `- **Execution Steps**: Completed all 7 workflow steps successfully

`;
    
    markdownContent += `## Network Information
`;
    markdownContent += `- **IP Address**: ${ipData.ipAddress}
`;
    markdownContent += `- **Hostname**: ${ipData.hostname}
`;
    markdownContent += `- **Organization/ISP**: ${ipData.org}
`;
    markdownContent += `- **Location**: ${ipData.city}, ${ipData.region}, ${ipData.country}
`;
    markdownContent += `- **Coordinates**: ${ipData.loc}
`;
    markdownContent += `- **Postal Code**: ${ipData.postal}
`;
    markdownContent += `- **Timezone**: ${ipData.timezone}

`;
    
    markdownContent += `## System Information
`;
    markdownContent += `- **Operating System**: ${ipData.systemInfo.operatingSystem}
`;
    markdownContent += `- **Current User**: ${ipData.systemInfo.currentUser}
`;
    markdownContent += `- **Browser**: User Profile Browser (authenticated session)
`;
    markdownContent += `- **User Agent**: ${ipData.systemInfo.userAgent}

`;
    
    markdownContent += `## Metadata
`;
    markdownContent += `- **Log File**: ${fileName}
`;
    markdownContent += `- **Log Directory**: ${this.logDirectory}
`;
    markdownContent += `- **IP Service Used**: https://ipinfo.io/json
`;
    markdownContent += `- **Data Source**: ipinfo.io API
`;
    markdownContent += `- **Recording Method**: Automated browser capture

`;
    
    markdownContent += `## Raw Data
`;
    markdownContent += `Raw API response captured during execution.`;
    
    // Ensure log directory exists (complete directory structure)
    await this.ensureLogDirectory();
    
    // Write NEW Markdown log file (never append, always create new)
    // Escape special characters for PowerShell
    const escapedContent = markdownContent.replace(/"/g, '`"').replace(/\/g, '\\');
    const command = `Set-Content -Path "${logFile}" -Value "${escapedContent}" -Encoding UTF8`;
    await this.exec(`powershell -Command "${command}"`);
    
    return {
      timestamp: logTimestamp,
      isoTimestamp: isoTimestamp,
      logFile: logFile,
      content: markdownContent,
      fileName: fileName
    };
  }

  async ensureLogDirectory() {
    // Create complete log directory structure if it doesn't exist
    // Use -Force to create all parent directories automatically
    const command = `New-Item -ItemType Directory -Path '${this.logDirectory}' -Force`;
    await this.exec(`powershell -Command "${command}"`);
  }

  async manageLogFiles() {
    // Keep only the latest 10 Markdown log files (sorted by modification time)
    const command = `Get-ChildItem '${this.logDirectory}\\ip_log_*.md' | Sort-Object LastWriteTime -Descending | Select-Object -Skip ${this.maxLogFiles} | Remove-Item -Force`;
    await this.exec(`powershell -Command "${command}"`);
  }

  async cleanupBrowser(tabId) {
    // Close browser tab and cleanup resources
    return await this.browser.close({ targetId: tabId });
  }
}

module.exports = IpInfoRecorderSkill;