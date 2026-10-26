#!/usr/bin/env python3
"""
Quickstart Example — Exchange SaaS Python SDK (V4.0)
Usage: EXCHANGE_API_KEY="sk_live_..." python3 examples/python_quickstart.py
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../sdk/python")))
from exchange_sdk import ExchangeClient, ExchangeAPIError


def main() -> None:
    api_key = os.getenv("EXCHANGE_API_KEY", "sk_live_your_api_key")
    client = ExchangeClient(
        api_key=api_key,
        base_url="https://api.l.lc/exchange",
        lang="en",
        client_host="https://yourdomain.com",
    )
    try:
        health = client.check_health()
        print("[Health]:", health)

        conv = client.convert("USD", "VND", amount=100, lang="vi")
        print(f"[Convert VI]: 100 USD = {conv.get('result')} VND ({conv.get('message')})")
    except ExchangeAPIError as e:
        print(f"API Error [{e.status_code} {e.error_code}]: {e.message}")


if __name__ == "__main__":
    main()
