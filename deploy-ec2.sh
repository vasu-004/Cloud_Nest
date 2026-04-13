#!/bin/bash

# Cloud_Nest EC2 Deployment Script (Ubuntu 22.04 LTS)
# This script installs Node.js, MongoDB, Nginx, PM2 and deploys the Cloud_Nest app.

set -e

echo "🚀 Starting Cloud_Nest Deployment..."

# 1. Update System
echo "🔄 Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential gnupg wget

# 2. Install Node.js v20
echo "🟢 Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install MongoDB 7.0
echo "🍃 Installing MongoDB 7.0..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg --yes
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 4. Global Tools
echo "🛠️ Installing PM2..."
sudo npm install -g pm2

# 5. Prepare Web Directory
echo "📂 Preparing app directory..."
TARGET_DIR="/opt/Cloud_Nest"
sudo mkdir -p "$TARGET_DIR"
sudo chown -R $USER:$USER "$TARGET_DIR"

# Only copy if we are not already in the target directory
if [ "$(readlink -f .)" != "$(readlink -f $TARGET_DIR)" ]; then
    echo "🚚 Copying files to $TARGET_DIR..."
    cp -r . "$TARGET_DIR/"
fi

cd "$TARGET_DIR"


# 6. Fetch Public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "🌐 Public IP detected: $PUBLIC_IP"

# 7. Setup Backend
echo "📦 Setting up Backend..."
cd backend
npm install

# Create .env from template
cp .env.example .env

# Update .env for local MongoDB and current IP
sed -i "s|MONGO_URI=.*|MONGO_URI=mongodb://localhost:27017/clouduploader|g" .env
sed -i "s|CLIENT_URL=.*|CLIENT_URL=http://$PUBLIC_IP|g" .env
sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env

# Start with PM2
pm2 stop cloud-nest-api || true
pm2 start server.js --name cloud-nest-api
pm2 save

# Initialize Database
echo "🗄️ Initializing MongoDB Collections & Admin User..."
node scripts/init-db.js
cd ..


# 8. Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend
npm install

# Create .env from template (optional but useful)
cp .env.example .env || true

# Build with Production URL
VITE_API_URL="http://$PUBLIC_IP/api" npm run build
cd ..

# 9. Configure Nginx
echo "🛡️ Configuring Nginx..."
sudo apt install -y nginx

cat <<EOF | sudo tee /etc/nginx/sites-available/Cloud_Nest
server {
    listen 80;
    server_name $PUBLIC_IP;

    # Frontend Static Files
    location / {
        root /opt/Cloud_Nest/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }


    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/Cloud_Nest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 10. Firewall
echo "🧱 Configuring Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "✅ Deployment Complete!"
echo "📍 Access your app at: http://$PUBLIC_IP"
echo "🔍 Check backend status: pm2 status"
echo "📂 App Location: /opt/Cloud_Nest"

