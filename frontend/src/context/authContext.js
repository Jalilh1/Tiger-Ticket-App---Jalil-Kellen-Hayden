import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // CHANGED: centralize base URL via env var with a safe default
    const AUTH_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:5004';

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            verifyToken(storedToken);
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verifyToken = async (tokenToVerify) => {
        try {
            // CHANGED: use AUTH_URL
            const response = await fetch(`${AUTH_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${tokenToVerify}` }
            });

            if (response.ok) {
                const data = await response.json();

                // CHANGED: accept both { user: {...} } and { id/email/name... } shapes
                const resolvedUser = data?.user ?? data;

                setToken(tokenToVerify);
                setUser(resolvedUser && resolvedUser.email ? resolvedUser : null);
                if (!resolvedUser || !resolvedUser.email) {
                    // if shape still isn't right, clear token to avoid stuck state
                    localStorage.removeItem('token');
                    setToken(null);
                }
            } else {
                localStorage.removeItem('token');
                setToken(null);
            }
        } catch (error) {
            console.error('Failed to verify token:', error);
            localStorage.removeItem('token');
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            // CHANGED: use AUTH_URL
            const response = await fetch(`${AUTH_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            // Some backends return JSON on error, some return text—handle both.
            const text = await response.text();
            const data = text ? (() => { try { return JSON.parse(text); } catch { return { error: text }; } })() : {};

            if (response.ok) {
                // CHANGED: accept both shapes
                const receivedToken = data.token;
                const resolvedUser = data?.user ?? data;

                if (receivedToken && resolvedUser?.email) {
                    setToken(receivedToken);
                    setUser(resolvedUser);
                    localStorage.setItem('token', receivedToken);
                    return { success: true };
                }
                return { success: false, error: 'Unexpected login response shape' };
            } else {
                return { success: false, error: data?.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const register = async (email, name, password) => {
        try {
            // CHANGED: use AUTH_URL
            const response = await fetch(`${AUTH_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password })
            });

            const text = await response.text();
            const data = text ? (() => { try { return JSON.parse(text); } catch { return { error: text }; } })() : {};

            if (response.ok) {
                // Some backends DO NOT return a token on register; they only return user.
                // To be robust, if no token is returned, immediately call login().
                const receivedToken = data.token;
                const resolvedUser = data?.user ?? data;

                if (receivedToken && resolvedUser?.email) {
                    setToken(receivedToken);
                    setUser(resolvedUser);
                    localStorage.setItem('token', receivedToken);
                    return { success: true };
                }
                // Fallback: try logging in right after registration
                const loginResult = await login(email, password);
                return loginResult.success ? { success: true } : { success: false, error: loginResult.error || 'Post-register login failed' };
            } else {
                return { success: false, error: data?.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}