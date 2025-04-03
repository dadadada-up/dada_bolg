#!/bin/bash

# Function to process markdown files
process_markdown_file() {
    file="$1"
    echo "Processing: $file"
    
    # Add quotes to title and date if missing
    sed -i '' -E '
        /^title:/ {
            /^title: ".*"$/! s/^title: (.*)$/title: "\1"/
        }
        /^date:/ {
            /^date: ".*"$/! s/^date: (.*)$/date: "\1"/
        }
    ' "$file"
    
    # Ensure proper image paths
    sed -i '' 's|!\[\](images/|![](/assets/images/|g' "$file"
    sed -i '' 's|!\[\](\./images/|![](/assets/images/|g' "$file"
    
    # Convert top-level headers to second-level
    sed -i '' 's/^# /## /g' "$file"
    
    # Ensure categories and tags are properly formatted
    sed -i '' '/^categories:/ {
        /^categories:$/{
            N
            s/^categories:\n *- /categories: \n  - /
        }
    }' "$file"
    
    sed -i '' '/^tags:/ {
        /^tags:$/{
            N
            s/^tags:\n *- /tags: \n  - /
        }
    }' "$file"
}

# Process all markdown files in posts directory
find ./docs/posts -name "*.md" -type f | while read -r file; do
    process_markdown_file "$file"
done

# Process all markdown files in drafts directory
find ./docs/drafts -name "*.md" -type f | while read -r file; do
    process_markdown_file "$file"
done

echo "All markdown files have been processed."