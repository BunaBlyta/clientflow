/**
 * User-entered text is stored as PostgreSQL text, but API limits keep request
 * sizes predictable for the database, realtime payloads, and translation
 * provider. These are character limits, not byte limits.
 */
export const MAX_USER_CONTENT_LENGTH = 10_000;

export const MAX_NOTE_BODY_LENGTH = MAX_USER_CONTENT_LENGTH;
export const MAX_TRANSLATION_TEXT_LENGTH = MAX_USER_CONTENT_LENGTH;
