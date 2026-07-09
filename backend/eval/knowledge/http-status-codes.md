# Common HTTP Status Codes

HTTP status codes are three-digit numbers returned by a server to describe the
result of a client's request. They are grouped into five classes based on their
first digit.

## 2xx Success

A 200 OK response means the request succeeded. A 201 Created response indicates
that a new resource was successfully created, and is commonly returned by POST
requests.

## 4xx Client errors

A 400 Bad Request means the server could not understand the request due to
invalid syntax. A 401 Unauthorized response means authentication is required and
has either failed or not been provided. A 404 Not Found means the requested
resource does not exist on the server.

## 5xx Server errors

A 500 Internal Server Error is a generic message returned when the server
encounters an unexpected condition. A 503 Service Unavailable indicates that the
server is temporarily unable to handle the request, often because of maintenance
or overload.
