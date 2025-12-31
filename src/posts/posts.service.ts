import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { createPostDto } from './dto/create-post.dto';
import { FindPostsQueryDto } from './dto/find-posts-query.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PaginationResponse } from 'src/common/interfaces/paginated-reponse.interfaces';

@Injectable()
export class PostsService {
  private postListCacheKeys: Set<string> = new Set();
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generatePostListCacheKey(query: FindPostsQueryDto): string {
    const { page = 1, limit = 2, title } = query;
    return `Posts list page ${page} limit ${limit} title ${title || 'all'}`;
  }

  async findAll(query: FindPostsQueryDto): Promise<PaginationResponse<Post>> {
    const cacheKey = this.generatePostListCacheKey(query);
    this.postListCacheKeys.add(cacheKey);
    const getCachedData =
      await this.cacheManager.get<PaginationResponse<Post>>(cacheKey);
    if (getCachedData) {
      console.log(`cache hit ------from cache ${cacheKey}`);
      return getCachedData;
    }
    console.log(`cache miss ------from db `);
    const { page = 1, limit = 2, title } = query;

    const skip = (page - 1) * limit;
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    if (title) {
      queryBuilder.andWhere('post.title LIKE :title', { title: `%${title}%` });
    }
    const [items, totalItems] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);
    const meta = {
      currentPage: page,
      itemCount: items.length,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };
    const paginationResponse: PaginationResponse<Post> = {
      Items: items,
      meta,
    };
    await this.cacheManager.set(cacheKey, paginationResponse, 30000);
    return paginationResponse;
  }
  async findOne(id: number): Promise<Post> {
    const cacheKey = `Post_ ${id}`;
    const cachedPost = await this.cacheManager.get<Post>(cacheKey);
    if (cachedPost) {
      console.log(`cache hit ------from cache ${cacheKey}`);
      return cachedPost;
    }
    console.log(`cache miss ------Retrieving post from db `);

    const singlePost = await this.postRepository.findOneBy({ id });

    if (!singlePost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, singlePost, 30000);
    return singlePost;
  }

  async create(createPostData: createPostDto): Promise<Post> {
    const newPost = this.postRepository.create({
      title: createPostData.title,
      content: createPostData.content,
      authorName: createPostData.authorName,
    });

    //invalidation of existing cache
    await this.invalidateAllExistingCache();

    return await this.postRepository.save(newPost);
  }

  async update(updatePostData: UpdatePostDto): Promise<Post> {
    const findPostToUpdate = await this.findOne(updatePostData.id);

    if (!findPostToUpdate) {
      throw new NotFoundException(
        `Post with ID ${updatePostData.id} not found`,
      );
    }

    if (updatePostData.authorName) {
      findPostToUpdate.authorName = updatePostData.authorName;
    }

    if (updatePostData.title) {
      findPostToUpdate.title = updatePostData.title;
    }

    if (updatePostData.content) {
      findPostToUpdate.content = updatePostData.content;
    }

    const updatedPost = await this.postRepository.save(findPostToUpdate);
    await this.cacheManager.del(`post_${findPostToUpdate.id}`);
    await this.invalidateAllExistingCache();
    return updatedPost;
  }

  async delete(id: number): Promise<Post> {
    const findPostToDelete = await this.findOne(id);

    if (!findPostToDelete) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.cacheManager.del(`post_${id}`);
    await this.invalidateAllExistingCache();

    return this.postRepository.remove(findPostToDelete);
  }

  private async invalidateAllExistingCache(): Promise<void> {
    console.log(`Invalidating ${this.postListCacheKeys.size} cache keys`);
    for (const cacheKey of this.postListCacheKeys) {
      await this.cacheManager.del(cacheKey);
    }
    this.postListCacheKeys.clear();
  }
}
