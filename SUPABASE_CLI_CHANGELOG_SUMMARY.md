# Supabase CLI Changelog Summary: v2.54.11 → v2.72.7

## 🎯 Key Features & Improvements

### Major Features Added

#### 1. **Python Type Generation** (v2.66.0)
- Added Python type generator alongside existing TypeScript support
- Command: `supabase gen types python`
- Useful for Python-based backend services

#### 2. **Studio Functions Management API** (v2.69.0)
- Functions folder attachment for Studio
- Better integration between CLI and Studio dashboard

#### 3. **File-based Snippets in Studio** (v2.70.0)
- Support for file-based snippets in Studio
- Better code snippet management

#### 4. **X (Twitter) OAuth 2.0 Provider** (v2.68.0)
- Added X OAuth 2.0 provider support
- New authentication option for projects

#### 5. **Interactive Init Mode** (v2.67.0)
- Replaced IDE flags (`--with-vscode-settings`, `--with-intellij-settings`) with interactive mode
- Better developer experience during project initialization

### Infrastructure Updates

#### Postgres 17 Support
- Full support for Postgres 17 (up to 17.6.1.072)
- Fixed login routes for Postgres 17
- Infrastructure syncing improvements

#### Docker Template Updates
- **Postgres**: 17.6.1.072 (latest)
- **GoTrue (Auth)**: v2.185.0
- **Realtime**: v2.70.0
- **Studio**: Continuous updates
- **Logflare**: 1.28.0
- **Storage API**: v1.33.4

### Bug Fixes & Improvements

#### v2.72.6
- **Fixed**: Tests directory resolution relative to CWD
- Better handling of test file paths

#### v2.72.2
- **Fixed**: Setup cancellation context for all commands
- Better handling of interrupted operations

#### v2.72.1
- **Fixed**: Support for arbitrary test directories
- More flexible test configuration

#### v2.72.0
- **Feature**: Configurable local health check timeout
- Better control over startup timing

#### v2.70.5
- **Fixed**: Remove FDW grant option from schema dump
- Cleaner schema exports

#### v2.70.4
- **Fixed**: Formatting for > billion calls in `ncalls` command
- Better number formatting

#### v2.70.1
- **Fixed**: Better error suggestions on Postgres connection errors
- Improved developer experience

#### v2.67.1
- **Fixed**: Use Deno JSON auto-discovery
- Better Deno configuration detection

#### v2.66.0
- **Fixed**: Change restart policy to "unless stopped"
- Better Docker container management

#### v2.65.9
- **Fixed**: Enable S3 locally by default
- Better local storage support

### Breaking Changes & Deprecations

#### v2.66.1
- **Removed**: Deprecated Deno 2 flags
- Eliminates warnings in newer Deno versions

#### v2.67.0
- **Changed**: IDE flags replaced with interactive mode
- Old flags: `--with-vscode-settings`, `--with-intellij-settings`
- New: Interactive prompt during `supabase init`

### Developer Experience Improvements

1. **Better Error Messages**: Improved Postgres connection error suggestions
2. **Test Directory Flexibility**: Support for arbitrary test directory locations
3. **Health Check Configuration**: Configurable timeout for local health checks
4. **Cancellation Support**: Proper context cancellation for all commands
5. **S3 Enabled by Default**: Local S3 storage now enabled by default

### Dependency Updates

- Go dependencies updated across multiple versions
- NPM packages updated (tar, etc.)
- Docker images continuously updated for security and features

---

## 📋 How to View Full Changelog

### Option 1: GitHub Releases Page
```bash
open https://github.com/supabase/cli/releases
```

### Option 2: Use the Script
```bash
cd /Users/linc/Dev-Work/Crescender/crescender-mobile
./get-supabase-changelog.sh [from_version] [to_version]
```

### Option 3: API Direct
```bash
curl -s 'https://api.github.com/repos/supabase/cli/releases?per_page=100' | \
  jq -r '.[] | select(.tag_name | startswith("v2.")) | "\(.tag_name): \(.body)"' | \
  less
```

### Option 4: Supabase Changelog
```bash
open https://supabase.com/changelog
```

---

## 🔍 Most Relevant Changes for Your Project

Based on your mobile app development:

1. **Postgres 17 Support** - Ensure your local database is compatible
2. **Python Type Generation** - If you have Python services
3. **Better Error Messages** - Improved debugging experience
4. **Test Directory Fixes** - Better test file handling
5. **S3 Enabled by Default** - Local storage now works out of the box

---

## ⚠️ Migration Notes

If you're upgrading from 2.54.11:

1. **Test your local setup**: Run `supabase start` to ensure everything works
2. **Check your config**: Review `supabase/config.toml` for any deprecated settings
3. **Update Docker images**: The CLI will automatically pull latest Docker images
4. **Review test directories**: If you have custom test paths, they should now work better
5. **IDE settings**: If you used `--with-vscode-settings` or `--with-intellij-settings`, use interactive init instead

---

*Generated: 2026-01-20*
*CLI Version: 2.72.7*
