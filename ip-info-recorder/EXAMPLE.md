# IP Info Recorder Skill - Usage Examples (Updated)

## Key Feature Update
**Each execution ALWAYS creates a NEW log file** with unique timestamp name: `ip_log_YYYYMMDD_HHMMSS.txt`
- Never appends to existing files
- Always generates fresh filename based on current time
- Ensures each IP record is uniquely identifiable

## Basic Usage
```javascript
sessions_spawn({
  runtime: "subagent",
  agentId: "ip-info-recorder",
  task: "Record current public IP address with screenshot and timestamp"
})
```

## Expected Log File Naming
**Always creates new file**: `ip_log_20260403_125430.txt` (example)
- **Format**: `ip_log_YYYYMMDD_HHMMSS.txt`
- **Example**: `ip_log_20260403_125430.txt` = April 3, 2026 at 12:54:30

## Expected Output - Success Case
When successful, the skill returns:
```json
{
  "success": true,
  "message": "IP info recording completed successfully",
  "ipAddress": "104.28.201.73",
  "timestamp": "2026-04-03 12:54:30",
  "logFile": "C:\\Users\\Administrator\\Downloads\\openclaw-logs\\ip_log_20260403_125430.txt",
  "screenshot": "[screenshot data]"
}
```

## Log File Format
**Filename**: `ip_log_YYYYMMDD_HHMMSS.txt` (always new)  
**Content**: `[YYYY-MM-DD HH:MM:SS] IP Address: XXX.XXX.XXX.XXX`

Example log file content:
```
[2026-04-03 12:54:30] IP Address: 104.28.201.73
```

## File Management
- **Creation**: Always creates new file (never appends)
- **Retention**: Keeps only latest 10 files in directory
- **Cleanup**: Automatically removes oldest files beyond limit

## Required Permissions
The skill requires these permissions to be pre-approved in `exec-approvals.json`:

### Browser Permissions
- Full browser control with `profile="user"`

### File System Permissions  
- Write access to `C:\Users\Administrator\Downloads\openclaw-logs`
- Create directory permissions
- Delete file permissions for log rotation

### Command Execution Permissions
- PowerShell execution for file management
- CMD execution for simple file writing

## Best Practices
1. **Unique Records**: Each execution creates unique timestamped file
2. **Ensure network connectivity** before running the skill
3. **Pre-approve required permissions** to avoid interactive prompts
4. **Monitor log directory size** if running frequently
5. **Customize log retention** based on your storage requirements

## Integration Examples
- **Network monitoring**: Run hourly to track IP changes with unique timestamps
- **Security auditing**: Log IP addresses with unique identifiers for compliance
- **Documentation**: Capture visual proof of IP information with timestamped records
- **Automation workflows**: Integrate into larger network management tasks with guaranteed unique logs