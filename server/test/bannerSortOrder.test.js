const test = require("node:test");
const assert = require("node:assert/strict");
const { planBannerSortOrderRepairs } = require("../src/utils/bannerSortOrder");

test("assigns an invalid banner order after all occupied positive orders", () => {
    const repairs = planBannerSortOrderRepairs([
        { id: "invalid", sortOrder: 0 },
        { id: "first", sortOrder: 1 },
        { id: "second", sortOrder: 2 },
    ]);

    assert.deepEqual(repairs, [{ id: "invalid", sortOrder: 3 }]);
});

test("keeps the first owner and repairs duplicate banner orders without collisions", () => {
    const repairs = planBannerSortOrderRepairs([
        { id: "first", sortOrder: 1 },
        { id: "duplicate", sortOrder: 1 },
        { id: "third", sortOrder: 3 },
    ]);

    assert.deepEqual(repairs, [{ id: "duplicate", sortOrder: 2 }]);
});

test("does not update an already valid banner order set", () => {
    const repairs = planBannerSortOrderRepairs([
        { id: "first", sortOrder: 1 },
        { id: "second", sortOrder: 2 },
        { id: "fifth", sortOrder: 5 },
    ]);

    assert.deepEqual(repairs, []);
});
