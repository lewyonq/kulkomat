import { TestBed } from '@angular/core/testing';

import { ActivityHistory } from './activity-history';

describe('ActivityHistory', () => {
  let service: ActivityHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
