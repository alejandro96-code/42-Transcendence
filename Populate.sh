#!/bin/bash

NUMBER_OF_USERS="$1"

if ! [[ "$NUMBER_OF_USERS" =~ ^[0-9]+$ ]]; then
    echo "Usage error: insert a valid number of users"
    exit 1
fi

curl -k -X POST https://10.14.8.6:8443/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "password": "Password123!",
    "fullName": "Juan Pérez",
    "email": "juan.perez@example.com"
  }'

echo "$NUMBER_OF_USERS"