class _FakeTask:
    def apply_async(self, **kwargs):
        return type("R", (), {"id": "stub"})()

run_batch_generate   = _FakeTask()
run_batch_render     = _FakeTask()
run_bulk_listing_gen = _FakeTask()
run_full_pipeline    = _FakeTask()
