import { prisma } from './prisma.js';

export async function createNotification({ type, title, body, forRoles, offerId, offerSlug, offerTitle, inquiryId }) {
  return prisma.notification.create({
    data: {
      type,
      title,
      body,
      forRoles,
      readBy: [],
      offerId: offerId || null,
      offerSlug: offerSlug || null,
      offerTitle: offerTitle || null,
      inquiryId: inquiryId || null,
    },
  });
}
