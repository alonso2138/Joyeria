# Quick Start Security Setup Guide

## 🔒 Required Actions Before Running This Project

This project requires proper configuration of environment variables. **No default passwords or secrets are provided for security reasons.**

### For Local Development

#### 1. Frontend Setup

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Gemini API key
# VITE_API_KEY=your_actual_gemini_api_key_here
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

#### 2. Backend Setup

```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit backend/.env and set ALL required values:
# - MONGO_URI (with your MongoDB credentials)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - ADMIN_PASSWORD (your secure admin password)
```

#### 3. Run the Application

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start backend (in one terminal)
cd backend && npm run dev

# Start frontend (in another terminal)
npm run dev
```

### For Docker Deployment

#### 1. Configure Environment

```bash
# Copy the example file
cp .env.docker.example .env

# Edit .env and set:
# - MONGO_ROOT_USERNAME (e.g., admin)
# - MONGO_ROOT_PASSWORD (strong password)
# - JWT_SECRET (generate with: openssl rand -base64 32)
```

#### 2. Start Services

```bash
docker-compose up -d
```

## 🔐 Generating Secure Secrets

### JWT Secret
```bash
openssl rand -base64 32
```

### Strong Password (Linux/Mac)
```bash
openssl rand -base64 24
```

### Strong Password (Any platform with Node.js)
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

## ⚠️ Common Errors

### "MONGO_ROOT_PASSWORD not set"
**Solution:** Create `.env` file from `.env.docker.example` and set all required variables.

### "JWT_SECRET not defined"
**Solution:** Set `JWT_SECRET` in your backend `.env` file or Docker `.env` file.

### "ADMIN_PASSWORD environment variable is required"
**Solution:** Set `ADMIN_PASSWORD` in `backend/.env` before running the seed script.

### "Not authorized, token failed"
**Solution:** Ensure your JWT_SECRET is consistent between backend restarts. If you changed it, you'll need to log in again.

## 📋 Minimum Required Variables

### For Local Development (backend/.env)
```
MONGO_URI=mongodb://localhost:27017/joyeria_aurora
JWT_SECRET=<generated_secret>
ADMIN_PASSWORD=<your_password>
```

### For Docker (.env)
```
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<strong_password>
JWT_SECRET=<generated_secret>
```

### For Frontend (.env.local)
```
VITE_API_KEY=<your_gemini_api_key>
```

## 🎯 Next Steps

1. Follow setup instructions above
2. Run database seeding (backend): `npm run seed`
3. Start the application
4. Login with: `admin@aurora.com` and your `ADMIN_PASSWORD`

## 📚 Additional Documentation

- **SECURITY.md** - Comprehensive security guidelines
- **SECURITY_AUDIT_REPORT.md** - Details about security improvements
- **README.md** - Full project documentation

## 🆘 Need Help?

If you're having trouble with configuration:
1. Check that all `.env` files are created from their `.example` counterparts
2. Verify that no values are empty or contain placeholder text
3. Ensure MongoDB is running (for local) or Docker is installed (for Docker)
4. Review error messages carefully - they often indicate which variable is missing

---

**Remember:** Never commit your `.env` files to version control! They are already in `.gitignore`.
