import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string, name?: string) {
    const normalized = email.toLowerCase().trim();
    const sub = await this.prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      update: { name: name ?? undefined },
      create: { email: normalized, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return { ok: true, subscriber: sub };
  }
}