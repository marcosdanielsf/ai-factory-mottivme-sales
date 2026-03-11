/**
 * CallsRealizadas - Legacy redirect
 *
 * This page has been replaced by ColdCallDashboard.
 * The route /calls now redirects to /cold-calls.
 * Keeping this file for backward compatibility.
 */
import { Navigate } from 'react-router-dom';

export const CallsRealizadas = () => <Navigate to="/cold-calls" replace />;
