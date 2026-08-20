import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  buildPaginationParams,
} from './pagination';

describe('pagination helpers', () => {
  it('falls back to defaults when query is empty', () => {
    expect(buildPaginationParams({})).toEqual({
      page: PAGINATION_DEFAULT_PAGE,
      pageSize: PAGINATION_DEFAULT_PAGE_SIZE,
      skip: 0,
    });
  });

  it('computes skip from page and pageSize', () => {
    expect(buildPaginationParams({ page: 3, pageSize: 25 })).toEqual({
      page: 3,
      pageSize: 25,
      skip: 50,
    });
  });

  it('builds meta with totalPages = ceil(total / pageSize)', () => {
    expect(buildPaginationMeta(23, 2, 10)).toEqual({
      total: 23,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });
  });

  it('forces totalPages to at least 1 when total is 0', () => {
    expect(buildPaginationMeta(0, 1, 10)).toEqual({
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
  });
});
