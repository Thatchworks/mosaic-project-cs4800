#!/bin/bash

# Setup script for EC2 instance to work with GitHub Actions
# Run this script on your EC2 instance to prepare it for CI/CD

set -e

echo "Setting up EC2 instance for GitHub Actions deployment..."

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git (if not already installed)
sudo yum install -y git

# Install Python3 (for secret generation)
sudo yum install -y python3

# Create project directory
mkdir -p /home/ec2-user/mosaic-project-cs4800
cd /home/ec2-user/mosaic-project-cs4800

# Create a simple script to handle deployments
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest changes
git pull origin main || git pull origin master

# Make deployment script executable
chmod +x deploy-github-actions.sh

# Run deployment script
./deploy-github-actions.sh $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Deploy with Docker Compose
docker compose -f docker-compose.production.yml down || true
docker compose -f docker-compose.production.yml up -d --build

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 30

# Check if services are running
docker compose -f docker-compose.production.yml ps

echo "Deployment completed!"
EOF

chmod +x deploy.sh

# Create a systemd service for auto-deployment (optional)
sudo tee /etc/systemd/system/mosaic-deploy.service > /dev/null << EOF
[Unit]
Description=Mosaic Project Auto Deploy
After=network.target

[Service]
Type=oneshot
User=ec2-user
WorkingDirectory=/home/ec2-user/mosaic-project-cs4800
ExecStart=/home/ec2-user/mosaic-project-cs4800/deploy.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "EC2 instance setup completed!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to this EC2 instance:"
echo "   git clone YOUR_REPOSITORY_URL /home/ec2-user/mosaic-project-cs4800"
echo ""
echo "2. Set up SSH key for GitHub Actions:"
echo "   - Generate SSH key: ssh-keygen -t rsa -b 4096 -C 'github-actions'"
echo "   - Add public key to EC2 instance authorized_keys"
echo "   - Add private key to GitHub repository secrets as EC2_SSH_KEY"
echo ""
echo "3. Add these secrets to your GitHub repository:"
echo "   - EC2_HOST: Your EC2 public IP"
echo "   - EC2_SSH_KEY: The private SSH key"
echo ""
echo "4. Configure your security group to allow:"
echo "   - SSH (22), HTTP (80), Backend (8000), Adminer (8080)"
