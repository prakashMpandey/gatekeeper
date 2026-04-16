# Gatekeeper: Centralized Authentication & RBAC System

Gatekeeper is a secure, scalable, and decentralized microservices architecture designed to implement Centralized Authentication & Role-Based Access Control (RBAC). It separates identity and access concerns into a dedicated Auth Service while allowing independent microservices (Resource Services) to securely validate authorization using public-key cryptography.

## 🏗 High-Level Architecture

![architecture diagram](images/architecture.png)

### Overview of Services
1. **API Gateway (`apigateway`)**: Routes traffic, proxies requests, and enforces rate limiting.

2. **Auth Service (`auth`)**: Handles identity, password hashing, JWT generation, user roles, permission management, and audit log processing.

3. **Resource Service (`orders`)**: Represents a protected business domain. It validates JWTs using an asymmetric public key and checks user permissions locally.

4. **Redis Cache / Message Broker (`redis`)**: Stores refresh tokens securely using TTLs and acts as a broker for BullMQ to handle async audit logging.

### 💻 Tech Stack
- **Backend Framework:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose)
- **Caching & Message Broker:** Redis
- **Message Queue:** BullMQ (for asynchronous audit logging)
- **Authentication:** JSON Web Tokens (JWT) with asymmetric RS256 keys
- **Security:** Bcrypt.js (password hashing)
- **Infrastructure & Orchestration:** Docker, Docker Compose

---

## 🔐 Auth & RBAC Flow

1. **Authentication:** 
   - A user submits credentials (email/password) to `/auth/login`.
   - The Auth Service verifies the password using `bcrypt` against the database.

   - It issues an **Access Token** (signed using an `RS256` Private Key, short-lived) and a **Refresh Token** (stored in Redis for tracking/blacklisting).

   - The payload of the access token encapsulates the user's basic identity and assigned role.

2. **Role Management (Admin Operation):** 
   - An administrator assigns fine-grained permissions to a specific role. 

   - This triggers an atomic synchronization directly to the shared Redis cache (DB1) using `DEL` + `SADD` commands.

3. **Authorization Middleware (Resource Services):**
   - Intercepts incoming HTTP requests.

   - Verifies the integrity of the JWT signature utilizing the shared `RS256` Public Key locally.

   - Queries the shared Redis instance (`SISMEMBER`) to assert the presence of the required permission string.

   - Dispatches an access log action to the Audit Logs via BullMQ (a Redis-backed queue).

4. **Audit Logging:**
   - To avoid blocking the main execution thread, the Resource Service (e.g., Orders) tracks access asynchronously. The middleware pushes log events into a persistent queue.

   - A background worker on the Auth Service continuously consumes these events and commits them reliably to the primary database.

---

## 🏗️ Key Architectural Decisions

### 🚀 Performance vs. Coupling (The Redis Trade-off)
* **Decision:** We utilized a shared Redis instance for instantaneous role checking and token blacklisting.

* **Trade-off:** This implementation introduces Infrastructure Coupling. If the centralized Redis instance experiences latency or an outage, distributed authorization processes may fail.

* **Justification:** For the current infrastructure scale, the $O(1)$ lookup complexity and sub-millisecond response time vastly outweigh the configuration footprint of a full-fledged message broker topology.

* **Future Scaling:** This architecture serves as a stepping stone toward a fully Event-Driven model. In high-scale architectures, the Auth Service would emit policy alterations as events to a resilient message broker (e.g., Apache Kafka), allowing each downstream service to independently maintain a localized cache replica.

### 🛠️ Stateless Revocation (The Blacklist Pattern)
Standard JWTs cannot be forcefully invalidated prior to their expiration. We circumvented this by implementing a robust Blacklist Pattern within Redis. Upon logout, the token's unique identifier (`jti`) is persisted in Redis with a Time-to-Live (TTL) equivalent to its remaining validity period, guaranteeing that explicitly revoked tokens are universally rejected fleet-wide.

### 🔑 Cryptographic Secret Management 
* **Current Setup:** JWT signing secrets and RSA key pairs are securely injected via environment configurations (`.env`).
* **Future Scope:** We plan to transition to a dedicated Secret Management Service (e.g., AWS Secrets Manager, HashiCorp Vault) and expose a standardized `.well-known/jwks.json` endpoint to enable dynamic, zero-downtime key rotation.

## 🚀 Setup Instructions

### Dependencies
Ensure you have the following installed on your host machine:
* Docker & Docker Compose
* Node.js (>= 18) (if running locally without Docker)

### Environment Setup

The system relies on environment variables for configuration. The root directory contains a `.env.prod` file used by Docker Compose. If running locally without Docker, you will need to adjust the connection URLs.

