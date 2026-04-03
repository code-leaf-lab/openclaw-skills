# Browser Search Download Skill

## Description
Automates the process of searching for data in web applications (like Qianchuan/Jinritemai) and downloading the results to local storage. This skill handles:
- Navigating to search pages
- Setting search parameters with precise two-step date selection
- Triggering data export/download tasks with specific button identification
- Monitoring download completion with retry logic
- Locating downloaded files on the local system

## Usage
```
sessions_spawn(
  runtime="subagent",
  agentId="browser-search-download",
  task="Search and download data from [platform] with parameters: [details]"
)
```

## Configuration
No special configuration required. Uses the default browser profile ("user") for authenticated sessions.

## Workflow Steps (Latest Process)
1. **Navigate to target page** - Open the specified URL in user's browser
2. **Two-step date selection**:
   - Step 2a: Click date range component to open date picker
   - Step 2b: Wait for date picker to appear, then click preset option (e.g., "最近30天")
3. **Apply data dimensions** - Select required dimensions (e.g., "抖音号")
4. **Precise download button identification** - Find and click button with `name="oc-icon-download"`
5. **Wait for download completion** - Wait 10 seconds for file to download
6. **Verify file existence** - Check Downloads folder for downloaded file
7. **Retry mechanism** - If file doesn't exist, repeat the entire process
8. **Report local file path** - Return the exact local file path when successful

## Required Permissions
This skill requires the following permissions to function properly:
- **Browser automation**: Full access to control user's browser (`profile="user"`)
- **File system access**: Read access to Downloads folder to verify file existence
- **Command execution**: Ability to run PowerShell commands for file verification
- **Network access**: Access to target websites (Qianchuan, Jinritemai, etc.)

If file system access is restricted, the skill will complete browser automation steps but cannot verify or report the exact local file path.

## Supported Platforms
- Qianchuan (Jinritemai) advertising platform
- Other platforms with similar download task workflows

## Limitations
- Requires user to be logged in to the target platform
- Assumes default browser download location (`~/Downloads`)
- May need platform-specific adjustments for different UI structures
- File system verification may be blocked by security policies

## Example Use Cases
- "Download Qianchuan ad performance data for last 30 days by Douyin account"
- "Export TikTok Shop sales data filtered by product category"
- "Get monthly advertising report from Jinritemai platform"

## Error Handling
- Implements precise element identification using `name="oc-icon-download"` attribute
- Includes retry logic for failed downloads
- Provides clear status updates during each workflow step
- Reports local file path or detailed error information upon completion