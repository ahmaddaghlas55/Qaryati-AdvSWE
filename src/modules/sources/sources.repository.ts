
export interface SourceSummary {
  id: number;
  title: string;
  type: string;
  publicationYear: number | null;
  author: string | null;
  updatedAt: string;
}

export interface SourceDetail extends SourceSummary {
  publisher: string | null;
  url: string | null;
}

export interface FindSourcesPageArgs {
  type?: string;
  publicationYear?: number;
  skip: number;
  take: number;
}

export interface SourcesRepository {
  findPage(args: FindSourcesPageArgs): Promise<{
    items: SourceSummary[];
    totalItems: number;
  }>;

  findById(id: number): Promise<SourceDetail | null>;
}
