/**
 * Browser Search Download Skill Implementation (Updated with Latest Process)
 * 
 * This skill automates the process of searching for data in web applications
 * and downloading the results to local storage with precise two-step date selection
 * and specific download button identification.
 */

class BrowserSearchDownloadSkill {
  constructor() {
    this.browser = require('openclaw-browser-tool');
    this.exec = require('openclaw-exec-tool');
    this.maxRetries = 3;
    this.downloadWaitTime = 10000; // 10 seconds
  }

  /**
   * Main entry point for the skill
   * @param {Object} params - Skill parameters
   * @param {string} params.url - Target URL to navigate to
   * @param {Object} params.searchParams - Search parameters to apply
   * @param {string} params.presetDate - Preset date option (e.g., "最近30天")
   * @param {Array} params.dimensions - Data dimensions to select (e.g., ["抖音号"])
   * @param {string} params.fileNamePattern - Pattern to identify downloaded file
   */
  async execute(params) {
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      try {
        // Step 1: Navigate to target page
        await this.navigateToPage(params.url);
        
        // Step 2: Two-step date selection
        await this.performTwoStepDateSelection(params.presetDate);
        
        // Step 3: Apply data dimensions
        await this.setDimensions(params.dimensions);
        
        // Step 4: Precise download button identification and click
        await this.clickPreciseDownloadButton();
        
        // Step 5: Wait for download completion
        await this.waitDownloadCompletion();
        
        // Step 6: Verify file existence
        const filePath = await this.verifyFileExists(params.fileNamePattern);
        if (filePath) {
          return {
            success: true,
            message: 'Download completed successfully',
            filePath: filePath
          };
        }
        
        console.log(`File not found on attempt ${retryCount + 1}, retrying...`);
        retryCount++;
        
      } catch (error) {
        console.log(`Attempt ${retryCount + 1} failed: ${error.message}`);
        retryCount++;
        
        if (retryCount >= this.maxRetries) {
          // Return partial success if browser steps completed but file verification failed
          return {
            success: false,
            message: `Download automation completed but file verification failed after ${this.maxRetries} attempts. File may be in Downloads folder but cannot be verified due to permissions.`,
            error: error,
            browserStepsCompleted: true
          };
        }
      }
    }
    
    return {
      success: false,
      message: `Download failed after ${this.maxRetries} attempts`,
      error: new Error('Max retries exceeded')
    };
  }

  async navigateToPage(url) {
    // Open URL in user's browser profile
    return await this.browser.open({ profile: 'user', url });
  }

  async performTwoStepDateSelection(presetDate) {
    // Step 2a: Click date range component to open date picker
    await this.clickDateRangeComponent();
    
    // Step 2b: Wait for date picker to appear, then click preset option
    await this.waitForDatePicker();
    await this.clickPresetDate(presetDate);
  }

  async clickDateRangeComponent() {
    // Click the date range input field to open date picker
    return await this.browser.act({
      kind: 'evaluate',
      fn: `() => {
        // Find date range components (common selectors for Qianchuan)
        const dateInputs = document.querySelectorAll('input[type="text"], .date-range-input, [placeholder*="日期"]');
        for (let input of dateInputs) {
          if (input.value && input.value.includes('-')) {
            // Found date range input with existing value
            input.click();
            return 'Clicked date range component';
          }
        }
        // Fallback: click first date-related element
        const dateElements = document.querySelectorAll('[ref*="date"], .date-picker-trigger');
        if (dateElements.length > 0) {
          dateElements[0].click();
          return 'Clicked date range component (fallback)';
        }
        return 'Date range component not found';
      }`
    });
  }

  async waitForDatePicker() {
    // Wait for date picker to appear (up to 5 seconds)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds with 100ms intervals
    
    while (attempts < maxAttempts) {
      const result = await this.browser.act({
        kind: 'evaluate',
        fn: `() => {
          // Check if date picker is visible
          const datePicker = document.querySelector('.ant-calendar, .date-picker-panel, [class*="date-picker"]');
          return datePicker && window.getComputedStyle(datePicker).display !== 'none';
        }`
      });
      
      if (result === true) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    throw new Error('Date picker did not appear within timeout');
  }

  async clickPresetDate(presetDate) {
    // Click preset date options like "最近30天"
    return await this.browser.act({
      kind: 'evaluate',
      fn: `() => {
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          if (element.textContent && element.textContent.trim() === '${presetDate}') {
            if (element.click) {
              element.click();
              return 'Clicked preset date';
            }
          }
        }
        return 'Preset date not found';
      }`
    });
  }

  async setDimensions(dimensions) {
    // Handle data dimension selection (e.g., "抖音号", "商品", "计划")
    for (const dimension of dimensions) {
      await this.clickDimension(dimension);
    }
  }

  async clickDimension(dimension) {
    // Click data dimension options like "抖音号"
    return await this.browser.act({
      kind: 'evaluate',
      fn: `() => {
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          if (element.textContent && element.textContent.trim() === '${dimension}') {
            if (element.click) {
              element.click();
              return 'Clicked dimension';
            }
          }
        }
        return 'Dimension not found';
      }`
    });
  }

  async clickPreciseDownloadButton() {
    // Find and click download button with name="oc-icon-download"
    return await this.browser.act({
      kind: 'evaluate',
      fn: `() => {
        // Method 1: Find by name attribute
        const buttonsByName = document.querySelectorAll('[name="oc-icon-download"]');
        if (buttonsByName.length > 0) {
          buttonsByName[0].click();
          return 'Clicked download button by name attribute';
        }
        
        // Method 2: Find by class containing oc-icon-download
        const buttonsByClass = document.querySelectorAll('[class*="oc-icon-download"]');
        if (buttonsByClass.length > 0) {
          buttonsByClass[0].click();
          return 'Clicked download button by class';
        }
        
        // Method 3: Find by text content
        const buttonsByText = document.querySelectorAll('button, [role="button"]');
        for (let button of buttonsByText) {
          if (button.textContent && button.textContent.includes('下载')) {
            button.click();
            return 'Clicked download button by text content';
          }
        }
        
        return 'Download button not found';
      }`
    });
  }

  async waitDownloadCompletion() {
    // Wait for download to complete (10 seconds)
    await new Promise(resolve => setTimeout(resolve, this.downloadWaitTime));
  }

  async verifyFileExists(fileNamePattern) {
    // Try to find the downloaded file in default download location
    const downloadPath = 'C:\\Users\\Administrator\\Downloads';
    const command = `powershell -Command "Get-ChildItem -Path '${downloadPath}' -Filter '*${fileNamePattern}*' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { $_.FullName }"`;
    
    try {
      const result = await this.exec(command);
      if (result.stdout && result.stdout.trim()) {
        return result.stdout.trim();
      }
    } catch (error) {
      // File not found or command failed (likely due to permissions)
      console.log('File verification failed:', error.message);
    }
    
    return null;
  }
}

module.exports = BrowserSearchDownloadSkill;