
import { PrismaClient } from '@prisma/client';

import {
  FindSourcesPageArgs,
  SourceDetail,
  SourceSummary,
  SourcesRepository,
} from './sources.repository';

export class PrismaSourcesRepository implements SourcesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPage(
    args: FindSourcesPageArgs
  ): Promise<{ items: SourceSummary[]; totalItems: number }> {
    const where = {
      ...(args.type !== undefined && { type: args.type }),
      ...(args.publicationYear !== undefined && {
        publicationYear: args.publicationYear,
      }),
    };

    const [sources, totalItems] = await this.prisma.$transaction([
      this.prisma.source.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          publicationYear: true,
          author: true,
          updatedAt: true,
        },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip: args.skip,
        take: args.take,
      }),
      this.prisma.source.count({ where }),
    ]);

    const items: SourceSummary[] = sources.map((source) => ({
      id: Number(source.id),
      title: source.title,
      type: source.type,
      publicationYear: source.publicationYear,
      author: source.author,
      updatedAt: source.updatedAt.toISOString(),
    }));

    return { items, totalItems };
  }

  async findById(id: number): Promise<SourceDetail | null> {
    const source = await this.prisma.source.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        title: true,
        type: true,
        publicationYear: true,
        author: true,
        updatedAt: true,
        publisher: true,
        url: true,
      },
    });

    if (!source) {
      return null;
    }

    return {
      id: Number(source.id),
      title: source.title,
      type: source.type,
      publicationYear: source.publicationYear,
      author: source.author,
      updatedAt: source.updatedAt.toISOString(),
      publisher: source.publisher,
      url: source.url,
    };
  }
}
