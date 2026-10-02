"""Backend tests for XtruShield/Sentiren proxy — market/pulse/fng/news/AI."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://shield-custody.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --------------------------- Health --------------------------- #
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("ok") is True


# --------------------------- Market quotes --------------------------- #
class TestMarketQuotes:
    def test_quotes_live_full_symbol_set(self, client):
        symbols = "BTC,ETH,BNB,TRX,USDT,USDC,DAI,LINK,MATIC"
        r = client.get(f"{API}/market/quotes", params={"symbols": symbols})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("live") is True, f"live flag not true: {body}"
        assert "dataTimestamp" in body
        quotes = body.get("quotes", [])
        assert len(quotes) >= 5, f"expected >=5 quotes, got {len(quotes)}"

        by_sym = {q["symbol"]: q for q in quotes}
        # Core symbols required by Home UI
        for sym in ["BTC", "ETH", "BNB", "TRX", "USDT"]:
            assert sym in by_sym, f"missing {sym} in quotes"
            q = by_sym[sym]
            assert isinstance(q["price"], (int, float))
            assert q["price"] > 0, f"{sym} price non-positive: {q['price']}"
            assert "change24h" in q
            assert isinstance(q["sparkline"], list)
            assert len(q["sparkline"]) >= 8, f"{sym} sparkline too short"

    def test_btc_price_reasonable(self, client):
        r = client.get(f"{API}/market/quotes", params={"symbols": "BTC"})
        assert r.status_code == 200
        q = r.json()["quotes"][0]
        # Sanity check — BTC should be well above $1000
        assert q["price"] > 1000, f"BTC price implausible: {q['price']}"


# --------------------------- Market pulse --------------------------- #
class TestMarketPulse:
    def test_pulse_has_gainer_and_loser(self, client):
        r = client.get(f"{API}/market/pulse")
        assert r.status_code == 200
        body = r.json()
        assert body.get("topGainer") is not None, body
        assert body.get("topLoser") is not None, body
        for k in ("symbol", "name", "change24h", "price"):
            assert k in body["topGainer"]
            assert k in body["topLoser"]


# --------------------------- Fear & Greed --------------------------- #
class TestFNG:
    def test_fng_value_and_classification(self, client):
        r = client.get(f"{API}/sentiment/fng")
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body.get("value"), int)
        assert 0 <= body["value"] <= 100
        assert isinstance(body.get("classification"), str)
        assert body["classification"]


# --------------------------- News --------------------------- #
class TestNews:
    def test_news_latest_limit(self, client):
        r = client.get(f"{API}/news/latest", params={"limit": 3})
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) == 3
        for it in items:
            assert "title" in it and it["title"]
            assert "source" in it


# --------------------------- AI insight --------------------------- #
class TestAI:
    def test_ai_insight_non_empty(self, client):
        payload = {"context": "Portfolio: BTC 0.05, ETH 0.5. Market: BTC +2%, ETH -1%. FNG: 60 Greed."}
        r = client.post(f"{API}/ai/insight", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "insight" in body
        assert isinstance(body["insight"], str)
        assert len(body["insight"].strip()) > 0
