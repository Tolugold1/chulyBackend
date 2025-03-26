# Chuly Backend

## Overview
This backend application repository is for the Chuly Scheduling and Dashboard application. It provides endpoint for the following
- User authentication (client or business), 
- Brief profile creation for both client and businesses,
- Business booking item creation, getting of the items
- Dashboard matrics for businesses.
- Updating both booking item by the businesses.

# Setup
## Prerequisites
1. Nodejs
2. Mongodb either local or Atlas

## Clone and Install
1. Clone - [https://github.com/Tolugold1/chulyBackend.git](#)
2. cd chulyBackend
3. create .env file
   - MONGODB_URL=mongodb string
   - CURRENT_URL=http://localhost:8000
   - FRONTEND_URL=http://localhost:5173 (or 3000)
   - SECRET_KEY=jwt-secret
   - EMAIL=your email
   - PASS=email app password
   - ACCESS_TOKEN_LIFETIME=token time to live
4. npm install
5. npm start

# API Endpoints
## Authentication
  - Post /api/auth/signup - register a user
  - Post /api/auth/login - log into the app either client side or business side
  - Post /api/auth/forgot-password - forgot password
  - Post /api/auth/change-password - change a user password
  - Get /api/auth/verify-uniquestring/:token - verify email link for email verification
  - Get /api/auth/validate-token/:token - verify email link while changing password
  - Post /api/auth/logout - logs user out of the application

## Client Endpoints
  - Post /api/client/create-profile - Create client profile
  - Get /api/client/get-profile - gets client profile
  - Put /api/client/update-profile - updates client profile

## Business Endpoints
  - Post /api/business/create-profile - Create business profile
  - Get /api/business/get-profile - gets business profile
  - Put /api/business/update-profile - updates business profile

## Booking Endpoints
  - Post /api/booking/create-booking-item - Create booking item by businesses
  - Put /api/booking/update-booking-item - updates booking items created by business
  - Put /api/booking/update-booking-by-business - Businesses only update the status of their items booked for by the client

## Analytics
  - Get /api/businessAnalytics/get-analytics/:businessId/:timeframe - gets business analytics.

## Deployed link
App is deployed to vercel - https://chuly-backend.vercel.app/api
***
Developed by Tolulope Adeleke
