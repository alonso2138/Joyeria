# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by emailing the repository owner or creating a private security advisory on GitHub.

**Please do not** create public issues for security vulnerabilities.

## Security Best Practices

### Environment Variables and Secrets

This project requires several environment variables for configuration. **Never commit actual secrets to version control.**

#### Required Environment Variables:

**Frontend (`.env.local`):**
- `VITE_API_KEY` - Your Gemini API key

**Backend (`backend/.env`):**
- `MONGO_URI` - MongoDB connection string with credentials
- `JWT_SECRET` - Secret key for JWT token signing (generate with `openssl rand -base64 32`)
- `ADMIN_PASSWORD` - Initial admin password for database seeding
- `RESEND_API_KEY` - API key for Resend email service (optional)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)
- `TELEGRAM_CHAT_ID` - Telegram chat ID (optional)

**Docker Compose (`.env`):**
- `MONGO_ROOT_PASSWORD` - MongoDB root password
- `JWT_SECRET` - JWT secret key

### Password Requirements

- Use strong passwords (minimum 12 characters, mix of uppercase, lowercase, numbers, and special characters)
- Never use default passwords like "password123"
- Never reuse passwords across different services
- Change default credentials immediately after initial setup

### API Keys and Tokens

- Keep all API keys and tokens secure
- Never commit API keys to version control
- Rotate keys regularly
- Use environment-specific keys (development vs. production)
- Revoke compromised keys immediately

### Database Security

- Use strong MongoDB credentials
- Enable authentication on all database connections
- Restrict database access to necessary hosts only
- Regularly backup your database
- Keep MongoDB updated to the latest stable version

### JWT Security

- Use strong, randomly generated JWT secrets
- Keep JWT secrets different between environments
- Consider rotating JWT secrets periodically
- Use appropriate token expiration times

### Production Deployment

For production environments:

1. **Never use development secrets** - generate new, strong secrets
2. **Use secret management systems** (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Enable HTTPS/TLS** for all connections
4. **Implement rate limiting** to prevent abuse
5. **Enable security headers** (HSTS, CSP, X-Frame-Options, etc.)
6. **Regular security audits** and dependency updates
7. **Monitor for suspicious activity**
8. **Implement proper logging** (without logging sensitive data)

### Dependency Security

- Regularly update dependencies: `npm audit fix`
- Review security advisories for dependencies
- Use lock files (`package-lock.json`) to ensure consistent installations
- Consider using tools like Snyk or Dependabot for automated vulnerability scanning

## Secure Development Practices

- Review code for security issues before committing
- Use parameterized queries to prevent SQL/NoSQL injection
- Sanitize user input
- Implement proper authentication and authorization
- Use HTTPS for all external communications
- Follow the principle of least privilege
- Keep error messages generic (don't leak system information)

## Security Checklist for Deployment

- [ ] All environment variables configured with strong, unique values
- [ ] Default passwords changed
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Database authentication enabled
- [ ] Firewall rules configured
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] Security audit completed
- [ ] Dependencies up to date
- [ ] `.gitignore` properly configured

## Known Security Considerations

### Authentication

The application uses JWT-based authentication. Ensure:
- JWT secrets are strong and unique
- Tokens have appropriate expiration times
- Tokens are transmitted securely (HTTPS only)
- Refresh token mechanism is implemented for production

### File Uploads

The application may handle file uploads. Ensure:
- File type validation is implemented
- File size limits are enforced
- Uploaded files are scanned for malware
- Uploaded files are stored securely

## Contact

For security concerns or questions, please contact the repository maintainers.
