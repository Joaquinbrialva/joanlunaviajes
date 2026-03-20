import { prisma } from './prisma.js';

export async function createNotification({
  type, title, body, forRoles,
  offerId, offerSlug, offerTitle,
  destinationId, destinationSlug, destinationName,
  inquiryId,
}) {
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
      destinationId: destinationId || null,
      destinationSlug: destinationSlug || null,
      destinationName: destinationName || null,
      inquiryId: inquiryId || null,
    },
  });
}
