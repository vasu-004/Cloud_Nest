#!/bin/bash

# ==============================================================================
# MongoDB Installation & Setup Script for Ubuntu 22.04 / 24.04
# ==============================================================================
# This script will:
# 1. Install MongoDB 7.0 Community Edition
# 2. Create an Admin user
# 3. Create a Database & User for the CloudVault app
# 4. Enable authentication for security
# ==============================================================================

# --- 1. Variables (Update these if needed) ---
DB_NAME="cloudvault"
APP_USER="vault_user"
APP_PASS="vault_password_123"

ADMIN_USER="db_admin"
ADMIN_PASS="admin_secure_pass_456"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Starting MongoDB Setup...${NC}"

# --- 2. Install MongoDB ---
echo -e "${BLUE}>>> Installing Dependencies & Adding Repo...${NC}"
sudo apt-get update
sudo apt-get install -y gnupg curl

# Import public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor --yes

# Add repo for Ubuntu 22.04 (check /etc/lsb-release if on different version)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt-get update
echo -e "${BLUE}>>> Installing MongoDB Package...${NC}"
sudo apt-get install -y mongodb-org

# --- 3. Start & Enable MongoDB ---
echo -e "${BLUE}>>> Starting MongoDB Service...${NC}"
sudo systemctl start mongod
sudo systemctl enable mongod

# Wait for MongoDB to start
sleep 5

# --- 4. Create Admin & App Users ---
echo -e "${BLUE}>>> Creating Database Users...${NC}"

# Create Admin User
sudo mongosh <<EOF
use admin
db.createUser({
  user: "$ADMIN_USER",
  pwd: "$ADMIN_PASS",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})
EOF

# Create App User and Database
sudo mongosh -u "$ADMIN_USER" -p "$ADMIN_PASS" --authenticationDatabase admin <<EOF
use $DB_NAME
db.createUser({
  user: "$APP_USER",
  pwd: "$APP_PASS",
  roles: [ { role: "readWrite", db: "$DB_NAME" } ]
})
EOF

# --- 5. Enable Security ---
echo -e "${BLUE}>>> Securing MongoDB...${NC}"
# Enable authorization in config
sudo sed -i 's/#security:/security:\n  authorization: enabled/g' /etc/mongod.conf

# Optional: Enable Remote Access (uncomment if needed, but be careful!)
# sudo sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/g' /etc/mongod.conf

sudo systemctl restart mongod

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN} MongoDB Setup Complete! ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Your Connection URI for CloudVault:"
echo -e "mongodb://$APP_USER:$APP_PASS@YOUR_VM_IP:27017/$DB_NAME?authSource=$DB_NAME"
echo -e "===================================================="
echo -e "Admin Credentials: $ADMIN_USER / $ADMIN_PASS"
echo -e "App Credentials:   $APP_USER / $APP_PASS"
echo -e "===================================================="
