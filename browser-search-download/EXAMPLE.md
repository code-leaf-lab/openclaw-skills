# Browser Search Download Skill - Usage Examples (Updated)

## Basic Usage
```javascript
sessions_spawn({
  runtime: "subagent",
  agentId: "browser-search-download",
  task: "Download Qianchuan ad performance data for last 30 days by Douyin account"
})
```

## Advanced Usage with Latest Process Parameters
```javascript
sessions_spawn({
  runtime: "subagent", 
  agentId: "browser-search-download",
  task: JSON.stringify({
    url: "https://qianchuan.jinritemai.com/dataV2/bidding/site-promotion?aavid=1696531606039560",
    presetDate: "最近30天",
    dimensions: ["抖音号"],
    fileNamePattern: "全域推广数据_抖音号"
  })
})
```

## Latest Workflow Process
The skill now implements the precise two-step process:

### Step 1: Two-Step Date Selection
1. **Click date range component** - Opens the date picker UI
2. **Wait for date picker to appear** - Ensures UI is fully loaded  
3. **Click preset date option** - Selects "最近30天" or other preset

### Step 2: Precise Download Button Identification
- **Primary method**: Find button with `name="oc-icon-download"` attribute
- **Fallback methods**: Class-based search, text content search
- **Guaranteed identification**: Multiple search strategies ensure button is found

### Step 3: Retry Logic with File Verification
1. **Wait 10 seconds** after download initiation
2. **Check Downloads folder** for file existence
3. **Retry entire process** if file not found (up to 3 attempts)
4. **Report success/failure** with detailed status

## Required Permissions
This skill requires specific permissions that may need approval:

### Browser Automation Permissions
- Full browser control with `profile="user"`
- Access to authenticated sessions
- DOM manipulation and element interaction

### File System Permissions  
- Read access to `C:\Users\Administrator\Downloads`
- PowerShell command execution for file verification
- File existence checking capabilities

### Network Permissions
- Access to target domains (qianchuan.jinritemai.com, etc.)
- Cross-origin requests as needed

## Expected Output - Success Case
When successful and file system access is available:
```json
{
  "success": true,
  "message": "Download completed successfully",
  "filePath": "C:\\Users\\Administrator\\Downloads\\全域推广数据_抖音号_2026-03-04 00_00_00-2026-04-02 23_59_59-7624073806923071542.xlsx"
}
```

## Expected Output - Permission Restricted Case  
When browser automation succeeds but file system access is restricted:
```json
{
  "success": false,
  "message": "Download automation completed but file verification failed after 3 attempts. File may be in Downloads folder but cannot be verified due to permissions.",
  "browserStepsCompleted": true
}
```

## Error Handling Scenarios
- **Date picker timeout**: Retries date selection process
- **Download button not found**: Uses multiple identification strategies
- **File verification failure**: Implements retry logic with clear error reporting
- **Permission denied**: Completes browser steps and reports partial success

## Best Practices
1. **Ensure you're logged in** to the target platform before running
2. **Grant file system permissions** when prompted for complete functionality
3. **Use specific fileNamePattern** to help identify the correct downloaded file
4. **Monitor browser downloads** manually if file system access is restricted