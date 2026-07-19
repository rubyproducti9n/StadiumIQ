import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CrowdProvider, useCrowd } from '../CrowdContext';

function TestComponent() {
  const { crowdData, updateCrowdData, storageError } = useCrowd();
  return (
    <div>
      <div data-testid="data">{JSON.stringify(crowdData)}</div>
      <div data-testid="error">{storageError || 'no-error'}</div>
      <button data-testid="update" onClick={() => updateCrowdData({ metlife: { match_id: 'metlife', home_team: 'USA' } })}>
        Update
      </button>
      <button data-testid="overwrite" onClick={() => updateCrowdData({ metlife: { match_id: 'metlife', home_team: 'Mex' } })}>
        Overwrite
      </button>
    </div>
  );
}

describe('CrowdContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hydrates from localStorage on mount', () => {
    const initialData = { metlife: { match_id: 'metlife', home_team: 'Canada' } };
    localStorage.setItem('stadiumiq_crowd_data', JSON.stringify(initialData));

    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );

    const dataEl = screen.getByTestId('data');
    expect(JSON.parse(dataEl.textContent)).toEqual(initialData);
  });

  it('handles corrupt localStorage JSON gracefully', () => {
    localStorage.setItem('stadiumiq_crowd_data', 'corrupted-json-here{');

    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );

    const dataEl = screen.getByTestId('data');
    expect(JSON.parse(dataEl.textContent)).toEqual({});
    expect(localStorage.getItem('stadiumiq_crowd_data')).toBeNull();
  });

  it('updates context after successful upload', async () => {
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );

    const dataEl = screen.getByTestId('data');
    expect(JSON.parse(dataEl.textContent)).toEqual({});

    const updateBtn = screen.getByTestId('update');
    await act(async () => {
      updateBtn.click();
    });

    expect(JSON.parse(dataEl.textContent)).toEqual({
      metlife: { match_id: 'metlife', home_team: 'USA' }
    });
    expect(JSON.parse(localStorage.getItem('stadiumiq_crowd_data'))).toEqual({
      metlife: { match_id: 'metlife', home_team: 'USA' }
    });
  });

  it('overwrites existing match_id on re-upload', async () => {
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );

    const updateBtn = screen.getByTestId('update');
    const overwriteBtn = screen.getByTestId('overwrite');

    await act(async () => {
      updateBtn.click();
    });
    await act(async () => {
      overwriteBtn.click();
    });

    const dataEl = screen.getByTestId('data');
    expect(JSON.parse(dataEl.textContent)).toEqual({
      metlife: { match_id: 'metlife', home_team: 'Mex' }
    });
  });
});
