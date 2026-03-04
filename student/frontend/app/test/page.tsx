'use client';

import { useAuth } from '../useAuth';

export default function Dashboard() {
    const { user, loading, error } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            {user ? (
                <div>
                    <p>Welcome, {user.email}!</p>
                    <p>Your user ID is: {user.id}</p>
                </div>
            ) : (
                <div>You are not logged in.</div>
            )}
        </div>
    );
}