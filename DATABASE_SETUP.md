# 🗄️ TabOrder Database Setup Guide

## Overview
TabOrder now supports PostgreSQL database for production-ready vendor management with ACID compliance and concurrent access safety.

## 🚀 Quick Start

### 1. Environment Setup
Set the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgresql://username:password@host:port/database_name"
```

### 2. Database Initialization
Run the setup script to initialize tables:
```bash
python setup_database.py
```

### 3. Test the Setup
The setup script will:
- ✅ Test database connection
- 🗄️ Create vendor tables
- 🧪 Create a test vendor
- 📋 List all vendors

## 🔧 Configuration Options

### Database Mode
- **Enabled**: When `DATABASE_URL` is set and `psycopg2` is available
- **Fallback**: File-based storage when database is not available

### Vendor Table Schema
```sql
CREATE TABLE vendors (
    vendor_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone VARCHAR(50),
    business_name VARCHAR(255),
    address TEXT,
    business_type VARCHAR(100),
    tax_number VARCHAR(100),
    location VARCHAR(255) DEFAULT 'Johannesburg, South Africa',
    status VARCHAR(50) DEFAULT 'pending_approval',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛡️ Production Features

### Concurrent Access Safety
- **ACID Transactions**: All vendor operations are wrapped in transactions
- **Conflict Resolution**: `ON CONFLICT (email) DO NOTHING` prevents duplicate emails
- **Connection Pooling**: Automatic connection management with cleanup

### Security Features
- **Parameterized Queries**: SQL injection protection
- **Connection Isolation**: Each request gets a fresh connection
- **Error Handling**: Graceful fallback to file storage

## 🔄 Migration from File Storage

The system automatically handles migration:
1. **Database First**: If database is available, it's used
2. **File Fallback**: If database fails, falls back to file storage
3. **Seamless**: No data loss during transition

## 🧪 Testing

### Manual Testing
```bash
# Test database connection
python -c "from standalone_app_enhanced import test_database_connection; test_database_connection()"

# Create test vendor
python -c "from standalone_app_enhanced import save_single_vendor; save_single_vendor({'vendor_id': 'TEST', 'email': 'test@example.com', ...})"

# List vendors
python -c "from standalone_app_enhanced import load_vendors; print(load_vendors())"
```

### API Testing
```bash
# Test vendor registration
curl -X POST http://localhost:5000/api/vendor/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", ...}'

# Test vendor login
curl -X POST http://localhost:5000/api/vendor/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Verify database server is running
   - Check network connectivity

2. **Table Creation Failed**
   - Ensure database user has CREATE privileges
   - Check for existing table conflicts

3. **Vendor Registration Fails**
   - Check for duplicate email addresses
   - Verify all required fields are provided

### Debug Mode
Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📊 Performance Considerations

- **Indexes**: Email field is automatically indexed (UNIQUE constraint)
- **Connection Pooling**: Consider using connection pooling for high traffic
- **Caching**: Implement Redis caching for frequently accessed vendor data

## 🔮 Future Enhancements

- [ ] Password hashing with bcrypt
- [ ] JWT token authentication
- [ ] Rate limiting on registration
- [ ] Email verification workflow
- [ ] Vendor approval workflow 