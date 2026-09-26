import { MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext';
import { ToastProvider } from '@/context/ToastContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAdmin, RequireAuth } from '@/components/layout/Guards';
import { LoadingState } from '@/components/ui/States';
import HomePage from '@/pages/HomePage';

// Route-level code splitting: only the home page ships in the first bundle.
const MoviesPage = lazy(() => import('@/pages/MoviesPage'));
const MovieDetailsPage = lazy(() => import('@/pages/MovieDetailsPage'));
const TheatresPage = lazy(() => import('@/pages/TheatresPage'));
const TheatreDetailsPage = lazy(() => import('@/pages/TheatreDetailsPage'));
const SelectShowPage = lazy(() => import('@/pages/SelectShowPage'));
const SeatSelectionPage = lazy(() => import('@/pages/SeatSelectionPage'));
const CheckoutSummaryPage = lazy(() => import('@/pages/CheckoutSummaryPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const BookingConfirmationPage = lazy(() => import('@/pages/BookingConfirmationPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminMoviesPage = lazy(() => import('@/pages/admin/AdminMoviesPage'));
const AdminTheatresPage = lazy(() => import('@/pages/admin/AdminTheatresPage'));
const AdminShowsPage = lazy(() => import('@/pages/admin/AdminShowsPage'));
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));

const auth = (el: React.ReactNode) => <RequireAuth>{el}</RequireAuth>;

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:slug', element: <MovieDetailsPage /> },
      { path: 'theatres', element: <TheatresPage /> },
      { path: 'theatres/:slug', element: <TheatreDetailsPage /> },
      { path: 'book/:slug', element: <SelectShowPage /> },
      { path: 'book/show/:showId/seats', element: <SeatSelectionPage /> },
      { path: 'checkout/:bookingId/summary', element: auth(<CheckoutSummaryPage />) },
      { path: 'checkout/:bookingId/pay', element: auth(<PaymentPage />) },
      { path: 'booking/:bookingId', element: auth(<BookingConfirmationPage />) },
      { path: 'tickets/:bookingId', element: auth(<BookingConfirmationPage fresh={false} />) },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'my-bookings', element: auth(<MyBookingsPage />) },
      { path: 'profile', element: auth(<ProfilePage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin/login',
    element: (
      <Suspense fallback={<LoadingState className="min-h-dvh" />}>
        <AdminLoginPage />
      </Suspense>
    ),
  },
  {
    path: 'admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'movies', element: <AdminMoviesPage /> },
      { path: 'theatres', element: <AdminTheatresPage /> },
      { path: 'shows', element: <AdminShowsPage /> },
      { path: 'bookings', element: <AdminBookingsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
    ],
  },
]);

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <BookingProvider>
            <RouterProvider router={router} />
          </BookingProvider>
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
