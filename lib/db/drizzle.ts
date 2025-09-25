/**
 * Database Connection
 * Drizzle ORM setup with PostgreSQL connection
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from './schema'

// Create the database connection
const client = postgres(env.DATABASE_URL)

// Create the Drizzle instance
export const db = drizzle(client, { schema })

// Export the client for direct queries if needed
export { client }
