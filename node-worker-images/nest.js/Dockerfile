FROM node:lts-hydrogen

WORKDIR /app

# ENV PATH=/usr/pgsql-9.2/bin:$PATH

# Install PostgreSQL and supervisord
RUN apt update
# RUN apt install -y postgresql supervisor
# RUN find / -type f -name postgres
# RUN postgres psql

RUN apt install -y postgresql postgresql-contrib supervisor
RUN echo | /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh

# Create and adjust permissions for PostgreSQL data directory
RUN mkdir -p /var/lib/postgresql/data && chown -R postgres:postgres /var/lib/postgresql

# Copy supervisord configuration file into the container
COPY supervisord.conf /etc/supervisord.conf

# Set working directory for the Nest.js application
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# RUN service postgresql start \
#     && postgres psql -c "psql -c \"CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';\"" \
#     && /usr/lib/postgresql/14/bin/postgres createdb test_db
# Build your Nest.js application (adjust if needed)
RUN npm run build


# Expose ports for the Nest.js app and PostgreSQL
EXPOSE 3000 5432

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
