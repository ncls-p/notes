# Sharing and Collaboration API Documentation

This document outlines the API endpoints for the sharing and collaboration features of the Noteworthy application.

## Authorization

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: ****** Invitations API

### Create Invitation

Creates a new invitation for a user to access a note or folder.

- **URL**: `/api/invitations`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions Required**: Must be the owner of the entity being shared

**Request Body:**

```json
{
  "entity_id": "uuid-of-note-or-folder",
  "entity_type": "note|folder",
  "invitee_email": "user@example.com",
  "access_level": "view|edit"
}
```

**Response:**

```json
{
  "id": "invitation-uuid",
  "entity_id": "uuid-of-note-or-folder",
  "entity_type": "note|folder",
  "invitee_email": "user@example.com",
  "access_level": "view|edit",
  "status": "pending",
  "expires_at": "2023-12-31T23:59:59Z",
  "created_at": "2023-12-01T12:00:00Z"
}
```

### List Pending Invitations

Lists all pending invitations for the authenticated user.

- **URL**: `/api/invitations/pending`
- **Method**: `GET`
- **Auth Required**: Yes

**Response:**

```json
[
  {
    "id": "invitation-uuid",
    "entity_id": "uuid-of-note-or-folder",
    "entity_type": "note|folder",
    "access_level": "view|edit",
    "expires_at": "2023-12-31T23:59:59Z",
    "created_at": "2023-12-01T12:00:00Z",
    "inviter": {
      "id": "user-uuid",
      "email": "owner@example.com"
    }
  }
]
```

### Accept Invitation

Accepts a pending invitation and creates the required permission entry.

- **URL**: `/api/invitations/{invitationId}/accept`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions Required**: Must be the invitee

**Response:**

```json
{
  "message": "Invitation accepted successfully",
  "invitation": {
    "id": "invitation-uuid",
    "status": "accepted"
  },
  "permission": {
    "id": "permission-uuid",
    "entity_type": "note|folder",
    "entity_id": "uuid-of-note-or-folder",
    "access_level": "view|edit"
  }
}
```

### Decline Invitation

Declines a pending invitation.

- **URL**: `/api/invitations/{invitationId}/decline`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions Required**: Must be the invitee

**Response:**

```json
{
  "message": "Invitation declined successfully",
  "invitation": {
    "id": "invitation-uuid",
    "status": "declined"
  }
}
```

## Permissions API

### List Collaborators

Lists all users who have access to a note or folder.

- **URL**: `/api/permissions?entityType=note|folder&entityId=entity-uuid`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions Required**: Must have access to the entity

**Response:**

```json
[
  {
    "user": {
      "id": "user-uuid",
      "email": "owner@example.com"
    },
    "accessLevel": "owner",
    "isOwner": true
  },
  {
    "user": {
      "id": "user-uuid",
      "email": "collaborator@example.com"
    },
    "accessLevel": "view|edit",
    "isOwner": false
  }
]
```

### Grant Permission

Grants permission to a user to access a note or folder.

- **URL**: `/api/permissions`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions Required**: Must be the owner of the entity

**Request Body:**

```json
{
  "user_id": "user-uuid",
  "entity_type": "note|folder",
  "entity_id": "entity-uuid",
  "access_level": "view|edit"
}
```

**Response:**

```json
{
  "message": "Permission created successfully",
  "permission": {
    "id": "permission-uuid",
    "user_id": "user-uuid",
    "entity_type": "note|folder",
    "entity_id": "entity-uuid",
    "access_level": "view|edit",
    "createdAt": "2023-12-01T12:00:00Z"
  }
}
```

### Update Permission

Updates the access level for a permission.

- **URL**: `/api/permissions/{permissionId}`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions Required**: Must be the owner of the entity

**Request Body:**

```json
{
  "access_level": "view|edit"
}
```

**Response:**

```json
{
  "message": "Permission updated successfully",
  "permission": {
    "id": "permission-uuid",
    "user_id": "user-uuid",
    "entity_type": "note|folder",
    "entity_id": "entity-uuid",
    "access_level": "view|edit",
    "createdAt": "2023-12-01T12:00:00Z"
  }
}
```

### Revoke Permission

Revokes a user's access to a note or folder.

- **URL**: `/api/permissions/{permissionId}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions Required**: Must be the owner of the entity

**Response:**

```json
{
  "message": "Permission revoked successfully"
}
```

## Error Responses

All API endpoints return appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid input or parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate invitation)
- `500 Internal Server Error`: Server-side error

Example error response:

```json
{
  "error": "Resource not found"
}
```