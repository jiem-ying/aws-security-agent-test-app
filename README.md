# Sample Pen-Test Application

A deliberately vulnerable web application designed for testing AWS Security Agent and other security testing tools.

## ⚠️ WARNING

**This application contains intentional security vulnerabilities and should ONLY be used in isolated test environments for authorized security testing purposes.**

Do NOT deploy this application in production or expose it to the public internet without proper security controls.

## Security Vulnerabilities Included

This application demonstrates common web application vulnerabilities:

1. **SQL Injection** - Login endpoint vulnerable to SQL injection attacks
2. **Cross-Site Scripting (XSS)** - Search endpoint doesn't sanitize user input
3. **Command Injection** - Ping endpoint allows arbitrary command execution
4. **Insecure Direct Object Reference (IDOR)** - User profile endpoint lacks authorization
5. **Information Disclosure** - Debug endpoint exposes sensitive environment data
6. **Missing Authentication** - Dashboard accessible without proper authentication
7. **CORS Misconfiguration** - API endpoints allow unrestricted cross-origin access
8. **Insecure Cookie Handling** - Sensitive data stored in unencrypted cookies
9. **Weak Credentials** - Default credentials are easy to guess
10. **Missing Security Headers** - Application lacks proper security headers

## Architecture

- **Application**: Node.js/Express web application
- **Database**: SQLite (in-memory)
- **Container**: Docker
- **Hosting**: AWS ECS Fargate
- **Load Balancer**: Application Load Balancer (ALB)
- **Container Registry**: Amazon ECR
- **Infrastructure as Code**: Terraform

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Terraform** (>= 1.0) installed
4. **Docker** installed and running
5. **Git** installed

## Deployment Instructions

### Step 1: Clone or Initialize Repository

```bash
# If not already done
git init
git add .
git commit -m "Initial commit: Sample pen-test application"
```

### Step 2: Push to GitHub

```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy the infrastructure
terraform apply
```

This will create:
- VPC with public subnets across 2 availability zones
- Application Load Balancer (ALB)
- ECS Fargate cluster and service
- ECR repository for container images
- Security groups with appropriate rules
- IAM roles for ECS tasks
- CloudWatch log groups

**Note the outputs**, especially the `ecr_repository_url` and `alb_url`.

### Step 4: Build and Deploy Application

```bash
# Go back to project root
cd ..

# Make the deploy script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

The script will:
1. Build the Docker image
2. Push it to ECR
3. Update the ECS service to deploy the new image

### Step 5: Verify Deployment

```bash
# Get the ALB URL
cd terraform
terraform output alb_url

# Wait a few minutes for the service to stabilize, then test:
curl $(terraform output -raw alb_url)/health
```

You should see: `{"status":"ok","timestamp":"..."}`

## Accessing the Application

Once deployed, access the application using the ALB URL:

```bash
# Get the URL
cd terraform
terraform output alb_url
```

Visit the URL in your browser. You'll see the login page with sample credentials.

### Sample Credentials

- `admin` / `admin123`
- `user1` / `password123`
- `testuser` / `test123`

### Test Endpoints

- `/` - Home page with login
- `/search?q=<term>` - Vulnerable to XSS
- `/ping?host=<hostname>` - Vulnerable to command injection
- `/user/:id` - Vulnerable to IDOR
- `/debug` - Information disclosure
- `/api/products` - API with CORS issues
- `/health` - Health check endpoint

## Setting Up a Custom Domain (Optional)

To use a custom domain instead of the ALB DNS name:

1. **Register a domain** or use an existing one in Route 53
2. **Create an SSL certificate** in AWS Certificate Manager for HTTPS
3. **Update the Terraform configuration**:

```hcl
# Add to terraform/main.tf

# HTTPS Listener (after creating ACM certificate)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:region:account-id:certificate/certificate-id"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Route 53 Record
resource "aws_route53_record" "app" {
  zone_id = "YOUR_HOSTED_ZONE_ID"
  name    = "pentest.yourdomain.com"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

4. **Apply the changes**:

```bash
cd terraform
terraform apply
```

## Testing with AWS Security Agent

Once your application is deployed:

1. Navigate to **AWS Security Agent** in the AWS Console
2. Create a new **pen-test project**
3. Enter your **ALB URL or custom domain**
4. Configure the scan settings
5. Start the security assessment
6. Review the findings and recommendations

The Security Agent should detect multiple vulnerabilities in this application.

## Monitoring and Logs

### View Application Logs

```bash
# Using AWS CLI
aws logs tail /ecs/sample-pentest-app --follow --region us-east-1

# Or in AWS Console: CloudWatch > Log Groups > /ecs/sample-pentest-app
```

### Monitor ECS Service

```bash
aws ecs describe-services \
  --cluster sample-pentest-app-cluster \
  --services sample-pentest-app-service \
  --region us-east-1
```

## Local Development

To run the application locally:

```bash
# Install dependencies
npm install

# Start the application
npm start

# Or with auto-reload
npm run dev
```

Access at `http://localhost:3000`

## Updating the Application

After making code changes:

```bash
# Commit your changes
git add .
git commit -m "Update application"
git push

# Redeploy
./deploy.sh
```

## Cleanup

To destroy all AWS resources and avoid charges:

```bash
cd terraform
terraform destroy
```

This will remove:
- ECS service and tasks
- ALB and target groups
- ECR repository and images
- VPC and networking components
- CloudWatch logs
- IAM roles

## Cost Estimate

Running this application will incur AWS charges:

- **ECS Fargate**: ~$0.04/hour for 0.25 vCPU, 0.5 GB memory
- **ALB**: ~$0.0225/hour + $0.008 per LCU-hour
- **Data Transfer**: Varies based on usage
- **CloudWatch Logs**: Minimal for basic logging

**Estimated**: $15-30/month for light usage

**Tip**: Remember to destroy resources when not in use to minimize costs.

## Security Best Practices (For Production)

This application violates security best practices intentionally. For real applications:

1. ✅ Use parameterized queries to prevent SQL injection
2. ✅ Sanitize and escape user input to prevent XSS
3. ✅ Validate and sanitize all external input
4. ✅ Implement proper authentication and authorization
5. ✅ Use HTTPS with valid SSL certificates
6. ✅ Set secure cookie flags (HttpOnly, Secure, SameSite)
7. ✅ Implement proper CORS policies
8. ✅ Add security headers (CSP, X-Frame-Options, etc.)
9. ✅ Never expose debug/environment information
10. ✅ Use strong password policies and hashing
11. ✅ Implement rate limiting and WAF rules
12. ✅ Regular security scanning and updates

## Troubleshooting

### Container fails to start

Check ECS logs:
```bash
aws logs tail /ecs/sample-pentest-app --follow --region us-east-1
```

### ALB health checks failing

Verify the security group allows traffic from ALB to ECS on port 3000.

### Unable to push to ECR

Ensure you're logged in:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Terraform errors

Ensure you have proper IAM permissions for creating VPC, ECS, ALB, ECR, and IAM resources.

## Contributing

This is a sample application for testing purposes. Feel free to:
- Add more vulnerability examples
- Improve the infrastructure code
- Enhance documentation
- Report issues

## License

MIT License - Use at your own risk

## Disclaimer

This application is for educational and authorized security testing purposes only. The authors are not responsible for any misuse or damage caused by this application.
