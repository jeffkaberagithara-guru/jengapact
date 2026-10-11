/**
 * Shared server-action result shape.
 *
 * Actions never throw for expected problems (missing authority, bad input,
 * stale state). They return this object so a client form can surface the reason
 * next to the control instead of showing an error boundary.
 */
export interface ActionState {
  error?: string;
  success?: string;
}

export const emptyActionState: ActionState = {};
