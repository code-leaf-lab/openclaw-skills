# IP Info Recorder Skill

## Description
Automates the process of retrieving comprehensive public IP address information, capturing detailed system and network data, and logging everything in structured Markdown format to a managed log directory. This skill handles:

- Opening browser with user profile to access enhanced IP info services
- Capturing comprehensive IP, location, and network provider data
- Recording detailed information including IP address, timestamps, browser info, system info, ISP details, and geographic location
- Creating **new unique Markdown log files each time** with complete directory structure auto-creation
- Managing log file retention (keeping only the latest 10 files)
- Cleaning up browser resources after completion

## Usage
```
sessions_spawn(
  runtime="subagent", 
  agentId="ip-info-recorder",
  task="Record current public IP address with screenshot and timestamp"
)
```

## Configuration
- **Log Directory**: `C:\Users\Administrator\Downloads\openclaw\logs\ip-info-recorder`
- **File Retention**: Keeps only the latest 10 log files
- **IP Service**: Uses https://ipinfo.io/json for comprehensive IP and location data
- **Browser Profile**: Uses "user" profile for authenticated sessions
- **Log File Naming**: **Always creates new log file** with format `ip_log_YYYYMMDD_HHMMSS.md`
- **Log Format**: Markdown (.md) with detailed structured information

## Workflow Steps
1. **Open Browser**: Launch browser with user profile
2. **Navigate to IP Service**: Access https://ipinfo.io/ip 
3. **Capture Screenshot**: Take visual snapshot of IP display
4. **Extract IP Data**: Parse IP address from webpage content
5. **Create New Log Entry**: **Always create a new log file** with unique timestamp name: `ip_log_YYYYMMDD_HHMMSS.txt`
6. **Manage Log Files**: Remove oldest files beyond 10-file limit

## Required Permissions
This skill requires the following permissions:
- **Browser automation**: Full browser control with `profile="user"`
- **File system access**: Write access to Downloads directory for log creation
- **File management**: Delete permissions for log rotation
- **Command execution**: PowerShell/cmd execution for file operations

## Output Format
**Log files are ALWAYS named with unique timestamp format**: `ip_log_YYYYMMDD_HHMMSS.md`
**Content format**: Comprehensive Markdown document including:
- IP address and complete timestamp
- Browser and system information
- Network service provider details (if available)
- Geographic location information (if available)
- Execution status and workflow step details
- All relevant metadata

Each execution creates a completely new log file - **never appends to existing files**.

## Example Use Cases
- "Record my current public IP address for network monitoring"
- "Log IP changes with timestamps for security auditing" 
- "Capture IP information with visual proof for documentation"
- "Automate IP address tracking with managed log retention"

## Error Handling
- Retries browser navigation if initial attempt fails
- Validates IP address format before logging
- Handles file permission errors gracefully
- Ensures browser cleanup even if logging fails