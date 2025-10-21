# GitHub Actions CI/CD Setup Guide

This guide will help you set up continuous deployment for your FastAPI project using GitHub Actions.

## Prerequisites

1. ✅ AWS EC2 instance running Amazon Linux 2023
2. ✅ Your project in a GitHub repository
3. ✅ SSH access to your EC2 instance

## Step 1: Prepare Your EC2 Instance

### 1.1 Run the setup script on your EC2 instance:

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-ec2-for-github-actions.sh
chmod +x setup-ec2-for-github-actions.sh
./setup-ec2-for-github-actions.sh
```

### 1.2 Clone your repository:

```bash
cd /home/ec2-user
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git mosaic-project-cs4800
cd mosaic-project-cs4800
```

### 1.3 Generate SSH key for GitHub Actions:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key -N ""

# Add public key to authorized_keys
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# Display the private key (copy this for GitHub secrets)
cat ~/.ssh/github_actions_key
```

## Step 2: Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these repository secrets:

### Required Secrets:

1. **`EC2_HOST`**
   - Value: Your EC2 public IP address (e.g., `54.123.45.67`)

2. **`EC2_SSH_KEY`**
   - Value: The private SSH key content from step 1.3
   - Format: Copy the entire content of `~/.ssh/github_actions_key`

### Optional Secrets (for custom configuration):

3. **`SECRET_KEY`**
   - Value: Custom JWT secret key (or leave empty for auto-generation)

4. **`FIRST_SUPERUSER`**
   - Value: Admin user email (default: `admin@example.com`)

5. **`FIRST_SUPERUSER_PASSWORD`**
   - Value: Admin user password (or leave empty for auto-generation)

6. **`POSTGRES_PASSWORD`**
   - Value: Database password (or leave empty for auto-generation)

## Step 3: Configure Security Group

Make sure your EC2 security group allows:

- **SSH (22)** - For GitHub Actions deployment
- **HTTP (80)** - For frontend access
- **Backend API (8000)** - For API access
- **Adminer (8080)** - For database management (optional)
- **Database (5432)** - For external database access (optional)

## Step 4: Test the Deployment

### 4.1 Push to main branch:

```bash
git add .
git commit -m "Add GitHub Actions CI/CD"
git push origin main
```

### 4.2 Check GitHub Actions:

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. You should see the workflow running
4. Click on the workflow to see detailed logs

### 4.3 Verify deployment:

Once the workflow completes successfully, test your application:

- **Frontend**: `http://YOUR_EC2_IP`
- **Backend API**: `http://YOUR_EC2_IP:8000`
- **API Documentation**: `http://YOUR_EC2_IP:8000/docs`
- **Database Admin**: `http://YOUR_EC2_IP:8080`

## Step 5: Workflow Features

### Automatic Triggers:
- ✅ **Push to main/master** - Deploys automatically
- ✅ **Pull Requests** - Runs tests only
- ✅ **Test Suite** - Runs before deployment

### Deployment Process:
1. **Test Phase**: Runs your test suite
2. **Deploy Phase**: Only runs if tests pass
3. **Health Checks**: Verifies services are running
4. **Rollback**: Automatic if deployment fails

### Monitoring:
- **GitHub Actions Logs**: Real-time deployment status
- **EC2 Logs**: `docker compose logs` for service logs
- **Health Endpoints**: Built-in health checks

## Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Check EC2_SSH_KEY secret format
   - Verify EC2_HOST is correct
   - Ensure security group allows SSH

2. **Deployment Fails**
   - Check GitHub Actions logs
   - SSH into EC2 and run: `docker compose logs`
   - Verify all required files are present

3. **Services Not Accessible**
   - Check security group settings
   - Verify services are running: `docker compose ps`
   - Test locally: `curl http://localhost:8000/api/v1/utils/health-check/`

### Debug Commands:

```bash
# SSH into EC2
ssh ec2-user@YOUR_EC2_IP

# Check service status
cd mosaic-project-cs4800
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs

# Restart services
docker compose -f docker-compose.production.yml restart
```

## Advanced Configuration

### Custom Environment Variables:

You can add more secrets to customize your deployment:

- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` - For email functionality
- `SENTRY_DSN` - For error tracking
- `BACKEND_CORS_ORIGINS` - For custom CORS settings

### Multiple Environments:

You can create separate workflows for staging and production by:

1. Creating `.github/workflows/deploy-staging.yml`
2. Using different EC2 instances or different branches
3. Using different secrets (e.g., `EC2_HOST_STAGING`)

## Security Best Practices

1. **SSH Key Security**: Use dedicated SSH keys for CI/CD
2. **Secret Management**: Never commit secrets to code
3. **Network Security**: Restrict security group access
4. **Regular Updates**: Keep EC2 instance and Docker images updated

## Next Steps

Once your CI/CD is working:

1. **Set up monitoring** with tools like CloudWatch
2. **Configure backups** for your database
3. **Set up SSL certificates** if you get a domain
4. **Implement blue-green deployments** for zero-downtime updates

Your FastAPI project now has a complete CI/CD pipeline! 🚀
