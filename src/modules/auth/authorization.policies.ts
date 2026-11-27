import type { AuthActor, AuthRole } from './auth.repository';

export type ProposalStatus = 'pending' | 'proposed' | 'verified' | 'rejected' | 'superseded';

export interface ProposalFacts {
  ownerId: string;
  status: ProposalStatus;
  reviewedBy?: string | null;
  deletedAt?: Date | null;
}

export interface PublishedResourceFacts {
  status: ProposalStatus;
  deletedAt?: Date | null;
}

const CONTRIBUTOR_ROLES: readonly AuthRole[] = ['contributor', 'verifier', 'admin'];
const REVIEWER_ROLES: readonly AuthRole[] = ['verifier', 'admin'];

export function canViewPublished(
  actor: AuthActor | null,
  resource: PublishedResourceFacts,
): boolean {
  const isPubliclyVisible = resource.status === 'verified' || resource.status === 'superseded';
  return isPubliclyVisible
    && !resource.deletedAt
    && (actor === null || isSupportedActor(actor));
}

export function canSubmitProposal(actor: AuthActor | null): boolean {
  return actor !== null && isSupportedActor(actor) && CONTRIBUTOR_ROLES.includes(actor.role);
}

export function canCreateValidatedSource(actor: AuthActor | null, metadataValidated: boolean): boolean {
  return metadataValidated && canSubmitProposal(actor);
}

export function canEditOwnPending(actor: AuthActor | null, proposal: ProposalFacts): boolean {
  return actor !== null
    && isSupportedActor(actor)
    && CONTRIBUTOR_ROLES.includes(actor.role)
    && actor.userId === proposal.ownerId
    && isPending(proposal.status)
    && !proposal.deletedAt;
}

export function canReviewOther(actor: AuthActor | null, proposal: ProposalFacts): boolean {
  return actor !== null
    && isSupportedActor(actor)
    && REVIEWER_ROLES.includes(actor.role)
    && actor.userId !== proposal.ownerId
    && isPending(proposal.status)
    && !proposal.deletedAt;
}

export function canApprove(actor: AuthActor | null, proposal: ProposalFacts): boolean {
  return canReviewOther(actor, proposal);
}

export function canReject(
  actor: AuthActor | null,
  proposal: ProposalFacts,
  reason: string,
): boolean {
  return reason.trim().length > 0 && canReviewOther(actor, proposal);
}

export function canSoftDelete(actor: AuthActor | null, proposal: ProposalFacts): boolean {
  return actor !== null
    && isSupportedActor(actor)
    && REVIEWER_ROLES.includes(actor.role)
    && !proposal.deletedAt;
}

export function canRestore(actor: AuthActor | null, proposal: ProposalFacts): boolean {
  return actor !== null
    && isSupportedActor(actor)
    && REVIEWER_ROLES.includes(actor.role)
    && Boolean(proposal.deletedAt);
}

export function canManageRoles(actor: AuthActor | null): boolean {
  return actor !== null && isSupportedActor(actor) && actor.role === 'admin';
}

function isPending(status: ProposalStatus): boolean {
  return status === 'pending' || status === 'proposed';
}

function isSupportedActor(actor: AuthActor): boolean {
  return CONTRIBUTOR_ROLES.includes(actor.role) && actor.userId.length > 0;
}