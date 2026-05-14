# Notification System Design

## Overview
Describe the notification system scope, channels, and primary use cases.

## Requirements
- Functional requirements
- Non-functional requirements

## Architecture
- High-level components
- Data flow
- Failure handling

## API Contracts
- Request/response schemas
- Error codes

## Scaling Strategy
- Throughput targets
- Horizontal/vertical scaling
- Backpressure

## Observability
- Logging
- Metrics
- Alerts

# Stage 1

## Context
We are building a campus notification platform where students receive:
- Placement notifications
- Result notifications
- Event notifications

## REST API Design

### Common Conventions
- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <token>`
- Content-Type: `application/json`
- Idempotency (optional): `Idempotency-Key` for mutation calls

### 1) Get Notifications
**Endpoint**: `GET /api/v1/notifications`

**Headers**
- `Authorization: Bearer <token>`
- `Accept: application/json`

**Query Parameters**
- `page` (number, default 1)
- `pageSize` (number, default 20, max 100)

**Response (200)**
```json
{
	"data": [
		{
			"id": "ntf_01HX9FQW83Z2VK2QK1F9QX5D7J",
			"type": "placement",
			"title": "Placement Drive: Affordmed",
			"message": "Online test at 10:00 AM on 18 May.",
			"priority": "high",
			"isRead": false,
			"createdAt": "2026-05-14T09:30:00.000Z"
		}
	],
	"meta": {
		"page": 1,
		"pageSize": 20,
		"total": 200,
		"totalPages": 10
	}
}
```

**Status Codes**
- 200 OK
- 401 Unauthorized
- 403 Forbidden
- 429 Too Many Requests
- 500 Internal Server Error

### 2) Filter Notifications
**Endpoint**: `GET /api/v1/notifications/search`

**Headers**
- `Authorization: Bearer <token>`
- `Accept: application/json`

**Query Parameters**
- `type` (string: `placement` | `result` | `event`)
- `isRead` (boolean)
- `priority` (string: `low` | `medium` | `high`)
- `from` (ISO8601 date-time)
- `to` (ISO8601 date-time)
- `page` (number, default 1)
- `pageSize` (number, default 20, max 100)

**Response (200)**
```json
{
	"data": [],
	"meta": {
		"page": 1,
		"pageSize": 20,
		"total": 0,
		"totalPages": 0
	}
}
```

**Status Codes**
- 200 OK
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 429 Too Many Requests
- 500 Internal Server Error

### 3) Mark Notification as Read
**Endpoint**: `PATCH /api/v1/notifications/{notificationId}/read`

**Headers**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body**
```json
{
	"isRead": true
}
```

**Response (200)**
```json
{
	"data": {
		"id": "ntf_01HX9FQW83Z2VK2QK1F9QX5D7J",
		"isRead": true,
		"readAt": "2026-05-14T10:05:00.000Z"
	}
}
```

**Status Codes**
- 200 OK
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 429 Too Many Requests
- 500 Internal Server Error

### 4) Bulk Mark as Read (Pagination Support Use Case)
**Endpoint**: `PATCH /api/v1/notifications/read`

**Headers**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body**
```json
{
	"notificationIds": [
		"ntf_01HX9FQW83Z2VK2QK1F9QX5D7J",
		"ntf_01HX9FQW83Z2VK2QK1F9QX5D7K"
	]
}
```

**Response (200)**
```json
{
	"data": {
		"updated": 2
	}
}
```

**Status Codes**
- 200 OK
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 429 Too Many Requests
- 500 Internal Server Error

## JSON Schemas

### Notification
```json
{
	"$id": "https://affordmed.com/schemas/notification.json",
	"type": "object",
	"required": ["id", "type", "title", "message", "priority", "isRead", "createdAt"],
	"properties": {
		"id": {"type": "string", "pattern": "^ntf_[A-Za-z0-9]+$"},
		"type": {"type": "string", "enum": ["placement", "result", "event"]},
		"title": {"type": "string", "minLength": 3, "maxLength": 120},
		"message": {"type": "string", "minLength": 1, "maxLength": 2000},
		"priority": {"type": "string", "enum": ["low", "medium", "high"]},
		"isRead": {"type": "boolean"},
		"createdAt": {"type": "string", "format": "date-time"},
		"readAt": {"type": ["string", "null"], "format": "date-time"}
	}
}
```

### Paginated Notification List
```json
{
	"$id": "https://affordmed.com/schemas/notification-list.json",
	"type": "object",
	"required": ["data", "meta"],
	"properties": {
		"data": {
			"type": "array",
			"items": {"$ref": "notification.json"}
		},
		"meta": {
			"type": "object",
			"required": ["page", "pageSize", "total", "totalPages"],
			"properties": {
				"page": {"type": "integer", "minimum": 1},
				"pageSize": {"type": "integer", "minimum": 1, "maximum": 100},
				"total": {"type": "integer", "minimum": 0},
				"totalPages": {"type": "integer", "minimum": 0}
			}
		}
	}
}
```

### Mark as Read Request
```json
{
	"$id": "https://affordmed.com/schemas/notification-read.json",
	"type": "object",
	"required": ["isRead"],
	"properties": {
		"isRead": {"type": "boolean", "const": true}
	}
}
```

## Real-time Notification Architecture
Real-time updates ensure students receive time-sensitive alerts without polling.

**Recommended Transport**: WebSocket

**Why WebSocket (over Socket.IO)**
- Standards-based protocol with lower overhead and no extra framing.
- Works well with a simple publish/subscribe model and CDN or load balancer support.
- Fits the lightweight requirements of a campus notification feed.

**When to Prefer Socket.IO**
- You need built-in fallbacks for legacy environments.
- You want automatic reconnection with backoff and event acknowledgements.
- You require rooms and namespaces out of the box.

## Notification Delivery Flow
1. Admin or system posts a notification to the backend.
2. Backend validates payload, stores it, and publishes an event to a message broker.
3. WebSocket gateway consumes the event and pushes it to connected student clients.
4. Client receives and renders the notification, then acknowledges receipt.
5. Backend updates delivery status and metrics for observability.

## Logging Middleware Usage
- API layer logs request lifecycle events (request received, validation errors, response sent).
- Notification creation logs include type, priority, and target audience size.
- WebSocket gateway logs connection lifecycle events (connect, disconnect, auth failure).
- Client app logs page view, fetch success/failure, and read acknowledgements.
- Errors are routed through the shared logging middleware with consistent stack/level/package values.

# Stage 2

## Database Recommendation
**Preferred database**: PostgreSQL.

### SQL vs NoSQL (Brief)
- **SQL (PostgreSQL)**: Strong consistency, relational modeling, rich indexing, and mature query planner for complex filters and pagination.
- **NoSQL (Document/Key-Value)**: Flexible schema and horizontal scale, but weaker ad-hoc query capabilities and complex pagination without pre-aggregation.

### Final Selection Justification
Notifications require precise filtering (type, read state, priority, time range), reliable pagination, and consistent reads. PostgreSQL provides predictable query performance, strong transactional guarantees for read/ack updates, and first-class support for composite indexes and partitioning.

## Notification Table Schema
Primary table focuses on student-facing delivery records.

```sql
CREATE TABLE notifications (
	id BIGSERIAL PRIMARY KEY,
	notification_id VARCHAR(32) NOT NULL UNIQUE,
	student_id BIGINT NOT NULL,
	type VARCHAR(20) NOT NULL,
	title VARCHAR(120) NOT NULL,
	message TEXT NOT NULL,
	priority VARCHAR(10) NOT NULL,
	is_read BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	read_at TIMESTAMPTZ NULL
);
```

### Indexing Strategy
- Primary access pattern: per-student unread list ordered by time.
- Secondary access pattern: per-type/time range analytics.

```sql
CREATE INDEX idx_notifications_student_read_created
	ON notifications (student_id, is_read, created_at ASC);

