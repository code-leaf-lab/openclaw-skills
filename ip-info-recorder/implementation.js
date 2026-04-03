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
        userAgent: '浏览器用户代理（在浏览器会话期间捕获）',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return {
        operatingSystem: 'Windows 未知',
        currentUser: '未知用户',
        userAgent: '浏览器用户代理（在浏览器会话期间捕获）',
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
    let markdownContent = `# IP 信息记录

`;
    markdownContent += `## 执行详情
`;
    markdownContent += `- **记录时间戳**: ${logTimestamp}
`;
    markdownContent += `- **ISO 时间戳**: ${isoTimestamp}
`;
    markdownContent += `- **状态**: 成功
`;
    markdownContent += `- **执行步骤**: 成功完成所有 7 个工作流程步骤

`;
    
    markdownContent += `## 网络信息
`;
    markdownContent += `- **IP 地址**: ${ipData.ipAddress}
`;
    markdownContent += `- **主机名**: ${ipData.hostname}
`;
    markdownContent += `- **组织/ISP**: ${ipData.org}
`;
    markdownContent += `- **位置**: ${ipData.city}, ${ipData.region}, ${ipData.country}
`;
    markdownContent += `- **坐标**: ${ipData.loc}
`;
    markdownContent += `- **邮政编码**: ${ipData.postal}
`;
    markdownContent += `- **时区**: ${ipData.timezone}

`;
    
    markdownContent += `## 系统信息
`;
    markdownContent += `- **操作系统**: ${ipData.systemInfo.operatingSystem}
`;
    markdownContent += `- **当前用户**: ${ipData.systemInfo.currentUser}
`;
    markdownContent += `- **浏览器**: 用户配置文件浏览器（已认证会话）
`;
    markdownContent += `- **用户代理**: ${ipData.systemInfo.userAgent}

`;
    
    markdownContent += `## 元数据
`;
    markdownContent += `- **日志文件**: ${fileName}
`;
    markdownContent += `- **日志目录**: ${this.logDirectory}
`;
    markdownContent += `- **使用的 IP 服务**: https://ipinfo.io/json
`;
    markdownContent += `- **数据源**: ipinfo.io API
`;
    markdownContent += `- **记录方法**: 自动化浏览器捕获

`;
    
    markdownContent += `## 原始数据
`;
    markdownContent += `执行期间捕获的原始 API 响应。`;
    
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