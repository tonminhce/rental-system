import unittest
from unittest.mock import AsyncMock, patch
from pydantic import ValidationError
from minimax_app import SearchFilters, ChatRequest, run_tool, app

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
        from unittest.mock import Mock
        response = Mock()
        response.json.return_value = {'data': {'data': [{'id': 1, 'name': 'Example', 'password': 'secret'}]}}
        app.state.http = AsyncMock()
        app.state.http.get.return_value = response
        result, filters = await run_tool('search_homes', {'maxPrice': 20, 'url': 'https://untrusted.test'}, {'district': 'Bình Thạnh'})
        self.assertEqual(filters, {'district': 'Bình Thạnh', 'maxPrice': 20})
        self.assertNotIn('password', result['listings'][0])
        self.assertNotIn('url', app.state.http.get.call_args.kwargs['params'])

if __name__ == '__main__':
    unittest.main()
