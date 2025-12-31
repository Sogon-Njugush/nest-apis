import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';

import { createPostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostExistsPipe } from './pipe/post-exists.pipe';
import { Post as PostEntity } from './entities/post.entity';
import { Throttle } from '@nestjs/throttler';
import { FindPostsQueryDto } from './dto/find-posts-query.dto';
import { PaginationResponse } from 'src/common/interfaces/paginated-reponse.interfaces';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Throttle({ long: { limit: 10, ttl: 60000 } })
  async findAll(
    @Query() query: FindPostsQueryDto,
  ): Promise<PaginationResponse<PostEntity>> {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe, PostExistsPipe) id: number,
  ): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    createPostData: createPostDto,
  ): Promise<PostEntity> {
    return this.postsService.create(createPostData);
  }

  @Patch()
  async update(
    // @Param('id', ParseIntPipe) id: number,
    @Body()
    updatePostData: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.update(updatePostData);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe, PostExistsPipe) id: number,
  ): Promise<PostEntity> {
    return this.postsService.delete(id);
  }
}
