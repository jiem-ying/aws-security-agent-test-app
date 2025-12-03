# CLAUDE.md - Project Context and Guidelines

## Project Overview

**Project Name**: AWS Security Agent Test Application
**Repository**: aws-security-agent-test-app
**Purpose**: A deliberately vulnerable web application designed specifically for testing AWS Security Agent's penetration testing capabilities
**Region**: ap-southeast-2 (Sydney, Australia)
**Status**: Active Development

## ⚠️ Security Notice

**THIS IS A DELIBERATELY VULNERABLE APPLICATION**

This application contains intentional security flaws and must NEVER be deployed in production environments. It is designed exclusively for:
- AWS Security Agent testing
- Security assessment demonstrations
- Penetration testing training
- Vulnerability detection validation

## Project Architecture

### Application Stack
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: SQLite (in-memory)
- **Template Engine**: EJS
- **Container**: Docker (Alpine-based)

### AWS Infrastructure
- **Compute**: ECS Fargate (ap-southeast-2)
- **Load Balancer**: Application Load Balancer (ALB)
- **Container Registry**: Amazon ECR
- **Networking**: Custom VPC with 2 public subnets across AZs
- **Logging**: CloudWatch Logs
- **IAC**: Terraform >= 1.0

### Deployment Configuration
- **AWS Region**: ap-southeast-2 (Sydney)
- **AWS Profile**: default (local AWS CLI configuration)
- **Container Resources**: 256 CPU, 512 MB memory
- **Desired Task Count**: 1
- **Port**: 3000 (container) → 80 (ALB)

## Intentional Vulnerabilities

This application demonstrates the following security issues:

1. **SQL Injection** (`/login` POST endpoint)
   - Direct string concatenation in SQL queries
   - No parameterized queries or input validation

2. **Cross-Site Scripting (XSS)** (`/search` GET endpoint)
   - Unsanitized user input directly rendered in HTML
   - No output encoding or CSP headers

3. **Command Injection** (`/ping` GET endpoint)
   - User input passed directly to shell execution
   - No input validation or sanitization

4. **Insecure Direct Object Reference (IDOR)** (`/user/:id` GET endpoint)
   - Missing authorization checks
   - Direct access to user records without permission validation

5. **Information Disclosure** (`/debug` GET endpoint)
   - Exposes environment variables and system information
   - Should never be accessible in production

6. **Missing Authentication** (`/dashboard` GET endpoint)
   - Relies only on client-side cookies
   - No server-side session management

7. **CORS Misconfiguration** (`/api/products` endpoint)
   - Allows all origins with credentials
   - Potential for cross-origin attacks

8. **Insecure Cookie Handling**
   - Stores sensitive data in unencrypted cookies
   - Missing HttpOnly, Secure, and SameSite flags

9. **Weak Credentials**
   - Hardcoded default credentials
   - No password hashing
   - Plain text password storage

10. **Missing Security Headers**
    - No Content-Security-Policy
    - No X-Frame-Options
    - No X-Content-Type-Options

## File Structure

```
aws-security-agent-test-app/
├── CLAUDE.md                 # This file - project context and guidelines
├── README.md                 # User-facing documentation
├── .gitignore               # Git ignore rules
├── package.json             # Node.js dependencies
├── server.js                # Main application (intentionally vulnerable)
├── Dockerfile               # Container build instructions
├── .dockerignore            # Docker build exclusions
├── deploy.sh                # Automated deployment script
├── views/
│   └── index.ejs           # Main web interface
├── public/                  # Static assets (if any)
└── terraform/
    ├── main.tf             # AWS infrastructure definition
    ├── variables.tf        # Terraform variables (region, project name)
    └── outputs.tf          # Infrastructure outputs (ALB URL, ECR, etc.)
```

## Development Workflow

### Initial Setup
1. Configure AWS CLI with default profile
2. Ensure Docker is running
3. Install Terraform >= 1.0
4. Clone/initialize repository

### Deployment Process
1. **Infrastructure**: Deploy AWS resources via Terraform
2. **Application**: Build and push Docker image to ECR
3. **Service**: Update ECS service with new image

### Making Changes

When modifying this application:

1. **Code Changes**:
   - Update `server.js` for application logic
   - Update `views/index.ejs` for UI changes
   - Add new vulnerabilities if testing new attack vectors

2. **Infrastructure Changes**:
   - Modify `terraform/main.tf` for AWS resource changes
   - Update `terraform/variables.tf` for configuration
   - Run `terraform plan` before applying

3. **Documentation**:
   - **ALWAYS** update CLAUDE.md when changing architecture
   - Update README.md for user-facing changes
   - Document new vulnerabilities or test scenarios

4. **Version Control**:
   - Commit changes with descriptive messages
   - Push to GitHub repository
   - Tag releases for significant changes

## Deployment Instructions

### First-Time Deployment

```bash
# 1. Initialize Terraform
cd terraform
terraform init

# 2. Review planned changes
terraform plan

# 3. Deploy infrastructure
terraform apply -auto-approve

# 4. Build and deploy application
cd ..
chmod +x deploy.sh
./deploy.sh

# 5. Get ALB URL
cd terraform
terraform output alb_url
```

### Subsequent Deployments

```bash
# After code changes, just run:
./deploy.sh
```

### Checking Deployment Status

