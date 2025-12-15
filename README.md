<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1heUuh0gOEpjmSCY_PMWOcIjV0Ke281ed

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env.local` and set your `VITE_API_KEY` (Gemini API key)
   - Copy `backend/.env.example` to `backend/.env` and configure all required variables

3. Run the backend:
   ```bash
   cd backend
   npm run dev
   ```

4. Run the frontend (in a separate terminal):
   ```bash
   npm run dev
   ```

## Run with Docker

1. Configure environment variables:
   - Copy `.env.docker.example` to `.env` in the project root
   - Set secure values for `MONGO_ROOT_PASSWORD` and `JWT_SECRET`
   - **NEVER use default passwords in production!**

2. Start all services:
   ```bash
   docker-compose up -d
   ```

## Security Notes

⚠️ **IMPORTANT**: This repository does NOT contain any hardcoded secrets or credentials. You must:

1. **Never commit** `.env`, `.env.local`, or any files containing actual secrets
2. **Always use strong, unique passwords** - never use defaults like "password123"
3. **Generate secure JWT secrets** using: `openssl rand -base64 32`
4. **Keep your Gemini API key secure** and never share it publicly
5. **Review** `.gitignore` to ensure environment files are excluded

For production deployments:
- Use strong, randomly generated passwords for all services
- Store secrets in secure secret management systems (e.g., AWS Secrets Manager, Azure Key Vault)
- Enable HTTPS/TLS for all connections
- Regularly rotate secrets and credentials

