# Serves the static export (`out/`) with an unprivileged nginx image.
# The private infrastructure repository owns the domain, TLS, and reverse-proxy
# route; this image only serves the pinned build's static files.
FROM nginxinc/nginx-unprivileged:1.30.5-alpine@sha256:4714e0b1b2577eaa1a6131d07c958b67f0eb68e6d0521e90c6e5287db8cf0bc5

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY out/ /usr/share/nginx/html/

USER 101
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
