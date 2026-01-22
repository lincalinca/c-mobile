#!/bin/bash
# Fetch Supabase CLI changelog between versions
# Usage: ./get-supabase-changelog.sh [from_version] [to_version]

FROM_VERSION=${1:-"2.54.11"}
TO_VERSION=${2:-"2.72.7"}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Supabase CLI Changelog: v${FROM_VERSION} → v${TO_VERSION}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Fetch releases from GitHub API
curl -s "https://api.github.com/repos/supabase/cli/releases?per_page=100" | \
  jq -r '.[] | select(.tag_name | startswith("v2.")) | 
    "\(.tag_name)|\(.published_at)|\(.body)"' | \
  while IFS='|' read -r tag date body; do
    # Extract version number (remove 'v' prefix)
    version=$(echo "$tag" | sed 's/^v//')
    
    # Compare versions (simple numeric comparison for major.minor.patch)
    version_num=$(echo "$version" | awk -F. '{printf "%03d%03d%03d", $1, $2, $3}')
    from_num=$(echo "$FROM_VERSION" | awk -F. '{printf "%03d%03d%03d", $1, $2, $3}')
    to_num=$(echo "$TO_VERSION" | awk -F. '{printf "%03d%03d%03d", $1, $2, $3}')
    
    if [ "$version_num" -ge "$from_num" ] && [ "$version_num" -le "$to_num" ]; then
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "📦 $tag"
      echo "📅 $(echo $date | cut -d'T' -f1)"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "$body" | head -80
      echo ""
      echo ""
    fi
  done

echo ""
echo "💡 Full release notes: https://github.com/supabase/cli/releases"
echo "📚 Changelog: https://supabase.com/changelog"
