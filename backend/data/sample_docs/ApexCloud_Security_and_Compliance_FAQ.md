# ApexCloud Technologies - Security, Privacy & Compliance FAQ

## 1. Compliance Certifications
- **SOC 2 Type II**: ApexCloud is audited annually by independent AICPA-accredited auditors. Our SOC 2 Type II report covering Security, Confidentiality, and Availability is available to customers under NDA upon request.
- **ISO 27001:2022**: Certified across all engineering, infrastructure, and operational locations.
- **GDPR & CCPA**: Fully compliant. We offer standard Data Processing Addendums (DPA) with standard contractual clauses (SCCs) for cross-border data transfers.
- **HIPAA**: HIPAA compliance and Business Associate Agreements (BAAs) are available exclusively for Business and Enterprise tier subscribers.

## 2. Data Encryption Standards
- **Encryption in Transit**: All communications with ApexCloud services are enforced over TLS 1.3 with forward secrecy. Deprecated protocols (TLS 1.0, 1.1) are rejected.
- **Encryption at Rest**: Customer databases, file uploads, and vector search embeddings are encrypted using AES-256 bit encryption keys managed through AWS KMS with automatic annual key rotation.
- **Customer Managed Keys (BYOK)**: Available on the Enterprise tier, enabling customers to manage encryption keys in their own AWS KMS or HashiCorp Vault.

## 3. Data Residency & Regions
Customers can designate where their primary data and backups reside:
- US-East (Northern Virginia)
- US-West (Oregon)
- EU-Central (Frankfurt, Germany - GDPR localized)
- APAC (Singapore)

Data never leaves the chosen jurisdiction without explicit administrative authorization.

## 4. Authentication and Access Controls
- Multi-Factor Authentication (MFA): Supports TOTP (Google Authenticator, Authy) and FIDO2 / WebAuthn hardware security keys (YubiKey). Enforceable across organization-wide policies.
- Single Sign-On (SSO): Native SAML 2.0 and OIDC integrations supporting Okta, Microsoft Azure Active Directory, Google Workspace, Ping Identity, and OneLogin.
- Role-Based Access Control (RBAC): Four default roles (Owner, Admin, Member, Guest) plus custom role creation on Business and Enterprise tiers.

## 5. Vulnerability Management & Bug Bounty
ApexCloud conducts continuous automated static and dynamic code scanning (SAST/DAST) and contracts with CREST-certified penetration testers biannually. We run an active private bug bounty program on HackerOne.
