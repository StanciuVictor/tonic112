import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import HealthScreen from './health-screen';
import { fetchHealth } from '../lib/health-client';

jest.mock('../lib/health-client');

describe('HealthScreen', () => {
  it('renders the health check response once loaded', async () => {
    (fetchHealth as jest.Mock).mockResolvedValue({
      status: 'ok',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <HealthScreen />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText(/API status: ok/)).toBeTruthy(),
    );

    unmount();
    queryClient.clear();
  });
});
