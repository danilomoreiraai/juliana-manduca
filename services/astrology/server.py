"""Serial internal HTTP service for short natal calculations; never a public API."""
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import socket

from helena_engine import calculate_natal

MAX_BODY = 16384


def reject_constant(_value):
    raise ValueError('Non-finite JSON value')


def create_server(token, address=('0.0.0.0', 8000)):
    if not isinstance(token, str) or len(token) < 32:
        raise ValueError('HELENA_ENGINE_TOKEN must have at least 32 characters')
    expected = ('Bearer ' + token).encode('utf-8')

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, _format, *_args):
            pass  # Do not retain URLs, headers, or natal data in HTTP logs.

        def setup(self):
            super().setup()
            self.connection.settimeout(5)

        def respond(self, status, value):
            body = json.dumps(value, allow_nan=False, separators=(',', ':')).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_GET(self):
            if self.path == '/health/live':
                self.respond(200, {'status': 'ok'})
            else:
                self.respond(404, {'message': 'Rota não encontrada'})

        def do_POST(self):
            authorization = self.headers.get('Authorization', '').encode('utf-8')
            if not hmac.compare_digest(authorization, expected):
                # Drain a bounded, already-sent body before closing. Otherwise Windows may
                # reset the socket and hide the 401 response from a legitimate caller.
                try:
                    length = int(self.headers.get('Content-Length', '0'))
                    if 0 < length <= MAX_BODY:
                        self.rfile.read(length)
                except (ValueError, OSError):
                    pass
                self.respond(401, {'message': 'Não autorizado'})
                return
            if self.path != '/natal':
                self.respond(404, {'message': 'Rota não encontrada'})
                return
            if self.headers.get_content_type() != 'application/json':
                self.respond(415, {'message': 'Use JSON'})
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
            except ValueError:
                self.respond(400, {'message': 'Corpo inválido'})
                return
            if length > MAX_BODY:
                self.respond(413, {'message': 'Corpo excede o limite'})
                return
            if length <= 0:
                self.respond(400, {'message': 'Corpo inválido'})
                return
            try:
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise ValueError('Incomplete body')
                value = json.loads(raw.decode('utf-8'), parse_constant=reject_constant)
            except socket.timeout:
                self.respond(408, {'message': 'Tempo de leitura excedido'})
                return
            except (ValueError, UnicodeError):
                self.respond(400, {'message': 'JSON inválido'})
                return
            try:
                result = calculate_natal(value)
            except ValueError:
                self.respond(422, {'message': 'Parâmetros não calculáveis'})
                return
            except Exception:
                self.respond(500, {'message': 'Falha no cálculo'})
                return
            self.respond(200, result)

    return HTTPServer(address, Handler)


if __name__ == '__main__':
    server = create_server(os.environ.get('HELENA_ENGINE_TOKEN'), (
        os.environ.get('HELENA_HOST', '0.0.0.0'), int(os.environ.get('HELENA_PORT', '8000')),
    ))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
