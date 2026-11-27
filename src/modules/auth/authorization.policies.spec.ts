import type { AuthActor } from './auth.repository';
import {
  canApprove,
  canCreateValidatedSource,
  canEditOwnPending,
  canManageRoles,
  canReject,
  canRestore,
  canSoftDelete,
  canSubmitProposal,
  canViewPublished,
} from './authorization.policies';

const publicActor = null;
const contributor: AuthActor = { userId: '1', role: 'contributor' };
const verifier: AuthActor = { userId: '2', role: 'verifier' };
const admin: AuthActor = { userId: '3', role: 'admin' };
const ownPending = { ownerId: '1', status: 'pending' as const };
const otherPending = { ownerId: '9', status: 'proposed' as const };

describe('authorization policies', () => {
  it('allows public published reads and authenticated proposal/source creation', () => {
    expect(canViewPublished(publicActor, { status: 'verified' })).toBeTrue();
    expect(canViewPublished(publicActor, { status: 'proposed' })).toBeFalse();
    expect(canViewPublished(publicActor, { status: 'superseded', deletedAt: new Date() })).toBeFalse();
    expect(canSubmitProposal(publicActor)).toBeFalse();
    expect(canSubmitProposal(contributor)).toBeTrue();
    expect(canSubmitProposal(verifier)).toBeTrue();
    expect(canSubmitProposal(admin)).toBeTrue();
    expect(canCreateValidatedSource(contributor, true)).toBeTrue();
    expect(canCreateValidatedSource(contributor, false)).toBeFalse();
  });

  it('limits pending edits to the owner and pending state', () => {
    expect(canEditOwnPending(contributor, ownPending)).toBeTrue();
    expect(canEditOwnPending(verifier, ownPending)).toBeFalse();
    expect(canEditOwnPending(contributor, otherPending)).toBeFalse();
    expect(canEditOwnPending(contributor, { ...ownPending, status: 'verified' })).toBeFalse();
    expect(canEditOwnPending(contributor, { ...ownPending, deletedAt: new Date() })).toBeFalse();
  });

  it('allows verifier/admin reviews of others only, including no admin self-approval', () => {
    expect(canApprove(verifier, otherPending)).toBeTrue();
    expect(canApprove(contributor, otherPending)).toBeFalse();
    expect(canApprove(admin, { ...otherPending, ownerId: admin.userId })).toBeFalse();
    expect(canApprove(admin, otherPending)).toBeTrue();
    expect(canReject(verifier, otherPending, 'reason')).toBeTrue();
    expect(canReject(verifier, otherPending, '  ')).toBeFalse();
  });

  it('allows verifier/admin soft delete and restoration only in the matching state', () => {
    expect(canSoftDelete(verifier, otherPending)).toBeTrue();
    expect(canSoftDelete(contributor, otherPending)).toBeFalse();
    expect(canRestore(admin, { ...otherPending, deletedAt: new Date() })).toBeTrue();
    expect(canRestore(admin, otherPending)).toBeFalse();
  });

  it('restricts user role management to admins', () => {
    expect(canManageRoles(contributor)).toBeFalse();
    expect(canManageRoles(verifier)).toBeFalse();
    expect(canManageRoles(admin)).toBeTrue();
    expect(canManageRoles(publicActor)).toBeFalse();
  });
});