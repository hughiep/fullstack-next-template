declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL: string
    NEXT_PUBLIC_API_BASE_URL: string

    // Database
    DATABASE_URL: string

    // Authentication
    JWT_SECRET: string
    JWT_ACCESS_TOKEN_EXPIRY: string
    JWT_REFRESH_TOKEN_EXPIRY: string

    // Email (for verification, password reset, etc.)
    SMTP_HOST: string
    SMTP_PORT: string
    SMTP_USER: string
    SMTP_PASSWORD: string
    EMAIL_FROM: string
  }
}
