#!/bin/bash

NUMBER_OF_USERS="$1"

if ! [[ "$NUMBER_OF_USERS" =~ ^[0-9]+$ ]]; then
    echo "Usage error: insert a valid number of users"
    exit 1
fi

for ((i=1; i<=NUMBER_OF_USERS; i++)); do
    CURRENT_TIME=$(date '+%Y%m%d-%H%M%S')
    USERNAME="john.doe-${CURRENT_TIME}-${i}"

    curl -k -s -o /dev/null -X POST https://10.14.8.6:8443/api/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"$USERNAME\",
        \"password\": \"Password123!\",
        \"fullName\": \"John Doe\",
        \"email\": \"$USERNAME@example.com\"
      }"

    echo "Created user: $USERNAME"
done

echo "Done! $NUMBER_OF_USERS users made with the Password123!"