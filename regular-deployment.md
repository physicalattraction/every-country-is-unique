# Regular Deployment Guide

This document outlines the steps for deploying updates to the Every Country Is Unique application after initial deployment. This guide assumes you have already completed the first-time deployment process as described in [First-Time Deployment Guide](first-deployment.md).

## Prerequisites

### SSH Configuration
Add the following to your `~/.ssh/config` file to easily connect to the server:
```bash
Host eciu
    Hostname everycountryisunique.com
    IdentityFile ~/.ssh/eciu
```

Then you can connect to the server using:
```bash
ssh eciu
```

All commands in this guide should be run on the production server. You can either:
1. SSH into the server first and then run the commands
2. Use SSH to run commands directly: `ssh eciu 'command'`

## 1. Backend Updates

### 1.1 Deploy Backend Changes

```bash
# SSH into the server
ssh eciu

# Navigate to backend directory
cd /webapps/every-country-is-unique/backend

# Pull latest changes
git pull

# Rebuild and restart the backend container
sudo NODE_ENV=production docker-compose up -d --build
```

### 1.2 Verify Backend Deployment

```bash
# Check container logs
sudo docker logs -f api-every-country-is-unique

# Test API endpoint
curl -L https://api.everycountryisunique.com/countries
```

## 2. Frontend Updates

### 2.1 Deploy Frontend Changes

```bash
# SSH into the server
ssh eciu

# Navigate to frontend directory
cd /webapps/every-country-is-unique/frontend

# Pull latest changes
git pull

# Rebuild and restart the frontend container
sudo NODE_ENV=production docker-compose up -d --build
```

### 2.2 Verify Frontend Deployment

```bash
# Check container logs
sudo docker logs -f web-every-country-is-unique

# Test frontend access
curl -L https://everycountryisunique.com
```

## 3. Database Migrations

If you've made changes to the database schema:

```bash
# SSH into the server
ssh eciu

# Navigate to backend directory
cd /webapps/every-country-is-unique/backend

# Run migrations
sudo NODE_ENV=production docker-compose exec api npm run typeorm migration:run
```

## 4. Rollback Procedure

If you need to rollback changes:

```bash
# SSH into the server
ssh eciu

# For backend
cd /webapps/every-country-is-unique/backend
sudo NODE_ENV=production docker-compose down
git checkout <previous-commit>
sudo NODE_ENV=production docker-compose up -d --build

# For frontend
cd /webapps/every-country-is-unique/frontend
sudo NODE_ENV=production docker-compose down
git checkout <previous-commit>
sudo NODE_ENV=production docker-compose up -d --build
```

## 5. Monitoring

### 5.1 Check Application Status

```bash
# SSH into the server
ssh eciu

# Check running containers
sudo docker ps

# Check container health
sudo docker inspect api-every-country-is-unique
sudo docker inspect web-every-country-is-unique
```

### 5.2 Monitor Logs

```bash
# SSH into the server
ssh eciu

# Backend logs
sudo docker logs -f api-every-country-is-unique

# Frontend logs
sudo docker logs -f web-every-country-is-unique

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 6. Common Issues and Solutions

### 6.1 Container Won't Start

```bash
# SSH into the server
ssh eciu

# Check container logs for errors
sudo docker logs api-every-country-is-unique
sudo docker logs web-every-country-is-unique

# Check container status
sudo docker ps -a

# Restart containers
sudo docker-compose restart
```

### 6.2 Database Connection Issues

```bash
# SSH into the server
ssh eciu

# Check database container
sudo docker ps | grep postgres

# Check database logs
sudo docker logs postgres-every-country-is-unique

# Verify database connection
sudo docker exec api-every-country-is-unique npm run typeorm migration:show
```

### 6.3 Nginx Issues

```bash
# SSH into the server
ssh eciu

# Check nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

## 7. Maintenance Schedule

Regular maintenance tasks:

```bash
# SSH into the server
ssh eciu

# Weekly: Check logs for errors
sudo docker logs --since 7d api-every-country-is-unique
sudo docker logs --since 7d web-every-country-is-unique

# Monthly: Update system packages
sudo apt update
sudo apt upgrade -y

# Quarterly: Renew SSL certificates
sudo certbot renew --dry-run
``` 