```bash
# View ECS service status
aws ecs describe-services \
  --cluster aws-security-agent-test-app-cluster \
  --services aws-security-agent-test-app-service \
  --region ap-southeast-2

# View application logs
aws logs tail /ecs/aws-security-agent-test-app --follow --region ap-southeast-2
```

## Testing with AWS Security Agent

### Setup
1. Navigate to AWS Security Agent in AWS Console (ap-southeast-2)
2. Create new penetration test project
3. Configure target: Use ALB URL from `terraform output alb_url`

### Expected Findings
AWS Security Agent should detect:
- SQL injection vulnerabilities
- XSS attack vectors
- Command injection risks
- Authentication bypass methods
- Information disclosure issues
- CORS misconfigurations

### Post-Test Analysis
1. Review Security Agent findings
2. Compare detected vs. intentional vulnerabilities
3. Document any missed vulnerabilities
4. Generate code fix recommendations

## Integration with GitHub

### Repository Information
- **Owner**: jiem-ying
- **Repository**: aws-security-agent-test-app
- **Branch**: main
- **Visibility**: Should be private (contains vulnerable code)

### GitHub Integration
The application is linked to GitHub for:
- Version control
- AWS Security Agent code review
- Automated security fix recommendations
- Collaboration and tracking

## Cost Management

### Expected Monthly Costs (Light Usage)
- ECS Fargate: ~$30/month (0.25 vCPU, 0.5 GB, continuous)
- ALB: ~$16-20/month (base + data transfer)
- ECR: ~$1/month (image storage)
- CloudWatch Logs: <$1/month
- Data Transfer: ~$1-5/month

**Total**: ~$48-57/month

### Cost Optimization
- Scale down to 0 tasks when not in use
- Delete ECR images after testing
- Use `terraform destroy` when not actively testing
- Monitor with AWS Cost Explorer

## Important Commands

### AWS
```bash
# Check AWS credentials
aws sts get-caller-identity

# View running tasks
aws ecs list-tasks --cluster aws-security-agent-test-app-cluster --region ap-southeast-2

# Stop all tasks (to save costs)
aws ecs update-service \
  --cluster aws-security-agent-test-app-cluster \
  --service aws-security-agent-test-app-service \
  --desired-count 0 \
  --region ap-southeast-2

# Start tasks again
aws ecs update-service \
  --cluster aws-security-agent-test-app-cluster \
  --service aws-security-agent-test-app-service \
  --desired-count 1 \
  --region ap-southeast-2
```

### Docker
```bash
# Build locally
docker build -t aws-security-agent-test-app:latest .

# Run locally for testing
docker run -p 3000:3000 aws-security-agent-test-app:latest

# Access local version
open http://localhost:3000
```

### Terraform
```bash
# View current state
terraform show

# View outputs
terraform output

# Destroy all resources
terraform destroy
```

## Troubleshooting

### Common Issues

**Issue**: Terraform fails with "VPC limit exceeded"
- **Solution**: Delete unused VPCs or request limit increase

**Issue**: ECS task fails to start
- **Solution**: Check CloudWatch logs for errors, verify security group rules

**Issue**: ALB health checks failing
- **Solution**: Ensure security group allows ALB → ECS on port 3000

**Issue**: Cannot push to ECR
- **Solution**: Run `aws ecr get-login-password` and ensure proper IAM permissions

**Issue**: Application not accessible via ALB
- **Solution**: Wait 2-3 minutes for DNS propagation and health checks

## Security Remediation Guide

For production applications, fix these vulnerabilities:

1. **SQL Injection**: Use parameterized queries or ORM
2. **XSS**: Implement output encoding and CSP headers
3. **Command Injection**: Avoid shell execution, use libraries
4. **IDOR**: Implement proper authorization middleware
5. **Information Disclosure**: Remove debug endpoints, sanitize errors
6. **Authentication**: Use proper session management (JWT, sessions)
7. **CORS**: Configure specific origins, not wildcards
8. **Cookies**: Set HttpOnly, Secure, SameSite flags
9. **Passwords**: Use bcrypt/argon2 for hashing
10. **Headers**: Add security headers (CSP, HSTS, etc.)

## Future Enhancements

Potential additions:
- [ ] More vulnerability types (XXE, SSRF, etc.)
- [ ] Custom domain with Route 53 and ACM certificate
- [ ] HTTPS support with ALB HTTPS listener
- [ ] WAF integration for comparison (vulnerable vs. protected)
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Automated testing scripts
- [ ] Performance benchmarking
- [ ] Multiple environment support (dev, test, prod)

## Maintenance

### Regular Updates
- Keep Node.js dependencies current (but maintain vulnerabilities)
- Update Terraform provider versions
- Review and update AWS best practices
- Sync with latest AWS Security Agent features

### Documentation
- Update this file when architecture changes
- Document new vulnerabilities added
- Record AWS Security Agent findings
- Maintain changelog of significant changes

## Contact and Support

**Project Owner**: jiem-ying
**Purpose**: AWS Security Agent Testing
**Support**: GitHub Issues in aws-security-agent-test-app repository

## Version History

- **v1.0.0** (2025-12-03): Initial release
  - Basic vulnerable web application
  - Complete ECS Fargate infrastructure
  - Terraform automation
  - Deployed to ap-southeast-2 (Sydney)

---

**Last Updated**: 2025-12-03
**Claude Code Version**: Used for initial project setup
