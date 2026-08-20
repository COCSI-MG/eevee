#!/bin/bash

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' 

REPO_NAME="eevee-assignments"
REPO_DESCRIPTION="Student assignment files storage"
GITHUB_API_URL="https://api.github.com"
LOCAL_REPO_PATH="./remote-repository"
DEFAULT_BRANCH="main"

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

if [ $# -ne 1 ]; then
    print_error "Usage: $0 <GITHUB_TOKEN>"
    print_info "Example: $0 ghp_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

GITHUB_TOKEN="$1"

# Validate GitHub  format
if [[ ! "$GITHUB_TOKEN" =~ ^(ghp_|gho_|ghu_|ghs_|ghr_) ]]; then
    print_warning "GitHub token format doesn't match expected patterns (ghp_, gho_, ghu_, ghs_, ghr_)"
    print_info "Continuing anyway..."
fi

print_info "Checking dependencies..."

if ! command_exists curl; then
    print_error "curl is required but not installed."
    exit 1
fi

if ! command_exists git; then
    print_error "git is required but not installed."
    exit 1
fi

print_success "Dependencies check completed"

print_info "Testing GitHub API authentication..."

AUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/github_auth_test.json \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$GITHUB_API_URL/user")

HTTP_CODE="${AUTH_RESPONSE: -3}"

if [ "$HTTP_CODE" -ne 200 ]; then
    print_error "GitHub API authentication failed (HTTP $HTTP_CODE)"
    print_error "Response: $(cat /tmp/github_auth_test.json)"
    rm -f /tmp/github_auth_test.json
    exit 1
fi

GITHUB_USERNAME=$(
    grep -o -P '"login":\s*"[^"]*"' /tmp/github_auth_test.json | cut -d'"' -f4
)

print_success "Authenticated as GitHub user: $GITHUB_USERNAME"
rm -f /tmp/github_auth_test.json

print_info "Checking if repository '$REPO_NAME' already exists..."

REPO_CHECK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/github_repo_check.json \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$GITHUB_API_URL/repos/$GITHUB_USERNAME/$REPO_NAME")

REPO_CHECK_HTTP_CODE="${REPO_CHECK_RESPONSE: -3}"

if [ "$REPO_CHECK_HTTP_CODE" -eq 200 ]; then
    print_warning "Repository '$REPO_NAME' already exists!"
    
    REPO_URL=$(grep -o '"clone_url":\s*"[^"]*"' /tmp/github_repo_check.json | cut -d'"' -f4)
    IS_PRIVATE=$(grep -o '"private":\s*[^,}]*' /tmp/github_repo_check.json | cut -d':' -f2)
    
    print_info "Repository URL: $REPO_URL"
    print_info "Private: $IS_PRIVATE"
    
    read -p "Do you want to continue and use the existing repository? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Operation cancelled by user."
        rm -f /tmp/github_repo_check.json
        exit 0
    fi
    
    REPO_URL_HTTPS="$REPO_URL"
    rm -f /tmp/github_repo_check.json
elif [ "$REPO_CHECK_HTTP_CODE" -eq 404 ]; then
    print_info "Repository does not exist. Creating new repository..."
    rm -f /tmp/github_repo_check.json
    
    print_info "Creating GitHub repository '$REPO_NAME'..."
    
    CREATE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/github_create_repo.json \
        -L -X POST \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$GITHUB_API_URL/user/repos" \
        -d "{
            \"name\": \"$REPO_NAME\",
            \"private\": true,
            \"description\": \"$REPO_DESCRIPTION\",
            \"has_issues\": false,
            \"has_projects\": false,
            \"has_wiki\": false,
            \"auto_init\": true,
            \"default_branch\": \"$DEFAULT_BRANCH\"
        }")
    
    CREATE_HTTP_CODE="${CREATE_RESPONSE: -3}"
    
    if [ "$CREATE_HTTP_CODE" -eq 201 ]; then
        REPO_URL_HTTPS=$(grep -o '"clone_url":"[^"]*"' /tmp/github_create_repo.json | cut -d'"' -f4)
        REPO_SSH_URL=$(grep -o '"ssh_url":"[^"]*"' /tmp/github_create_repo.json | cut -d'"' -f4)
        
        print_success "Repository created successfully!"
        print_info "HTTPS URL: $REPO_URL_HTTPS"
        print_info "SSH URL: $REPO_SSH_URL"
        
        rm -f /tmp/github_create_repo.json
    else
        print_error "Failed to create repository (HTTP $CREATE_HTTP_CODE)"
        print_error "Response: $(cat /tmp/github_create_repo.json)"
        rm -f /tmp/github_create_repo.json
        exit 1
    fi
    
else
    print_error "Unexpected response when checking repository (HTTP $REPO_CHECK_HTTP_CODE)"
    rm -f /tmp/github_repo_check.json
    exit 1
fi

print_info "Setting up local repository..."

if [ -d "$LOCAL_REPO_PATH" ]; then
    print_warning "Local repository directory '$LOCAL_REPO_PATH' already exists"
    read -p "Do you want to remove it and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$LOCAL_REPO_PATH"
        print_info "Removed existing local repository"
    else
        print_info "Using existing local repository"
        cd "$LOCAL_REPO_PATH"
        
        if [ ! -d ".git" ]; then
            print_error "Directory exists but is not a git repository"
            exit 1
        fi
        
        CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
        if [ -n "$CURRENT_REMOTE" ] && [ "$CURRENT_REMOTE" != "$REPO_URL_HTTPS" ]; then
            print_warning "Current remote URL ($CURRENT_REMOTE) doesn't match expected URL ($REPO_URL_HTTPS)"
            read -p "Do you want to update the remote URL? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git remote set-url origin "$REPO_URL_HTTPS"
                print_info "Updated remote URL"
            fi
        fi
        
        cd ..
    fi
fi

if [ ! -d "$LOCAL_REPO_PATH" ]; then
    print_info "Cloning repository..."
    
    REPO_URL_WITH_TOKEN=$(echo "$REPO_URL_HTTPS" | sed "s|https://|https://$GITHUB_USERNAME:$GITHUB_TOKEN@|")
    
    if git clone "$REPO_URL_WITH_TOKEN" "$LOCAL_REPO_PATH"; then
        print_success "Repository cloned successfully"
    else
        print_error "Failed to clone repository"
        exit 1
    fi
fi

cd "$LOCAL_REPO_PATH"

print_info "Creating initial directory structure..."

mkdir -p assignments
mkdir -p assignments/.gitkeep

cat > README.md << 'EOF'
# Eevee Assignments Repository

This repository stores student assignment files for the Eevee platform.

## Structure

- `assignments/` - Contains all assignment files organized by assignment and user
  - `assignments/{assignmentId}/` - Assignment-specific folders
    - `assignments/{assignmentId}/{userId}/` - User-specific folders within assignments

## Usage

This repository is managed automatically by the Eevee platform. Files are synchronized through the file-saver service.

## Security

- This is a private repository
- Access is managed through GitHub API tokens
- Files are organized with proper access controls
EOF

cat > .gitignore << 'EOF'
# Temporary files
*.tmp
*.temp

# Log files
*.log
EOF

print_info "Committing initial structure..."

git add .
git config user.name "EEVEE WORKER"
git config user.email "filesaver@eevee.platform"

if git diff --staged --quiet; then
    print_info "No changes to commit"
else
    git commit -m "Initial repository setup for assignment files

- Added README.md with repository documentation
- Created assignments directory structure
- Added .gitignore for common temporary files
- Configured for Eevee platform file management"
    
    print_info "Pushing initial commit..."
    if git push origin "$DEFAULT_BRANCH"; then
        print_success "Initial commit pushed successfully"
    else
        print_error "Failed to push initial commit"
        exit 1
    fi
fi

cd ..

print_success "Repository initialization completed!"

print_info "Cleaning local repository"

rm -rf $LOCAL_REPO_PATH

print_success "Local repo cleaned";

echo
print_info "=== Configuration Summary ==="
print_info "GitHub Username: $GITHUB_USERNAME"
print_info "Repository Name: $REPO_NAME"
print_info "Repository URL: $REPO_URL_HTTPS"
print_info "Default Branch: $DEFAULT_BRANCH"
echo
print_info "=== Next Steps ==="
print_info "1. Update your application configuration with:"
print_info "   - Repository URL: $REPO_URL_HTTPS"
print_info "   - GitHub Token: [REDACTED]"
echo
print_info "2. The repository is ready to receive assignment files"
print_info "3. Use the file-saver service to upload and sync files"
echo
print_success "Setup complete! 🎉"