**Key Environment Variables (from `.env.prod`):**
```env
# Gateway & Services
API_GATEWAY_PORT=4000
AUTH_SERVICE_URL="http://auth-service:3000" # Change to http://localhost:3000 for non-Docker
ORDER_SERVICE_URL="http://order-service:3010" # Change to http://localhost:3010 for non-Docker

# Databases (Change 'mongo' and 'redis' hostnames to 'localhost' for non-Docker)
MONGODB_URI="mongodb://<username>:<password>@mongo:27017"
ORDER_MONGODB_URI="mongodb://<username>:<password>@mongo:27017"
AUTH_DB="authentication db name"
ORDER_DB="orders database name"
LOGS_DB=1
SHARED_DB=1
REDIS_AUTH_DB=0

REDIS_URL="redis://redis:6379"
REDIS_HOST="redis"
REDIS_PORT=6379

# Tokens & Cryptography
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

### Running the System

#### 🐳 Option 1: Docker (Recommended)
The full infrastructure can be spun up instantly using Docker Compose, which automatically builds the microservices and provisions Mongo and Redis containers using variables from `.env.prod`.

```bash
# Build and orchestrate all services + databases
docker-compose up --build
```

#### 💻 Option 2: Non-Docker (Local Development)
To run the services directly on your host machine:

1. **Start Local Databases:** Ensure you have instances of **MongoDB** (with configured auth if needed, port 27017) and **Redis** (port 6379) running on your local machine.

2. **Configure Environment:** Create a `.env` file in the root or export variables globally. Ensure you change all hostnames from Docker service names (`mongo`, `redis`, `auth-service`, `order-service`) to `localhost` or `127.0.0.1`.
3. **Install Dependencies & Start Services:** Open three separate terminal tabs, one for each service:

```bash
# Terminal 1: Auth Service
cd auth
npm install
npm start # or node app.js

# Terminal 2: Orders Service
cd orders
npm install
npm start # or node app.js

# Terminal 3: API Gateway
cd apigateway
npm install
npm start # or node index.js
```

### Accessing the Services
Regardless of the method used, the services will bind to the following ports:
* API Gateway: `http://localhost:4000` (All external traffic should route here)
* Auth Service: `http://localhost:3000` (Internal)
* Orders Service: `http://localhost:3010` (Internal)

## 🛡️ Security Decisions & Trade-offs

* **Public Key Validation (Option A - Asymmetric JWTs):** We used `RS256` where the Auth service has the Private Key and Resource Services have the Public Key. This guarantees the Auth DB doesn't get flooded during token verification and totally decouples the architecture.

* **HTTP-Only Cookies:** Tokens are sent securely avoiding XSS vulnerabilities on the client side.

* **API Gateway Rate Limiting:** Enforced at the gateway edge to prevent Brute-force and DDoS attacks against Auth and Resource endpoints.

* **Stateful Refresh Tokens via Redis:** Refresh tokens belong to Redis under a TTL and are tied to a User ID. This allows token revocation—a user's session can be forcibly killed by deleting the Redis key before their next refresh cycle without introspecting DBs.

* **Background Audit Logging:** Tracking usage is necessary for enterprise RBAC. By using BullMQ and Redis, logging happens non-blockingly, guaranteeing low latency for the HTTP response.

## 📝 API Endpoints Summary

All traffic is routed through the API Gateway at `http://localhost:4000`.

### Auth Service (`/auth`)

**User Authentication & Management**
* `POST /auth/register` - Create a new user account
* `POST /auth/login` - Authenticate user & receive HTTP-only cookies
* `POST /auth/logout` - Clear user active tokens
* `POST /auth/refresh` - Refresh access tokens using Redis
* `GET /auth/me` - Get current authenticated user profile
* `POST /auth/status` - Toggle user active status
* `GET /auth/logs` - Retrieve global API audit logs

**Roles & Permissions Management**
* `POST /auth/roles/` - Create a new role
* `GET /auth/roles/` - List all roles
* `GET /auth/roles/:roleId` - Get a single role
* `POST /auth/roles/assign/:userId` - Assign a role to a user
* `POST /auth/roles/remove/:userId` - Remove a role from a user
* `POST /auth/roles/:roleId/permissions` - Add permissions to a given role

**Permissions Base**
* `GET /auth/permissions/` - List all available permissions
* `POST /auth/permissions/` - Add a new permission definition

### Resource Service (`/orders`)
* `GET /orders` - Fetch orders (Requires `orders:read` permission)
* `POST /orders` - Create an order (Requires `orders:write` and `orders:delete`)
* `DELETE /orders/:orderId` - Delete a specific order (Requires `orders:delete`)


## 📈 Future Scalability Roadmap
- Message Broker: Integrate RabbitMQ to decouple Auth Service from Resource Services.

- API Gateway: Move the Blacklist and Permission check to a central Gateway level (Kong/Tyk) to keep internal services 100% logic-free.

- Sidecar Cache: Deploy Redis sidecars for local sub-millisecond lookups in high-traffic environments.