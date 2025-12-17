# Local setup

This is a quick guide showing how to set up the application on a developer's machine.

## Requirements

Basic requirements are:

- [Node.js](https://nodejs.org/en) >= version 22
- [pnpm](https://pnpm.io/) >= version 8

### Databases

The application expects to work against a Postgres database and a Redis instance.
The Postgres instance needs to have the `vector` extension installed.
It's up to developers to choose how to set this up to suit their preferences, however here's an example of how to use Docker for that:

#### Running Postgres and Redis in a docker compose stack

Create a `docker-compose.yml` in the repository root:

```yml
services:
  postgres:
    build:
      context: .
      dockerfile_inline: |
        FROM postgres:17

        RUN apt-get update && apt-get install -y \
            build-essential \
            git \
            postgresql-server-dev-all \
            && rm -rf /var/lib/apt/lists/*

        WORKDIR /tmp
        RUN git clone https://github.com/pgvector/pgvector.git

        WORKDIR /tmp/pgvector
        RUN make
        RUN make install

        ENV PAGER=""

        WORKDIR /root
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - 17607:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: complere

  redis:
    ports:
      - 17608:6379
    image: redis:8-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

This setup can be started using

```console
$ docker compose up -d
```

To delete existing data and start from scratch do:

```console
$ docker compose down --volumes
```

When running, Postgres is available on `localhost:17607`, Redis at `localhost:17608`.

### Preparing the setup

Before the application can run, install all node modules:

```console
$ pnpm install
```

and create an `.env` file in the repo root from this template:

```ini
RESEND_API_KEY="<GET THIS FROM KEVIN>"

# local
POSTGRES_PRISMA_URL="postgresql://postgres:password@localhost:17607/complere"
POSTGRES_URL_NON_POOLING="postgresql://postgres:password@localhost:17607/complere"
NEXT_PUBLIC_DEPLOYMENT_URL="http://localhost:4040"

BILLIAM_AUTH_SECRET="<PROVIDE A BASE64 ENCODED SECRET OF 32 BYTES>"
OPENAI_API_KEY="<GET THIS FROM KEVIN>"

ANTHROPIC_API_KEY="<GET THIS FROM KEVIN>"

DEV_ADMIN_EMAIL="<PUT YOUR EMAIL HERE>"

CRON_SECRET="<PROVIDE A BASE64 ENCODED SECRET OF 32 BYTES>"

GOOGLE_GENERATIVE_AI_API_KEY="<GET THIS FROM KEVIN>"

BLOB_READ_WRITE_TOKEN="<GET THIS FROM KEVIN>"


NEXT_PUBLIC_SUPABASE_URL="https://njjzjrcjvbtrowkmnewc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=""<GET THIS FROM KEVIN>""
SUPABASE_SERVICE_ROLE_KEY=""<GET THIS FROM KEVIN>""

NODE_ENV="development"

TRIGGER_SECRET_KEY=""<GET THIS FROM KEVIN>""

GOOGLE_API_KEY=""<GET THIS FROM KEVIN>""

LUMA_API_KEY=""<GET THIS FROM KEVIN>""

NEXT_PUBLIC_POSTHOG_KEY="<GET THIS FROM KEVIN>"
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com


STRIPE_SECRET_KEY="<GET THIS FROM KEVIN>"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="<GET THIS FROM KEVIN>"


SENTRY_SUPPRESS_TURBOPACK_WARNING=1

REDIS_URL="redis://localhost:17608"

```

Assuming the database is running, scaffold the database schema:

```console
$ pnpm migrate
```

### Running the application

You can now run the application on `http://localhost:4040` using:

```console
$ pnpm dev
```
