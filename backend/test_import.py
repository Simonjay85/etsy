import sys
sys.path.insert(0, '.')
try:
    from app.main import app
    print("SUCCESS: app imported correctly")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
