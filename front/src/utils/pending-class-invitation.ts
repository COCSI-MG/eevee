const PENDING_CLASS_INVITATION_KEY = "pending-class-invitation";

export const getPendingClassInvitation = (): string | null => {
  return  window.sessionStorage.getItem(PENDING_CLASS_INVITATION_KEY);
}

export const setPendingClassInvitation = (token: string): void => {
  window.sessionStorage.setItem(PENDING_CLASS_INVITATION_KEY, token);
};

export const clearPendingClassInvitation = (): void => {
  window.sessionStorage.removeItem(PENDING_CLASS_INVITATION_KEY);
};
