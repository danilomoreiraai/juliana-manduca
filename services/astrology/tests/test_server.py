import http.client
import json
import threading
import unittest

from server import create_server
from tests.test_engine import BASE

TOKEN = 'helena-internal-synthetic-token-000000'


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = create_server(TOKEN, ('127.0.0.1', 0))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self, data=BASE, token=TOKEN, path='/natal', raw=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        body = json.dumps(data).encode() if raw is None else raw
        try:
            connection.request('POST', path, body, {
                'authorization': 'Bearer ' + token,
                'content-type': 'application/json',
            })
            response = connection.getresponse()
            return response.status, json.loads(response.read())
        finally:
            connection.close()

    def test_requires_internal_authentication(self):
        status, body = self.request(token='incorrect')
        self.assertEqual(status, 401)
        self.assertNotIn(TOKEN, json.dumps(body))

    def test_real_calculation_is_available_only_on_declared_route(self):
        self.assertEqual(self.request(path='/other')[0], 404)
        status, result = self.request()
        self.assertEqual(status, 200)
        self.assertEqual(result['julianDayUt'], 2451545.0)

    def test_invalid_and_oversized_bodies_are_rejected(self):
        self.assertEqual(self.request(raw=b'bad json')[0], 400)
        self.assertEqual(self.request(raw=b'x' * 20000)[0], 413)
        self.assertEqual(self.request(data={**BASE, 'latitude': 89})[0], 422)
        self.assertEqual(self.request(data={**BASE, 'longitude': float('nan')})[0], 400)

    def test_no_default_or_short_internal_secret(self):
        with self.assertRaises(ValueError):
            create_server('short', ('127.0.0.1', 0))


if __name__ == '__main__':
    unittest.main()
