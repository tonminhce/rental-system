import base64
import hashlib
import hmac
import json
import os
import time
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, Mock, patch

from fastapi import HTTPException
from pydantic import ValidationError

import minimax_app
from minimax_app import ChatRequest, SearchFilters, StreamSanitizer, app, bearer_user_id, run_tool, validate_request

SECRET = "test-secret"

def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_token(uid="user-a", exp=None, secret=SECRET, alg="HS256"):
    head = b64url(json.dumps({"alg": alg, "typ": "JWT"}).encode())
    payload = b64url(json.dumps({"id": uid, "exp": exp if exp is not None else time.time() + 3600}).encode())
    sig = b64url(hmac.new(secret.encode(), f"{head}.{payload}".encode(), hashlib.sha256).digest())
    return f"{head}.{payload}.{sig}"

def make_request(token=None, host="10.0.0.1"):
    headers = {"authorization": f"Bearer {token}"} if token else {}
    return SimpleNamespace(headers=headers, client=SimpleNamespace(host=host))

class AssistantTests(unittest.IsolatedAsyncioTestCase):
    def test_rejects_invalid_coordinate(self):
        with self.assertRaises(ValidationError):
            SearchFilters(centerLat=100)

    def test_rejects_oversized_message(self):
        with self.assertRaises(ValidationError):
            ChatRequest(question='x' * 2001, thread_id='456a661d-4227-4a78-8f9d-35a8d2cf8991')

    def test_ignores_non_search_fields(self):
        self.assertEqual(SearchFilters.model_validate({'maxPrice': 15, 'url': 'https://untrusted.test'}).model_dump(exclude_none=True), {'maxPrice': 15})

    async def test_unknown_tools_cannot_execute(self):
        result, filters = await run_tool('delete_listing', {}, {})
        self.assertEqual(result, {'error': 'Unknown tool'})
        self.assertIsNone(filters)

    async def test_search_passes_only_validated_parameters(self):
        response = Mock()
        response.json.return_value = {'data': {'data': [{'id': 1, 'name': 'Example', 'password': 'secret'}]}}
        app.state.http = AsyncMock()
        app.state.http.get.return_value = response
        result, filters = await run_tool('search_homes', {'maxPrice': 20, 'url': 'https://untrusted.test'}, {'district': 'Bình Thạnh'})
        self.assertEqual(filters, {'district': 'Bình Thạnh', 'maxPrice': 20})
        self.assertNotIn('password', result['listings'][0])
        self.assertNotIn('url', app.state.http.get.call_args.kwargs['params'])

class IdentityAndOwnershipTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        minimax_app.rate_windows.clear()
        minimax_app.sessions.clear()
        app.state.ai = Mock()
        self.body = ChatRequest(question="hello", thread_id="thread-1")
        env = patch.dict(os.environ, {"TOKEN_SECRET": SECRET})
        env.start()
        self.addCleanup(env.stop)

    def test_accepts_only_valid_tokens(self):
        self.assertEqual(bearer_user_id(make_request(make_token())), "user-a")
        self.assertIsNone(bearer_user_id(make_request(make_token() + "x")))
        self.assertIsNone(bearer_user_id(make_request(make_token(exp=time.time() - 10))))
        self.assertIsNone(bearer_user_id(make_request(make_token(secret="wrong-secret"))))
        self.assertIsNone(bearer_user_id(make_request(make_token(alg="none"))))
        self.assertIsNone(bearer_user_id(make_request()))

    def test_thread_bound_to_owner_cross_user_gets_404(self):
        minimax_app.sessions["thread-1"] = ("user-a", time.monotonic(), [])
        with self.assertRaises(HTTPException) as ctx:
            validate_request(self.body, make_request(make_token("user-b")))
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertEqual(validate_request(self.body, make_request(make_token("user-a"))), "user-a")
        self.assertIsNone(validate_request(self.body, make_request()))

    def test_rate_limit_keys_on_user_not_proxy_ip(self):
        for _ in range(12):
            validate_request(self.body, make_request(make_token("user-a"), host="1.2.3.4"))
        with self.assertRaises(HTTPException) as ctx:
            validate_request(self.body, make_request(make_token("user-a"), host="1.2.3.4"))
        self.assertEqual(ctx.exception.status_code, 429)
        # Same proxy IP, different authenticated user is unaffected.
        self.assertEqual(validate_request(self.body, make_request(make_token("user-b"), host="1.2.3.4")), "user-b")

class StreamSanitizerTests(unittest.TestCase):
    def test_strips_think_and_markers_across_chunk_boundaries(self):
        sanitizer = StreamSanitizer()
        chunks = ["hello <th", "ink>secret</thi", "nk> world __FILTER", '_UPDATE__{"a":1}__END_FILTER_UPDATE__!', "done __"]
        out = "".join(sanitizer.feed(c) for c in chunks) + sanitizer.flush()
        self.assertEqual(out, "hello  world !done __")

    def test_drops_unterminated_marker(self):
        sanitizer = StreamSanitizer()
        self.assertEqual(sanitizer.feed("x<think>y"), "x")
        self.assertEqual(sanitizer.flush(), "")

if __name__ == '__main__':
    unittest.main()
