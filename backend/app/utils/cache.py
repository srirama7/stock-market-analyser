"""Simple in-memory TTL cache for market data."""

import time
from typing import Any, Optional
from collections import OrderedDict


class TTLCache:
    def __init__(self, default_ttl: int = 60, max_size: int = 1000):
        self._cache: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._default_ttl = default_ttl
        self._max_size = max_size

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, expiry = self._cache[key]
            if time.time() < expiry:
                self._cache.move_to_end(key)
                return value
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        if key in self._cache:
            del self._cache[key]
        if len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)
        self._cache[key] = (value, time.time() + (ttl or self._default_ttl))

    def delete(self, key: str):
        self._cache.pop(key, None)

    def clear(self):
        self._cache.clear()


# Global cache instances
quote_cache = TTLCache(default_ttl=5, max_size=200)
history_cache = TTLCache(default_ttl=300, max_size=100)
info_cache = TTLCache(default_ttl=3600, max_size=200)
