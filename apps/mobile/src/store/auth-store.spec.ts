import { AuthUser } from '@tonic112/shared-types';
import { useAuthStore } from './auth-store';
import * as authClient from '../lib/auth-client';
import * as storage from '../lib/storage';

jest.mock('../lib/auth-client');
jest.mock('../lib/storage');

const mockUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  isAdmin: false,
  canCreateParty: false,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, status: 'idle' });
    jest.clearAllMocks();
  });

  it('sets authenticated state and persists the token on login', async () => {
    (authClient.login as jest.Mock).mockResolvedValue({
      accessToken: 'token-123',
      user: mockUser,
    });

    await useAuthStore
      .getState()
      .login({ email: mockUser.email, password: 'Password1!' });

    expect(storage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      'token-123',
    );
    expect(useAuthStore.getState()).toMatchObject({
      user: mockUser,
      token: 'token-123',
      status: 'authenticated',
    });
  });

  it('sets authenticated state and persists the token on register', async () => {
    (authClient.register as jest.Mock).mockResolvedValue({
      accessToken: 'token-456',
      user: mockUser,
    });

    await useAuthStore.getState().register({
      email: mockUser.email,
      password: 'Password1!',
      name: mockUser.name,
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      'token-456',
    );
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('clears the stored token and resets state on logout', async () => {
    useAuthStore.setState({
      user: mockUser,
      token: 'token-123',
      status: 'authenticated',
    });

    await useAuthStore.getState().logout();

    expect(storage.deleteItem).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      status: 'unauthenticated',
    });
  });

  it('restores an authenticated session when a stored token is still valid', async () => {
    (storage.getItem as jest.Mock).mockResolvedValue('token-123');
    (authClient.fetchMe as jest.Mock).mockResolvedValue(mockUser);

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState()).toMatchObject({
      user: mockUser,
      token: 'token-123',
      status: 'authenticated',
    });
  });

  it('clears a stale token and marks unauthenticated when session restore fails', async () => {
    (storage.getItem as jest.Mock).mockResolvedValue('stale-token');
    (authClient.fetchMe as jest.Mock).mockRejectedValue(
      new Error('Unauthorized'),
    );

    await useAuthStore.getState().restoreSession();

    expect(storage.deleteItem).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      status: 'unauthenticated',
    });
  });

  it('marks unauthenticated immediately when no token is stored', async () => {
    (storage.getItem as jest.Mock).mockResolvedValue(null);

    await useAuthStore.getState().restoreSession();

    expect(authClient.fetchMe).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
