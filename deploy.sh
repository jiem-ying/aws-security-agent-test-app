#!/bin/bash

# Deployment script for Sample Pen-Test Application
# This script builds, pushes, and deploys the application to AWS ECS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
PROJECT_NAME="aws-security-agent-test-app"

echo -e "${GREEN}=== Sample Pen-Test Application Deployment ===${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Get AWS Account ID
echo -e "${YELLOW}Getting AWS Account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# ECR Repository URL
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}"

# Login to ECR
echo -e "${YELLOW}Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t ${PROJECT_NAME}:latest .

# Tag the image
echo -e "${YELLOW}Tagging Docker image...${NC}"
docker tag ${PROJECT_NAME}:latest ${ECR_REPOSITORY}:latest

# Push to ECR
echo -e "${YELLOW}Pushing image to ECR...${NC}"
docker push ${ECR_REPOSITORY}:latest

# Update ECS service to use the new image
echo -e "${YELLOW}Updating ECS service...${NC}"
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-service \
    --force-new-deployment \
    --region ${AWS_REGION} > /dev/null

echo -e "${GREEN}Deployment initiated successfully!${NC}"
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for the new task to start and become healthy.${NC}"
echo ""
echo -e "You can monitor the deployment with:"
echo -e "  aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-service --region ${AWS_REGION}"
echo ""
echo -e "Get the ALB URL with:"
echo -e "  cd terraform && terraform output alb_url"
