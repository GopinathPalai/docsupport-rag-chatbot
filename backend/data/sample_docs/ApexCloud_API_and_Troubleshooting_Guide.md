# ApexCloud Technologies - Developer API & Troubleshooting Guide

## 1. Authentication
All API requests must include your Bearer API key in the HTTP Authorization header:
```http
Authorization: Bearer apex_live_your_api_key_here
```
API keys can be generated and revoked in the Organization Settings > Developer Portal.

## 2. API Rate Limiting & Throttling
ApexCloud enforces rate limits per tenant based on subscription tier:
- Starter: No API access
- Professional (Pro): 1,000 requests per minute
- Business: 5,000 requests per minute
- Enterprise: 25,000 requests per minute (custom bursts available)

If rate limits are exceeded, the API responds with HTTP 429 Too Many Requests and includes the following headers:
- `X-RateLimit-Limit`: Maximum requests per minute.
- `X-RateLimit-Remaining`: Remaining request quota.
- `Retry-After`: Number of seconds to wait before retrying.

## 3. Webhooks & Event Subscriptions
Webhooks deliver real-time notifications for events such as `document.created`, `workflow.failed`, and `user.invited`.
- Webhooks must respond with HTTP 200 within 5 seconds.
- In case of failure (5xx status or timeout), ApexCloud initiates exponential backoff retries:
  - Attempt 1: Immediate retry (after 10s)
  - Attempt 2: After 1 minute
  - Attempt 3: After 5 minutes
  - Attempt 4: After 30 minutes
  - Attempt 5: After 2 hours (final attempt before dead-letter queue notification)

## 4. Common Error Codes & Resolution

### Error 401: Unauthorized (ERR_INVALID_TOKEN)
- Cause: Missing or malformed Authorization header, or expired API key.
- Resolution: Verify key prefix starts with `apex_live_` or `apex_test_`. Regenerate the key in Developer Portal.

### Error 403: Forbidden (ERR_QUOTA_EXCEEDED)
- Cause: Account storage threshold reached or action requires elevated role privileges.
- Resolution: Upgrade subscription tier or clear archived assets.

### Error 409: Conflict (ERR_RESOURCE_LOCKED)
- Cause: Another concurrent process is updating the document or pipeline configuration.
- Resolution: Implement optimistic locking with `If-Match` ETag headers.

### Error 504: Gateway Timeout (ERR_UPSTREAM_TIMEOUT)
- Cause: Complex multi-step workflow taking longer than 60 seconds.
- Resolution: Switch to asynchronous execution using the `/v1/jobs/async` endpoint.
