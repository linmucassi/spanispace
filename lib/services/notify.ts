// Email notifications for Spanispace Services. Server-only (service-role
// client + Resend key).
//
//   * New request  -> the provider ("New Painting request from Thandi").
//   * New request  -> the requester, once per request, as a confirmation.
//     Adding another provider to the same request doesn't send it again.
//   * New message  -> the other party, throttled to one email per unread
//     batch: no email if they're active in the chat right now, and no second
//     email until they've read the conversation since the last one.
//
// Every function is best effort. A failed or unconfigured send (Resend env
// vars missing, Issue #9) is logged and never fails the request that
// triggered it.

import type { Admin } from '@/lib/services/messaging';
import { sendEmail, serviceMessageEmail, serviceRequestReceivedEmail, serviceRequestSentEmail } from '@/lib/email';

// Someone who read the thread this recently is probably looking at it.
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

export const chatPath = (threadId: string) => `/candidate/services/chat/${threadId}`;
export const requestPath = (requestId: string) => `/candidate/services/hire/${requestId}`;

async function contactOf(admin: Admin, userId: string): Promise<{ email: string | null; name: string }> {
  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from('candidate_profiles').select('full_name').eq('user_id', userId).maybeSingle(),
  ]);
  const email = authUser?.user?.email ?? null;
  return { email, name: profile?.full_name || email?.split('@')[0] || 'there' };
}

async function safeSend(label: string, to: string | null, mail: { subject: string; html: string; text: string }) {
  if (!to) return false;
  try {
    const result = await sendEmail({ to, ...mail });
    if (!result.sent && result.reason !== 'not_configured') console.error(`[services/notify] ${label} not sent:`, result.reason);
    return result.sent;
  } catch (error) {
    console.error(`[services/notify] ${label} failed:`, error);
    return false;
  }
}

export async function notifyNewRequest(
  admin: Admin,
  { threadId, requestId, isNewRequest }: { threadId: string; requestId: string; isNewRequest: boolean },
) {
  try {
    const { data } = await admin
      .from('service_threads')
      .select('requester_user_id, provider:service_providers(user_id), request:service_requests(description, city, suburb, category:service_categories(name))')
      .eq('id', threadId)
      .maybeSingle();
    if (!data) return;
    const provider = Array.isArray(data.provider) ? data.provider[0] : data.provider;
    const request = Array.isArray(data.request) ? data.request[0] : data.request;
    const category = request ? (Array.isArray(request.category) ? request.category[0] : request.category) : null;
    if (!provider || !request) return;

    const [providerContact, requesterContact] = await Promise.all([
      contactOf(admin, provider.user_id),
      contactOf(admin, data.requester_user_id),
    ]);
    const categoryName = category?.name ?? 'service';

    await safeSend(
      'provider new-request email',
      providerContact.email,
      serviceRequestReceivedEmail({
        providerName: providerContact.name,
        requesterFirstName: requesterContact.name,
        category: categoryName,
        area: [request.suburb, request.city].filter(Boolean).join(', '),
        description: request.description,
        chatPath: chatPath(threadId),
      }),
    );

    if (isNewRequest) {
      await safeSend(
        'requester confirmation email',
        requesterContact.email,
        serviceRequestSentEmail({
          requesterName: requesterContact.name,
          category: categoryName,
          providerName: providerContact.name.split(' ')[0],
          description: request.description,
          requestPath: requestPath(requestId),
        }),
      );
    }
  } catch (error) {
    console.error('[services/notify] notifyNewRequest failed:', error);
  }
}

export async function notifyNewMessage(
  admin: Admin,
  { threadId, senderRole, body }: { threadId: string; senderRole: 'requester' | 'provider'; body: string },
) {
  try {
    const { data: thread } = await admin
      .from('service_threads')
      .select('requester_user_id, requester_last_read_at, provider_last_read_at, requester_last_emailed_at, provider_last_emailed_at, provider:service_providers(user_id), request:service_requests(category:service_categories(name))')
      .eq('id', threadId)
      .maybeSingle();
    if (!thread) return;
    const provider = Array.isArray(thread.provider) ? thread.provider[0] : thread.provider;
    const request = Array.isArray(thread.request) ? thread.request[0] : thread.request;
    const category = request ? (Array.isArray(request.category) ? request.category[0] : request.category) : null;
    if (!provider) return;

    const recipientIsRequester = senderRole === 'provider';
    const recipientId = recipientIsRequester ? thread.requester_user_id : provider.user_id;
    const senderId = recipientIsRequester ? provider.user_id : thread.requester_user_id;
    const lastRead = recipientIsRequester ? thread.requester_last_read_at : thread.provider_last_read_at;
    const lastEmailed = recipientIsRequester ? thread.requester_last_emailed_at : thread.provider_last_emailed_at;

    const now = Date.now();
    if (lastRead && now - new Date(lastRead).getTime() < ACTIVE_WINDOW_MS) return; // in the chat right now
    if (lastEmailed && (!lastRead || new Date(lastRead) < new Date(lastEmailed))) return; // already told, not read yet

    const [recipient, sender] = await Promise.all([contactOf(admin, recipientId), contactOf(admin, senderId)]);
    const sent = await safeSend(
      'new-message email',
      recipient.email,
      serviceMessageEmail({
        recipientName: recipient.name,
        senderName: sender.name,
        category: category?.name ?? 'service',
        preview: body,
        chatPath: chatPath(threadId),
      }),
    );
    if (sent) {
      await admin
        .from('service_threads')
        .update(recipientIsRequester ? { requester_last_emailed_at: new Date(now).toISOString() } : { provider_last_emailed_at: new Date(now).toISOString() })
        .eq('id', threadId);
    }
  } catch (error) {
    console.error('[services/notify] notifyNewMessage failed:', error);
  }
}