CREATE INDEX idx_notifications_type_created
	ON notifications (type, created_at DESC);

CREATE INDEX idx_notifications_priority
	ON notifications (priority);
```

## Scalability Concerns as Data Grows
- **Index bloat**: Multiple indexes increase write costs and storage.
- **Hot partitions**: Recent data is queried heavily, causing I/O hotspots.
- **Large pagination offsets**: Deep pages degrade due to skip scanning.
- **Vacuum pressure**: Frequent updates for read state create dead tuples.

## Partitioning and Caching Strategy
- **Partition by time** (monthly or weekly) on `created_at` to prune scans and speed retention operations.
- **Optional sub-partition by hash on `student_id`** for load distribution in high-volume campuses.
- **Cache recent unread counts** per student in Redis with short TTL (e.g., 60s) to reduce read amplification.
- **Use cursor pagination** (`created_at`, `notification_id`) to avoid deep offsets.

# Stage 3

## Query Analysis
**Given query**
```sql
SELECT * FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt ASC;
```

### 1) Why the Query Becomes Slow
- The table grows and the query must scan many rows to find the matching student and read state.
- Sorting by `createdAt` without a supporting index requires extra work and memory.

### 2) Why Full Table Scans Occur
- Missing or poorly ordered indexes on `student_id`, `is_read`, and `created_at` force the planner to scan the entire table.
- Column naming mismatch (`studentID`, `isRead`, `createdAt`) prevents index use if the actual schema uses snake_case.

### 3) Best Optimization Strategy
- Align schema and query naming conventions.
- Add a composite index that matches the filter and sort order.
- Use cursor pagination to avoid deep offsets.

### 4) Proper Composite Index Solution
```sql
CREATE INDEX idx_notifications_student_read_created
	ON notifications (student_id, is_read, created_at ASC);
```
This supports the filter on `student_id` and `is_read` and provides the ordering by `created_at` without a sort.

### 5) Why Indexing Every Column Is Bad
- Each index adds write overhead and storage.
- Poorly chosen indexes reduce cache efficiency and slow down inserts and updates.

### 6) Indexing Tradeoffs (Estimated)
- **Read latency**: 3x to 20x improvement for targeted queries.
- **Write latency**: 10% to 50% slower on inserts and updates depending on index count.
- **Storage**: Indexes may consume 50% to 150% of table size in aggregate.

### 7) Optimized Query for Placement Notifications in Last 7 Days
```sql
SELECT DISTINCT student_id
FROM notifications
WHERE type = 'placement'
	AND created_at >= NOW() - INTERVAL '7 days';
```
