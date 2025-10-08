from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_get_current_time(client: TestClient):
    """Test that the /time endpoint returns the current time in ISO format."""
    response = client.get("/time")

    # Check status code
    assert response.status_code == 200

    # Check response structure
    data = response.json()
    assert "current_time" in data

    # Verify the returned time is a valid ISO format
    try:
        datetime.fromisoformat(data["current_time"])
    except ValueError:
        pytest.fail("Returned time is not in valid ISO format")

    # Verify the returned time is close to current time
    # (within 10 seconds to account for test execution time)
    current_time = datetime.now()
    returned_time = datetime.fromisoformat(data["current_time"])
    time_difference = abs((current_time - returned_time).total_seconds())
    assert time_difference < 10, "Returned time is too far from current time"
