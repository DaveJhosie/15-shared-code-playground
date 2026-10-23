# Shared Code Playground Database

## Overview

This folder contains the SQL scripts for the Shared Code Playground
PostgreSQL database.

The database stores users, projects, project memberships, code files,
and saved file versions.

## Requirements

- PostgreSQL 14 or newer
- PostgreSQL client (`psql`)
- A local database named `playground`
- A PostgreSQL user named `playground_user`

## Database Configuration

Development database connection string:

postgresql://playground_user:playground_pass@localhost:5432/playground?schema=public

These credentials are for local development only.

## Database Tables

### 1. users

Stores registered users, email addresses, password hashes, and creation dates.

### 2. projects

Stores project names, descriptions, owners, and timestamps.

### 3. project_members

Connects users to projects and assigns owner, editor, or viewer roles.

### 4. files

Stores code files, programming languages, file contents, and Yjs state.

### 5. file_versions

Stores named versions of files, their contents, creators, and creation dates.

## Table Relationships

- A user can own multiple projects.
- A project can have multiple members.
- A user can belong to multiple projects.
- A project can contain multiple files.
- A file can have multiple saved versions.
- Each saved version records the user who created it.

## SQL Files

- `001_init.sql`: Creates the database tables, indexes, and triggers.
- `002_seed.sql`: Inserts demo users and sample project data.
- `003_reset.sql`: Deletes the project tables and update function.

WARNING: Running `003_reset.sql` deletes the tables and their data.

## Setup

Create the database user and database as a PostgreSQL administrator:

    CREATE USER playground_user WITH PASSWORD 'playground_pass';
    CREATE DATABASE playground OWNER playground_user;

Connect to the database and enable pgcrypto:

    \c playground
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

Run these commands from the repository root:

    psql -U playground_user -h localhost -d playground -f db/001_init.sql
    psql -U playground_user -h localhost -d playground -f db/002_seed.sql

## Demo Accounts

All demo accounts use the development password `Password123!`.

| Name | Email | Role |
|---|---|---|
| Alice | alice@example.com | Owner |
| Bob | bob@example.com | Editor |
| Carol | carol@example.com | Viewer |

## Verification

Connect to the database:

    psql -U playground_user -h localhost -d playground

List the tables:

    \dt

Check the record counts:

    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM projects) AS projects,
      (SELECT COUNT(*) FROM project_members) AS members,
      (SELECT COUNT(*) FROM files) AS files,
      (SELECT COUNT(*) FROM file_versions) AS versions;

Expected counts after seeding:

- Users: 3
- Projects: 1
- Project members: 3
- Files: 2
- File versions: 1