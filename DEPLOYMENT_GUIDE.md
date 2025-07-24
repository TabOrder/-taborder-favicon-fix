# 🚀 TabOrder Deployment Guide

## Render Deployment Configuration

### Build Command
```bash
cd frontend && npm install && npm run build
```

### Start Command
```bash
python standalone_app_enhanced.py
```

### Environment Variables
- `PYTHON_VERSION`: 3.9.0
- `NODE_VERSION`: 20.11.0
- `DATABASE_URL`: (Optional) PostgreSQL connection string
- `SECRET_KEY`: (Auto-generated)

## Manual Build Process

If the automatic build fails, you can manually build:

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the React app**:
   ```bash
   npm run build
   ```

4. **Verify build output**:
   ```bash
   ls -la build/
   ```

## Troubleshooting

### Permission Issues
If you encounter permission issues with `react-scripts`:
```bash
chmod +x node_modules/.bin/react-scripts
```

### Node Version Issues
Ensure Node.js version 18+ is used:
```bash
node --version
```

### Build Failures
Check the build logs for specific error messages and ensure all dependencies are properly installed.

## Database Setup

To enable PostgreSQL database:
1. Set `DATABASE_URL` environment variable
2. The system will automatically initialize tables
3. Falls back to file storage if no database is configured 