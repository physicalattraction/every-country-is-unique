# First Deployment Guide

This document outlines the steps taken to deploy the Every Country Is Unique application fir the first time, including SSL certification, nginx configuration, and Docker setup.

## Prerequisites

- A server with Docker and Docker Compose installed
- A domain name (in this case: everycountryisunique.com)
- DNS records configured for:
  - everycountryisunique.com (A record)
  - www.everycountryisunique.com (A record)
  - api.everycountryisunique.com (A record)

## 1. Server Setup

### 1.1 Initial Server Configuration

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 1.2 DNS Configuration

Ensure your DNS records are properly configured:
- A record for everycountryisunique.com pointing to your server's IP
- A record for www.everycountryisunique.com pointing to your server's IP
- A record for api.everycountryisunique.com pointing to your server's IP

## 2. SSL Certificate Setup

### 2.1 Install Certbot

```bash
# Remove any existing certbot installations
sudo apt remove --purge certbot python3-certbot-nginx
sudo snap remove certbot

# Clean up old files
sudo rm -rf /etc/letsencrypt
sudo rm -rf /var/lib/letsencrypt
sudo rm -rf /var/log/letsencrypt

# Install certbot via snap (recommended)
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

### 2.2 Obtain SSL Certificates

First, ensure port 80 is not in use:
```bash
# Stop any service that might be using port 80
sudo systemctl stop nginx
```

Then obtain certificates using standalone mode:
```bash
# Test certificate request (dry run)
sudo certbot certonly --standalone --dry-run \
  -d everycountryisunique.com \
  -d www.everycountryisunique.com \
  -d api.everycountryisunique.com

# If dry run is successful, obtain actual certificates
sudo certbot certonly --standalone \
  -d everycountryisunique.com \
  -d www.everycountryisunique.com \
  -d api.everycountryisunique.com
```

Note: The standalone mode requires port 80 to be available and not blocked by a firewall. If you have a firewall enabled, you'll need to temporarily allow port 80:
```bash
# If using UFW
sudo ufw allow 80/tcp

# If using iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

After obtaining the certificates, you can proceed with the nginx configuration in step 3.

## 3. Nginx Configuration

### 3.1 Basic Nginx Setup

```bash
# Create necessary directories
sudo mkdir -p /var/www/html
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### 3.2 Nginx Configuration File

Create `/etc/nginx/sites-available/everycountryisunique`:

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name everycountryisunique.com www.everycountryisunique.com api.everycountryisunique.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS configuration for main website and www
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name everycountryisunique.com www.everycountryisunique.com;

    ssl_certificate /etc/letsencrypt/live/everycountryisunique.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/everycountryisunique.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API location - redirect to api subdomain
    location /api/ {
        return 301 https://api.everycountryisunique.com$request_uri;
    }
}

# HTTPS configuration for API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.everycountryisunique.com;

    ssl_certificate /etc/letsencrypt/live/everycountryisunique.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/everycountryisunique.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.3 Enable Nginx Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/everycountryisunique /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Application Deployment

### 4.1 Frontend Configuration

Create `frontend/environment/.env.production`:
```bash
NEXT_PUBLIC_API_URL=https://api.everycountryisunique.com
```

### 4.2 Backend Configuration

Update CORS settings in `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: [
    'https://everycountryisunique.com',
    'https://www.everycountryisunique.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### 4.3 Deploy Application

```bash
# Deploy backend
cd backend
sudo NODE_ENV=production docker-compose up -d --build

# Deploy frontend
cd ../frontend
sudo NODE_ENV=production docker-compose up -d --build
```

## 5. Verification

### 5.1 Test HTTP to HTTPS Redirect
```bash
curl -I http://everycountryisunique.com
```

### 5.2 Test Frontend Access
```bash
curl -I https://everycountryisunique.com
curl -I https://www.everycountryisunique.com
```

### 5.3 Test API Access
```bash
curl -I https://api.everycountryisunique.com/countries
```

### 5.4 Test API Redirect
```bash
curl -I https://everycountryisunique.com/api/countries
```

## 6. Maintenance

### 6.1 SSL Certificate Renewal
Certbot automatically sets up a renewal schedule. You can manually test renewal:
```bash
sudo certbot renew --dry-run
```

### 6.2 Application Updates
To update the application:
```bash
# Update backend
cd backend
sudo NODE_ENV=production docker-compose up -d --build

# Update frontend
cd ../frontend
sudo NODE_ENV=production docker-compose up -d --build
```

### 6.3 Logs
Monitor application logs:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
sudo docker logs -f web-every-country-is-unique
sudo docker logs -f api-every-country-is-unique
```

## 7. Troubleshooting

### 7.1 Common Issues

1. CORS Issues
   - Verify CORS configuration in backend
   - Check frontend API URL configuration
   - Ensure proper headers are set in nginx

2. SSL Certificate Issues
   - Check certificate expiration
   - Verify nginx SSL configuration
   - Ensure proper file permissions

3. DNS Issues
   - Verify DNS records
   - Check DNS propagation
   - Test domain resolution

### 7.2 Useful Commands

```bash
# Check nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Check Docker containers
sudo docker ps

# Check container logs
sudo docker logs -f container_name
```

### 7.3 Network and DNS Debugging Commands

```bash
# Check listening ports
sudo ss -tulpn | grep LISTEN

# Check running processes
ps aux | grep nginx

# Monitor HTTP traffic on port 80
sudo tcpdump -i any port 80 -A

# Test domain resolution
dig everycountryisunique.com
dig www.everycountryisunique.com
dig api.everycountryisunique.com

# Test IPv4 vs IPv6 access
curl -4 -v http://everycountryisunique.com
curl -6 -v http://everycountryisunique.com

# Test direct server access
curl -v --resolve everycountryisunique.com:80:127.0.0.1 http://everycountryisunique.com

# Check nginx access and error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check firewall rules
sudo ufw status
sudo iptables -L -n -v

# Check IPv6 routing
ip -6 route show

# Check IPv6 interface configuration
ip addr show | grep -A 2 "inet6"
```

### 7.4 Docker Debugging Commands

```bash
# Check container network settings
sudo docker network ls
sudo docker network inspect every-country-is-unique_default

# Check container environment variables
sudo docker exec container_name env

# Check container network connectivity
sudo docker exec container_name ping host.docker.internal
sudo docker exec container_name curl -v http://host.docker.internal:3000

# Check container DNS resolution
sudo docker exec container_name nslookup api.everycountryisunique.com
```

### 7.5 SSL/TLS Debugging Commands

```bash
# Test SSL connection
openssl s_client -connect everycountryisunique.com:443 -servername everycountryisunique.com

# Check SSL certificate details
openssl x509 -in /etc/letsencrypt/live/everycountryisunique.com/fullchain.pem -text -noout

# Test SSL configuration
curl -vI https://everycountryisunique.com
curl -vI https://api.everycountryisunique.com

# Check SSL certificate permissions
ls -la /etc/letsencrypt/live/everycountryisunique.com/
```

### 7.6 Application Debugging Commands

```bash
# Check frontend environment variables
sudo docker exec web-every-country-is-unique env | grep NEXT_PUBLIC

# Check backend environment variables
sudo docker exec api-every-country-is-unique env

# Test API endpoints directly
curl -v https://api.everycountryisunique.com/countries
curl -v http://localhost:3001/countries

# Check application logs with timestamps
sudo docker logs -f --timestamps web-every-country-is-unique
sudo docker logs -f --timestamps api-every-country-is-unique
``` 