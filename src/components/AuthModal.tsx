import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogleCredential, loginAsGuest, user } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6 text-on-surface">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
            <span className="material-symbols-outlined text-3xl">shield_person</span>
          </div>
          <h2 className="font-display-lg text-xl font-bold text-on-surface">
            Disaster Command Access
          </h2>
          <p className="font-body-md text-xs text-on-surface-variant max-w-xs">
            Sign in with your Google account for Commander authority, or continue in Guest Observer mode.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {/* Google Sign-In Container */}
          <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  loginWithGoogleCredential(credentialResponse.credential);
                }
              }}
              onError={() => {
                console.error('Google Sign-In Error');
              }}
              useOneTap
              theme="filled_blue"
              shape="pill"
              text="continue_with"
              width="100%"
            />
          </div>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-outline-variant"></div>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              OR
            </span>
            <div className="flex-1 h-px bg-outline-variant"></div>
          </div>

          {/* Continue as Guest Button */}
          <button
            onClick={loginAsGuest}
            className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-label-md text-xs font-bold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-on-surface-variant">person_outline</span>
            Continue as Guest Observer
          </button>
        </div>

        {/* Current Status Footer */}
        <div className="border-t border-outline-variant pt-4 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>Active Mode:</span>
          <span className="font-bold text-primary font-mono">
            {user?.isGuest ? '👤 Guest Observer' : `🟢 ${user?.name}`}
          </span>
        </div>
      </div>
    </div>
  );
};
