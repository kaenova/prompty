# Docker & GitHub Actions Setup Guide

## Overview

This guide explains how to build and deploy the Prompty application using Docker and GitHub Actions.

## Prerequisites

1. Docker Hub account (https://hub.docker.com/)
2. GitHub repository with Actions enabled
3. Docker credentials configured

## Setting Up GitHub Secrets

### 1. Docker Hub Credentials

To enable the GitHub Action to push images to Docker Hub, you need to add your credentials to GitHub Secrets:

#### Steps:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

#### Add two secrets:

**Secret 1: DOCKER_USERNAME**
- **Name:** `DOCKER_USERNAME`
- **Value:** Your Docker Hub username (e.g., `kaenova`)

**Secret 2: DOCKER_PASSWORD**
- **Name:** `DOCKER_PASSWORD`
- **Value:** Your Docker Hub access token (NOT your password)
  - Create a token at: https://hub.docker.com/settings/security
  - Click "New Access Token"
  - Give it a descriptive name (e.g., "GitHub Actions")
  - Select "Read, Write & Delete" permissions
  - Copy the token and paste it in GitHub Secrets

## How It Works

### GitHub Action: `build-docker.yml`

This workflow automatically builds and pushes your Docker image whenever:

- Changes are pushed to the `main` branch
- Files in specific paths are modified (app, components, lib, types, public, Dockerfile, etc.)
- Manually triggered via GitHub Actions UI

### Image Tags

The Docker image is tagged with:
- `latest` - Latest build from main branch
- `main-{commit-sha}` - Commit-specific tag
- `main` - Main branch tag
- Other semantic version tags if available

### Docker Image Location

Once published, your image will be available at:
```
docker.io/kaenova/prompty:latest
```

## Local Development

### Building the Docker Image Locally

```bash
docker build -t kaenova/prompty:local .
```

### Running the Container Locally

```bash
docker run -d \
  -p 3000:3000 \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=dev-secret-key \
  -e COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/ \
  -e COSMOS_DB_KEY=your-key \
  -e COSMOS_DB_DATABASE_ID=prompty-db \
  kaenova/prompty:local
```

Access the application at `http://localhost:3000`

## Production Deployment

### Docker Compose Example

```yaml
version: '3.8'

services:
  prompty:
    image: kaenova/prompty:latest
    ports:
      - "3000:3000"
    environment:
      NEXTAUTH_URL: https://yourdomain.com
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      COSMOS_DB_ENDPOINT: ${COSMOS_DB_ENDPOINT}
      COSMOS_DB_KEY: ${COSMOS_DB_KEY}
      COSMOS_DB_DATABASE_ID: prompty-db
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prompty
  labels:
    app: prompty
spec:
  replicas: 2
  selector:
    matchLabels:
      app: prompty
  template:
    metadata:
      labels:
        app: prompty
    spec:
      containers:
      - name: prompty
        image: kaenova/prompty:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: NEXTAUTH_URL
          valueFrom:
            configMapKeyRef:
              name: prompty-config
              key: nextauth-url
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: prompty-secrets
              key: nextauth-secret
        - name: COSMOS_DB_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: prompty-secrets
              key: cosmos-endpoint
        - name: COSMOS_DB_KEY
          valueFrom:
            secretKeyRef:
              name: prompty-secrets
              key: cosmos-key
        - name: COSMOS_DB_DATABASE_ID
          valueFrom:
            configMapKeyRef:
              name: prompty-config
              key: cosmos-db-id
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: prompty-service
spec:
  type: LoadBalancer
  selector:
    app: prompty
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

## Troubleshooting

### Issue: "unauthorized: authentication required"

**Solution:**
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are correctly set
- Ensure the token hasn't expired
- Generate a new access token if needed

### Issue: "no space left on device"

**Solution:**
- This usually occurs in GitHub Actions runners
- The workflow includes cache optimization, but you can manually clear cache if needed
- Check Docker Hub for image sizes

### Issue: Container won't start

**Solution:**
- Check logs: `docker logs <container-id>`
- Verify all required environment variables are set
- Ensure the Cosmos DB connection string is correct

## File Structure

```
.
├── Dockerfile                    # Multi-stage Docker build configuration
├── .dockerignore                 # Files to exclude from Docker build
├── .env.example                  # Example environment variables
├── .github/workflows/
│   ├── build-docker.yml         # Docker Hub push workflow
│   └── publish-python-sdk.yml   # Python SDK publication workflow
├── app/                          # Next.js App Router
├── components/                   # React components
├── lib/                          # Utility functions
└── types/                        # TypeScript types
```

## Next Steps

1. ✅ Add GitHub Secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`)
2. ✅ Push a commit to trigger the workflow
3. ✅ Monitor the workflow in **Actions** tab
4. ✅ Access the image at `docker.io/kaenova/prompty:latest`
5. ✅ Deploy to your infrastructure

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Docker Guide](https://nextjs.org/docs/app/building-your-application/deploying/docker)
- [Docker Hub](https://hub.docker.com/)

