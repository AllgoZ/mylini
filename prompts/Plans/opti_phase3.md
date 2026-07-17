# MYLINI Production Hardening — Phase 3 (Security, Reliability & Production Readiness)

You are continuing development of the MYLINI ecommerce platform.

Phase 1 (Performance) is COMPLETE.

Phase 2 (Premium UX) is COMPLETE.

Do NOT modify completed work unless absolutely necessary.

Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- Zustand
- Tailwind
- Cloudinary
- Vercel

====================================================

MISSION

This phase prepares the application for REAL production.

The goal is NOT new features.

The goal is to make the application secure, reliable, resilient, and production-ready.

Everything should continue working exactly as before.

No UI redesign.

No UX redesign.

No database redesign unless required for security.

====================================================

BEFORE WRITING CODE

Review the current implementation.

Understand

- authentication

- middleware

- API routes

- Supabase permissions

- cookies

- environment variables

- repositories

- services

- admin routes

Do NOT assume anything.

====================================================

TASK 1

Production Authentication

Audit

customer authentication

admin authentication

session validation

cookies

logout

session expiry

Requirements

✓ secure cookies

✓ session expiration

✓ session rotation where appropriate

✓ replay protection where practical

✓ proper logout

✓ no session leaks

====================================================

TASK 2

OTP Authentication

Implement proper OTP verification.

Requirements

Users must NOT authenticate using only a phone number.

Implement

OTP send

OTP verify

OTP expiry

OTP retry limits

OTP resend cooldown

single-use OTP

secure storage

Do NOT hardcode OTPs.

Use environment variables where required.

Design the implementation so a real SMS provider (e.g., Twilio, MSG91) can be plugged in cleanly.

If external SMS integration is intentionally deferred, structure the code so the provider can be added with minimal changes, and clearly separate the provider interface from the authentication logic.

====================================================

TASK 3

Row Level Security

Implement proper RLS.

Review every table.

Create least-privilege policies.

Users must ONLY access

their own

orders

wishlist

addresses

cart

profile

Nobody else.

Admin must continue functioning.

====================================================

TASK 4

Remove Unsafe Permissions

Audit

anon

authenticated

service role

Remove unnecessary grants.

Least privilege everywhere.

====================================================

TASK 5

Rate Limiting

Protect

login

OTP

checkout

coupon

wishlist

cart mutations

admin login

admin APIs

Prevent brute force.

Prevent abuse.

====================================================

TASK 6

Validation Audit

Review every API.

Ensure

Zod validation

type safety

sanitization

safe parsing

Reject malformed requests.

====================================================

TASK 7

XSS Protection

Audit

dangerouslySetInnerHTML

user input

admin input

rich text

Sanitize where necessary.

Prevent stored XSS.

Prevent reflected XSS.

====================================================

TASK 8

CSRF Review

Review

cookies

forms

mutations

API routes

Determine whether CSRF protection is required based on the authentication model.

If existing SameSite and architecture already provide sufficient protection for a route, document why rather than adding unnecessary tokens.

Implement additional CSRF protection only where justified.

====================================================

TASK 9

Security Headers

Audit

CSP

HSTS

X-Frame-Options

Permissions-Policy

Referrer-Policy

X-Content-Type-Options

Implement production-safe defaults.

Avoid breaking Cloudinary or Next.js.

====================================================

TASK 10

Error Handling

Standardize

API errors

Repository errors

Service errors

Database errors

Client errors

Avoid leaking stack traces.

Provide consistent error responses.

====================================================

TASK 11

Logging

Improve logging.

Log

authentication failures

admin access

checkout failures

payment failures

unexpected exceptions

Never log

passwords

tokens

OTP values

service keys

PII

====================================================

TASK 12

Environment Variables

Audit

NEXT_PUBLIC

private variables

Supabase keys

Cloudinary keys

Admin secrets

Ensure

no secrets leak

correct usage

safe defaults

====================================================

TASK 13

Production Middleware

Review middleware.

Protect

admin

API

authentication

routing

Only use middleware where it genuinely improves security or performance.

====================================================

TASK 14

Database Reliability

Review

transactions

RPCs

rollback

error handling

timeouts

locking

Ensure failures leave the database consistent.

====================================================

TASK 15

Security Audit

Attempt to identify

broken authentication

broken authorization

IDOR

privilege escalation

session fixation

replay

token misuse

SQL injection

XSS

race conditions

unsafe redirects

insecure direct object references

Fix verified issues.

====================================================

DO NOT

❌ redesign frontend

❌ redesign UI

❌ redesign database schema unnecessarily

❌ change completed UX improvements

❌ rewrite repositories without evidence

❌ over-engineer

====================================================

AFTER IMPLEMENTATION

Provide

# Files Changed

...

# Security Improvements

...

# Authentication Improvements

...

# RLS Policies Added

...

# Permissions Removed

...

# Rate Limiting

...

# Headers Added

...

# Validation Improvements

...

# Logging Improvements

...

# Risks

...

# Manual Testing Checklist

Customer login

OTP

Logout

Session expiry

Admin login

Admin CRUD

Orders

Cart

Wishlist

Addresses

Checkout

Coupons

Permission boundaries

Direct API access

Supabase REST API

====================================================

IMPORTANT

Every security change must be justified.

Do NOT implement security theater.

If an issue is already adequately mitigated by the existing architecture, explain why and leave it unchanged.

Compile after every major change.

Run TypeScript.

Run production build.

Verify all existing functionality continues working.

Everything must be production-ready.