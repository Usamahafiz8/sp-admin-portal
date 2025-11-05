# Admin Control Panel

A Next.js application for managing the Steven & Parker backend with super admin privileges.

## Features

- **Super Admin Authentication**: Secure login system restricted to super admin users only
- **Image Management**: Full CRUD operations for image management
- **Public Image Management**: View and manage publicly accessible images
- **Modern UI**: Clean, responsive interface with dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

### Super Admin Login

Only users with `super_admin` role can access this application.

**Default Credentials:**
- Email: `superadmin@stevenparker.com`
- Password: `SuperAdmin@2024!`

⚠️ **Important**: Change the default password after first login!

### How to Login

1. Click the "Super Admin Login" button on the main page
2. Enter your super admin email and password
3. Upon successful login, you'll have access to all admin features

## Project Structure

```
admin-control/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── layout.tsx    # Root layout with AuthProvider
│   │   └── page.tsx      # Main page component
│   ├── components/       # React components
│   │   ├── LoginModal.tsx
│   │   └── AuthProviderWrapper.tsx
│   └── contexts/         # React contexts
│       └── AuthContext.tsx
├── .env.local            # Environment variables
└── package.json
```

## API Integration

The application connects to the backend API at the URL specified in `NEXT_PUBLIC_API_URL`.

### Authentication Endpoint
- `POST /api/v1/auth/super-admin/login` - Super admin login

### Image Management Endpoints
- `GET /api/v1/image-management` - Get all images (Admin only)
- `POST /api/v1/image-management` - Create image (Admin only)
- `PUT /api/v1/image-management/:id` - Update image (Admin only)
- `DELETE /api/v1/image-management/:id` - Delete image (Admin only)
- `GET /api/v1/image-management/public` - Get published images (Public)

## Security

- JWT token authentication
- Token stored in localStorage
- Role-based access control (super_admin only)
- Secure password handling

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" Error

This error occurs when the API returns HTML instead of JSON. Common causes:

1. **Backend server is not running**
   - Start the backend: `cd steven-and-parker && npm run start:dev`
   - Verify it's running on `http://localhost:3000`

2. **Port conflict**
   - Backend should run on port 3000
   - Next.js will automatically use port 3001 if 3000 is taken
   - Check which port Next.js is using in the terminal output

3. **Wrong API URL**
   - Verify `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`
   - Restart the Next.js dev server after changing `.env.local`

4. **CORS issues**
   - The backend should have CORS enabled (already configured)
   - Check browser console for CORS errors

### Cannot Login

1. Verify the backend API is running on the correct port
2. Check that `NEXT_PUBLIC_API_URL` in `.env.local` matches your backend URL
3. Ensure you're using super admin credentials (not regular admin)
4. Check browser console for error messages
5. Verify the backend endpoint: `POST http://localhost:3000/api/v1/auth/super-admin/login`

### API Connection Issues

1. **Test backend connectivity:**
   ```bash
   curl http://localhost:3000/api/v1
   ```

2. **Test login endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/super-admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"superadmin@stevenparker.com","password":"SuperAdmin@2024!"}'
   ```

3. Verify CORS settings on the backend
4. Check browser Network tab for actual request/response

## License

Private - Steven & Parker
